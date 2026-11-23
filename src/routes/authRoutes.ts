import crypto from 'node:crypto';
import { Router, Request, Response } from 'express';
import { and, desc, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.ts';
import {
  bookmarks,
  chapterUnlocks,
  gardenItems,
  highlights,
  notificationDeliveryLogs,
  notificationPreferences,
  quizAttempts,
  readingProgress,
  reflections,
  sessions,
  userAchievements,
  userPreferences,
  users,
  xpTransactions,
} from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';
import {
  checkRateLimit,
  generateSessionToken,
  hashPassword,
  sanitizePlainText,
  verifyPassword,
} from '../lib/security.ts';
import {
  AuthRequest,
  SESSION_COOKIE_NAME,
  optionalAuth,
  requireAuth,
  upsertFirebaseUser,
} from '../middleware/auth.ts';
import {
  getUserStateBundle,
  initializeUserDefaults,
  migrateGuestStateTransactional,
} from '../services/userService.ts';

const router = Router();

const guestPayloadSchema = z
  .object({
    theme: z.enum(['krishna', 'radha_shyamasundara', 'gauranga']).optional(),
    language: z.string().min(2).max(10).optional(),
    dailyVerseTarget: z.number().int().min(1).max(50).optional(),
    missionMode: z.string().max(40).optional(),
    readerMode: z.enum(['light', 'dark', 'sepia']).optional(),
    fontSize: z.number().int().min(14).max(28).optional(),
    selectedEnvironment: z
      .enum(['yamuna_sanctuary', 'vrindavan_grove', 'temple_courtyard', 'navadvipa_dawn'])
      .optional(),
    completedVerses: z.array(z.string().max(12)).max(700).optional(),
    bookmarks: z.array(z.string().max(12)).max(700).optional(),
    reflections: z
      .array(
        z.object({
          verseCode: z.string().max(12),
          note: z.string().max(2000),
        })
      )
      .max(200)
      .optional(),
    acceptedQuests: z.array(z.string().max(60)).max(20).optional(),
    completedChallenges: z.array(z.string().max(80)).max(50).optional(),
  })
  .optional();

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(80),
  theme: z.enum(['krishna', 'radha_shyamasundara', 'gauranga']).optional(),
  language: z.string().min(2).max(10).optional(),
  dailyVerseTarget: z.number().int().min(1).max(50).optional(),
  timezone: z.string().max(64).optional(),
  notificationConsent: z.boolean().optional(),
  guestState: guestPayloadSchema,
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
  guestState: guestPayloadSchema,
});

function setSessionCookie(res: Response, rawToken: string) {
  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

async function createDbSession(userId: number, req: Request) {
  const { rawToken, tokenHash } = generateSessionToken();
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({
    id,
    userId,
    tokenHash,
    userAgent: sanitizePlainText(String(req.headers['user-agent'] || 'Unknown'), 240),
    ipAddress: sanitizePlainText(String(req.ip || 'Unknown'), 64),
    expiresAt,
  });
  return { rawToken, sessionId: id };
}

function isConfiguredAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS || '';
  if (!raw.trim()) return false;
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

router.post('/register', async (req: Request, res: Response) => {
  const ip = req.ip || 'unknown';
  const rl = checkRateLimit(`register:${ip}`, 15, 15 * 60 * 1000);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Too many registration attempts. Please try again in ${rl.retryAfterSeconds}s.`,
    });
  }

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Invalid registration details.',
    });
  }

  try {
    const email = parsed.data.email.trim().toLowerCase();
    const displayName = sanitizePlainText(parsed.data.displayName, 80);
    if (!displayName) {
      return res.status(400).json({ error: 'Display name is required.' });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const uid = `local_${crypto.randomUUID()}`;
    const role = isConfiguredAdminEmail(email) ? 'system_admin' : 'reader';

    const [created] = await db
      .insert(users)
      .values({
        uid,
        email,
        passwordHash,
        displayName,
        role,
        authProvider: 'email',
      })
      .returning();

    await initializeUserDefaults(created.id, {
      theme: parsed.data.theme,
      language: parsed.data.language,
      dailyVerseTarget: parsed.data.dailyVerseTarget,
      timezone: parsed.data.timezone,
      notificationConsent: parsed.data.notificationConsent,
    });

    if (parsed.data.guestState) {
      await migrateGuestStateTransactional(created.id, parsed.data.guestState);
    }

    const { rawToken } = await createDbSession(created.id, req);
    setSessionCookie(res, rawToken);

    const bundle = await getUserStateBundle(created.id);
    return res.status(201).json(bundle);
  } catch (err) {
    console.error('Register failed:', err);
    return res.status(500).json({ error: 'Could not create account. Please try again.' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const ip = req.ip || 'unknown';
  const rl = checkRateLimit(`login:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    return res.status(429).json({
      error: `Too many sign-in attempts. Please wait ${rl.retryAfterSeconds}s.`,
    });
  }

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Please provide a valid email and password.' });
  }

  try {
    const email = parsed.data.email.trim().toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    if (parsed.data.guestState) {
      await migrateGuestStateTransactional(user.id, parsed.data.guestState);
    }

    const { rawToken } = await createDbSession(user.id, req);
    setSessionCookie(res, rawToken);

    const bundle = await getUserStateBundle(user.id);
    return res.json(bundle);
  } catch (err) {
    console.error('Login failed:', err);
    return res.status(500).json({ error: 'Sign-in failed. Please try again.' });
  }
});

router.post('/firebase', async (req: Request, res: Response) => {
  const ip = req.ip || 'unknown';
  const rl = checkRateLimit(`firebase:${ip}`, 25, 15 * 60 * 1000);
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many authentication attempts.' });
  }

  const schema = z.object({
    idToken: z.string().min(20),
    guestState: guestPayloadSchema,
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid Google sign-in token.' });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(parsed.data.idToken);
    if (!decoded.email) {
      return res.status(400).json({ error: 'Google account email is required.' });
    }

    const authUser = await upsertFirebaseUser(
      decoded.uid,
      decoded.email,
      decoded.name || decoded.email.split('@')[0]
    );

    await initializeUserDefaults(authUser.id);
    if (parsed.data.guestState) {
      await migrateGuestStateTransactional(authUser.id, parsed.data.guestState);
    }

    const { rawToken } = await createDbSession(authUser.id, req);
    setSessionCookie(res, rawToken);

    const bundle = await getUserStateBundle(authUser.id);
    return res.json(bundle);
  } catch (err) {
    console.error('Firebase token verification error:', err);
    return res.status(401).json({ error: 'Could not verify Google authentication token.' });
  }
});

router.get('/me', optionalAuth, async (req: AuthRequest, res: Response) => {
  if (!req.authUser) {
    return res.json({ user: null });
  }
  try {
    const bundle = await getUserStateBundle(req.authUser.id);
    return res.json(bundle ?? { user: null });
  } catch (err) {
    console.error('Load profile error:', err);
    return res.status(500).json({ error: 'Failed to load profile.' });
  }
});

router.post('/logout', optionalAuth, async (req: AuthRequest, res: Response) => {
  if (req.authUser?.sessionId) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.id, req.authUser.sessionId), eq(sessions.userId, req.authUser.id)));
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  return res.json({ ok: true });
});

router.get('/sessions', requireAuth, async (req: AuthRequest, res: Response) => {
  const rows = await db
    .select({
      id: sessions.id,
      userAgent: sessions.userAgent,
      ipAddress: sessions.ipAddress,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
      revokedAt: sessions.revokedAt,
    })
    .from(sessions)
    .where(eq(sessions.userId, req.authUser!.id))
    .orderBy(desc(sessions.createdAt))
    .limit(20);

  return res.json({
    currentSessionId: req.authUser?.sessionId ?? null,
    sessions: rows,
  });
});

router.delete('/sessions/:sessionId', requireAuth, async (req: AuthRequest, res: Response) => {
  const sessionId = String(req.params.sessionId || '');
  if (sessionId === 'others' && req.authUser?.sessionId) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(sessions.userId, req.authUser.id),
          ne(sessions.id, req.authUser.sessionId)
        )
      );
    return res.json({ ok: true });
  }

  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, req.authUser!.id)));
  return res.json({ ok: true });
});

router.get('/export', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.authUser!.id;
  const [
    [userRow],
    [prefs],
    progress,
    unlocks,
    xp,
    ach,
    garden,
    bm,
    hl,
    refl,
    attempts,
    [notifPref],
    notifLogs,
  ] = await Promise.all([
    db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        authProvider: users.authProvider,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId)),
    db.select().from(userPreferences).where(eq(userPreferences.userId, userId)),
    db.select().from(readingProgress).where(eq(readingProgress.userId, userId)),
    db.select().from(chapterUnlocks).where(eq(chapterUnlocks.userId, userId)),
    db.select().from(xpTransactions).where(eq(xpTransactions.userId, userId)),
    db.select().from(userAchievements).where(eq(userAchievements.userId, userId)),
    db.select().from(gardenItems).where(eq(gardenItems.userId, userId)),
    db.select().from(bookmarks).where(eq(bookmarks.userId, userId)),
    db.select().from(highlights).where(eq(highlights.userId, userId)),
    db.select().from(reflections).where(eq(reflections.userId, userId)),
    db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId)),
    db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)),
    db.select().from(notificationDeliveryLogs).where(eq(notificationDeliveryLogs.userId, userId)),
  ]);

  res.setHeader('Content-Disposition', 'attachment; filename="gita-journey-export.json"');
  return res.json({
    exportedAt: new Date().toISOString(),
    product: 'GĪTĀ JOURNEY',
    account: userRow,
    preferences: prefs,
    readingProgress: progress,
    chapterUnlocks: unlocks,
    xpTransactions: xp,
    achievements: ach,
    gardenItems: garden,
    bookmarks: bm,
    highlights: hl,
    reflections: refl,
    quizAttempts: attempts,
    notificationPreferences: notifPref,
    notificationLogs: notifLogs,
  });
});

router.delete('/account', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({ confirmEmail: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || parsed.data.confirmEmail.trim().toLowerCase() !== req.authUser!.email.toLowerCase()) {
    return res.status(400).json({ error: 'Please type your account email to confirm deletion.' });
  }

  await db.delete(users).where(eq(users.id, req.authUser!.id));
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  return res.json({ deleted: true });
});

export default router;
