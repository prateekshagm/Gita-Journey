import { NextFunction, Request, Response } from 'express';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { sessions, users } from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';
import { hashSessionToken } from '../lib/security.ts';

export const SESSION_COOKIE_NAME = 'gj_session';

export interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  role: 'reader' | 'content_editor' | 'system_admin';
  authProvider: string;
  sessionId?: string;
}

export interface AuthRequest extends Request {
  authUser?: AuthenticatedUser;
}

function isConfiguredAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS || '';
  if (!raw.trim()) return false;
  const list = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function upsertFirebaseUser(
  uid: string,
  email: string,
  displayName: string
): Promise<AuthenticatedUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const safeName = displayName.trim() || normalizedEmail.split('@')[0] || 'Reader';
  const role: AuthenticatedUser['role'] = isConfiguredAdminEmail(normalizedEmail)
    ? 'system_admin'
    : 'reader';

  const existingByEmail = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingByEmail.length > 0) {
    const existing = existingByEmail[0];
    const [updated] = await db
      .update(users)
      .set({
        uid,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
        role: isConfiguredAdminEmail(normalizedEmail) ? 'system_admin' : existing.role,
      })
      .where(eq(users.id, existing.id))
      .returning();

    return {
      id: updated.id,
      uid: updated.uid,
      email: updated.email,
      displayName: updated.displayName,
      role: updated.role as AuthenticatedUser['role'],
      authProvider: updated.authProvider,
    };
  }

  const [inserted] = await db
    .insert(users)
    .values({
      uid,
      email: normalizedEmail,
      displayName: safeName,
      role,
      authProvider: 'google',
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email: normalizedEmail,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();

  return {
    id: inserted.id,
    uid: inserted.uid,
    email: inserted.email,
    displayName: inserted.displayName,
    role: inserted.role as AuthenticatedUser['role'],
    authProvider: inserted.authProvider,
  };
}

export async function resolveAuthUser(req: Request): Promise<AuthenticatedUser | null> {
  // 1. Check HttpOnly session cookie first
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  if (cookieToken && typeof cookieToken === 'string') {
    const tokenHash = hashSessionToken(cookieToken);
    const now = new Date();
    const rows = await db
      .select({
        sessionId: sessions.id,
        id: users.id,
        uid: users.uid,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        authProvider: users.authProvider,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, now)
        )
      )
      .limit(1);

    if (rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id,
        uid: r.uid,
        email: r.email,
        displayName: r.displayName,
        role: r.role as AuthenticatedUser['role'],
        authProvider: r.authProvider,
        sessionId: r.sessionId,
      };
    }
  }

  // 2. Fallback: Bearer Firebase ID token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.slice('Bearer '.length).trim();
    if (!idToken) return null;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      if (!decoded.email) return null;
      return await upsertFirebaseUser(
        decoded.uid,
        decoded.email,
        decoded.name || decoded.email.split('@')[0]
      );
    } catch {
      return null;
    }
  }

  return null;
}

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const user = await resolveAuthUser(req);
    if (user) {
      req.authUser = user;
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await resolveAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    req.authUser = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const requireContentEditor = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.authUser.role !== 'content_editor' && req.authUser.role !== 'system_admin') {
    return res.status(403).json({ error: 'Content editor or system administrator access required' });
  }
  next();
};

export const requireSystemAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.authUser.role !== 'system_admin') {
    return res.status(403).json({ error: 'System administrator access required' });
  }
  next();
};

/**
 * CSRF protection for mutating API routes:
 * Validates Origin/Referer when present against the request Host or APP_URL.
 */
export const csrfOriginGuard = (req: Request, res: Response, next: NextFunction) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method.toUpperCase())) {
    return next();
  }
  const origin = req.headers.origin;
  if (origin) {
    const host = req.headers.host;
    try {
      const originHost = new URL(origin).host;
      const appHost = process.env.APP_URL ? new URL(process.env.APP_URL).host : null;
      if (originHost !== host && (!appHost || originHost !== appHost)) {
        return res.status(403).json({ error: 'CSRF validation failed: origin mismatch' });
      }
    } catch {
      return res.status(403).json({ error: 'CSRF validation failed: invalid origin' });
    }
  }
  next();
};
