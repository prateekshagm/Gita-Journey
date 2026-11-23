import { Router, Response } from 'express';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.ts';
import {
  adminAuditLogs,
  chapters,
  licensedContent,
  notificationDeliveryLogs,
  notificationTemplates,
  quizzes,
  readingProgress,
  users,
  verseMetadata,
  xpRules,
} from '../db/schema.ts';
import { sanitizePlainText } from '../lib/security.ts';
import {
  AuthRequest,
  requireAuth,
  requireContentEditor,
  requireSystemAdmin,
} from '../middleware/auth.ts';
import { validateVerseCode } from '../shared/progression.ts';

const router = Router();

router.use(requireAuth);

async function writeAuditLog(
  actor: { id: number; email: string },
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, unknown> = {}
) {
  await db.insert(adminAuditLogs).values({
    actorUserId: actor.id,
    actorEmail: actor.email,
    action,
    targetType,
    targetId,
    details,
  });
}

router.get('/overview', requireContentEditor, async (_req: AuthRequest, res: Response) => {
  const [
    [userCount],
    [verseCount],
    [licensedCount],
    [quizCount],
    [progressCount],
    rules,
    templates,
    logs,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db.select({ count: sql<number>`count(*)::int` }).from(verseMetadata),
    db.select({ count: sql<number>`count(*)::int` }).from(licensedContent),
    db.select({ count: sql<number>`count(*)::int` }).from(quizzes),
    db.select({ count: sql<number>`count(*)::int` }).from(readingProgress),
    db.select().from(xpRules),
    db.select().from(notificationTemplates),
    db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(40),
  ]);

  return res.json({
    metrics: {
      totalUsers: userCount?.count ?? 0,
      totalVersesIndexed: verseCount?.count ?? 0,
      licensedContentEntries: licensedCount?.count ?? 0,
      totalQuizzes: quizCount?.count ?? 0,
      totalCompletedVersesAcrossUsers: progressCount?.count ?? 0,
    },
    xpRules: rules,
    notificationTemplates: templates,
    auditLogs: logs,
  });
});

router.get('/users', requireSystemAdmin, async (_req: AuthRequest, res: Response) => {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      authProvider: users.authProvider,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(100);

  return res.json({ users: rows });
});

router.patch('/users/:id/role', requireSystemAdmin, async (req: AuthRequest, res: Response) => {
  const targetId = Number(req.params.id);
  const schema = z.object({
    role: z.enum(['reader', 'content_editor', 'system_admin']),
  });
  const parsed = schema.safeParse(req.body);
  if (!Number.isInteger(targetId) || !parsed.success) {
    return res.status(400).json({ error: 'Invalid role update payload.' });
  }

  const [updated] = await db
    .update(users)
    .set({ role: parsed.data.role, updatedAt: new Date() })
    .where(eq(users.id, targetId))
    .returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
    });

  if (!updated) {
    return res.status(404).json({ error: 'User not found.' });
  }

  await writeAuditLog(req.authUser!, 'update_user_role', 'user', String(targetId), {
    newRole: parsed.data.role,
  });

  return res.json({ user: updated });
});

router.post('/content/import', requireContentEditor, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    verseCode: z.string().min(3).max(10),
    language: z.string().min(2).max(10).default('en'),
    edition: z.string().min(2).max(160),
    sourceAttribution: z.string().min(2).max(200),
    licenseStatus: z.enum(['source_linked', 'authorized_public_excerpt', 'licensed_full']),
    licenseReference: z.string().max(200).optional(),
    editorialVerified: z.boolean().default(false),
    devanagari: z.string().max(4000).optional(),
    transliteration: z.string().max(4000).optional(),
    synonyms: z.string().max(4000).optional(),
    translation: z.string().max(4000).optional(),
    purport: z.string().max(15000).optional(),
    editorialNote: z.string().max(2000).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !validateVerseCode(parsed.data.verseCode)) {
    return res.status(400).json({
      error: 'Invalid licensed content import payload or verse code.',
    });
  }

  const d = parsed.data;
  const [saved] = await db
    .insert(licensedContent)
    .values({
      verseCode: d.verseCode,
      language: d.language,
      edition: sanitizePlainText(d.edition, 160),
      sourceAttribution: sanitizePlainText(d.sourceAttribution, 200),
      licenseStatus: d.licenseStatus,
      licenseReference: d.licenseReference ? sanitizePlainText(d.licenseReference, 200) : null,
      editorialVerified: d.editorialVerified,
      verifiedBy: d.editorialVerified ? req.authUser!.id : null,
      devanagari: d.devanagari ? sanitizePlainText(d.devanagari, 4000) : null,
      transliteration: d.transliteration ? sanitizePlainText(d.transliteration, 4000) : null,
      synonyms: d.synonyms ? sanitizePlainText(d.synonyms, 4000) : null,
      translation: d.translation ? sanitizePlainText(d.translation, 4000) : null,
      purport: d.purport ? sanitizePlainText(d.purport, 15000) : null,
      editorialNote: d.editorialNote ? sanitizePlainText(d.editorialNote, 2000) : null,
    })
    .onConflictDoUpdate({
      target: [licensedContent.verseCode, licensedContent.language],
      set: {
        edition: sanitizePlainText(d.edition, 160),
        sourceAttribution: sanitizePlainText(d.sourceAttribution, 200),
        licenseStatus: d.licenseStatus,
        licenseReference: d.licenseReference ? sanitizePlainText(d.licenseReference, 200) : null,
        editorialVerified: d.editorialVerified,
        verifiedBy: d.editorialVerified ? req.authUser!.id : null,
        devanagari: d.devanagari ? sanitizePlainText(d.devanagari, 4000) : null,
        transliteration: d.transliteration ? sanitizePlainText(d.transliteration, 4000) : null,
        synonyms: d.synonyms ? sanitizePlainText(d.synonyms, 4000) : null,
        translation: d.translation ? sanitizePlainText(d.translation, 4000) : null,
        purport: d.purport ? sanitizePlainText(d.purport, 15000) : null,
        editorialNote: d.editorialNote ? sanitizePlainText(d.editorialNote, 2000) : null,
        updatedAt: new Date(),
      },
    })
    .returning();

  await writeAuditLog(req.authUser!, 'import_licensed_content', 'verse', d.verseCode, {
    language: d.language,
    licenseStatus: d.licenseStatus,
    editorialVerified: d.editorialVerified,
  });

  return res.json({ content: saved });
});

router.patch('/verses/:verseCode', requireContentEditor, async (req: AuthRequest, res: Response) => {
  const verseCode = String(req.params.verseCode || '');
  if (!validateVerseCode(verseCode)) {
    return res.status(400).json({ error: 'Invalid verse code.' });
  }
  const schema = z.object({
    speaker: z.string().min(1).max(80).optional(),
    topicSummary: z.string().min(5).max(500).optional(),
    hasAuthorizedAudio: z.boolean().optional(),
    audioUrl: z.string().url().nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid verse metadata update.' });
  }

  const [updated] = await db
    .update(verseMetadata)
    .set(parsed.data)
    .where(eq(verseMetadata.verseCode, verseCode))
    .returning();

  await writeAuditLog(req.authUser!, 'update_verse_metadata', 'verse', verseCode, parsed.data);
  return res.json({ verse: updated });
});

router.post('/quizzes', requireContentEditor, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    chapterNumber: z.number().int().min(1).max(18),
    mode: z.enum(['comprehension', 'vocabulary', 'missing_word', 'transliteration_order', 'chapter_recap']),
    prompt: z.string().min(8).max(400),
    options: z.array(z.string().min(1).max(200)).min(2).max(5),
    correctIndex: z.number().int().min(0).max(4),
    explanation: z.string().min(8).max(600),
    sourceReference: z.string().min(8).max(200),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || parsed.data.correctIndex >= parsed.data.options.length) {
    return res.status(400).json({ error: 'Invalid quiz question data.' });
  }

  const [created] = await db
    .insert(quizzes)
    .values({
      ...parsed.data,
      reviewed: true,
    })
    .returning();

  await writeAuditLog(req.authUser!, 'create_quiz_question', 'quiz', String(created.id), {
    chapterNumber: created.chapterNumber,
    sourceReference: created.sourceReference,
  });

  return res.status(201).json({ quiz: created });
});

router.patch('/xp-rules/:code', requireSystemAdmin, async (req: AuthRequest, res: Response) => {
  const code = sanitizePlainText(String(req.params.code || ''), 40);
  const schema = z.object({
    xpAmount: z.number().int().min(0).max(1000).optional(),
    active: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid XP rule update.' });
  }

  const [updated] = await db
    .update(xpRules)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(xpRules.code, code))
    .returning();

  if (!updated) return res.status(404).json({ error: 'XP rule not found.' });

  await writeAuditLog(req.authUser!, 'update_xp_rule', 'xp_rule', code, parsed.data);
  return res.json({ rule: updated });
});

router.patch('/notification-templates/:code', requireSystemAdmin, async (req: AuthRequest, res: Response) => {
  const code = sanitizePlainText(String(req.params.code || ''), 40);
  const schema = z.object({
    titleTemplate: z.string().min(2).max(120).optional(),
    bodyTemplate: z.string().min(2).max(400).optional(),
    active: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid template update.' });
  }

  const [updated] = await db
    .update(notificationTemplates)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(notificationTemplates.code, code))
    .returning();

  if (!updated) return res.status(404).json({ error: 'Template not found.' });

  await writeAuditLog(req.authUser!, 'update_notification_template', 'template', code, parsed.data);
  return res.json({ template: updated });
});

export default router;
