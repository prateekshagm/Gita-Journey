import { Router, Request, Response } from 'express';
import { and, asc, desc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.ts';
import {
  bookmarks,
  chapters,
  dailyMissions,
  gardenItems,
  highlights,
  licensedContent,
  notificationDeliveryLogs,
  notificationPreferences,
  quizAttempts,
  quizzes,
  reflections,
  userPreferences,
  users,
  verseMetadata,
  xpRules,
  xpTransactions,
} from '../db/schema.ts';
import { ensureSeeded } from '../db/seed.ts';
import { sanitizePlainText } from '../lib/security.ts';
import { AuthRequest, requireAuth } from '../middleware/auth.ts';
import {
  acceptQuestTransactional,
  claimQuestRewardTransactional,
  completeVerseTransactional,
  dispatchReminderCheck,
  getUserStateBundle,
  recordInteractiveChallengeTransactional,
  unlockSkillNodeTransactional,
} from '../services/userService.ts';
import { GARDEN_ENVIRONMENTS } from '../shared/gitaData.ts';
import { getAuthorizedLecturesForVerse } from '../shared/prabhupadaAudioCatalog.ts';
import {
  appendPointToReflectionNote,
  formatHighlightReflectionNote,
} from '../shared/reflectionHelpers.ts';
import { GITA_SHLOKAS } from '../shared/shlokaTexts.ts';
import { validateVerseCode } from '../shared/progression.ts';

const router = Router();

router.get('/chapters', async (_req: Request, res: Response) => {
  try {
    await ensureSeeded();
    const rows = await db.select().from(chapters).orderBy(asc(chapters.chapterNumber));
    return res.json({ chapters: rows });
  } catch (err) {
    console.error('Fetch chapters error:', err);
    return res.status(500).json({ error: 'Failed to fetch chapters.' });
  }
});

router.get('/chapters/:chapterNumber/verses', async (req: Request, res: Response) => {
  const chNum = Number(req.params.chapterNumber);
  if (!Number.isInteger(chNum) || chNum < 1 || chNum > 18) {
    return res.status(400).json({ error: 'Invalid chapter number (must be 1–18).' });
  }
  const lang = typeof req.query.language === 'string' ? req.query.language.slice(0, 10) : 'en';

  try {
    await ensureSeeded();
    const verses = await db
      .select()
      .from(verseMetadata)
      .where(eq(verseMetadata.chapterNumber, chNum))
      .orderBy(asc(verseMetadata.verseNumber));

    const licensed = await db
      .select()
      .from(licensedContent)
      .where(eq(licensedContent.language, lang));

    const licensedMap = new Map(licensed.map((l) => [l.verseCode, l]));

    const combined = verses.map((v) => {
      const lectures =
        v.authorizedLectures && v.authorizedLectures.length > 0
          ? v.authorizedLectures
          : getAuthorizedLecturesForVerse(v.verseCode);
      return {
        ...v,
        hasAuthorizedAudio: v.hasAuthorizedAudio || lectures.length > 0,
        audioUrl: v.audioUrl || lectures[0]?.audioUrl || null,
        authorizedLectures: lectures,
        shloka: GITA_SHLOKAS[v.verseCode] ?? null,
        licensedContent: licensedMap.get(v.verseCode) ?? null,
      };
    });

    return res.json({ chapterNumber: chNum, verses: combined });
  } catch (err) {
    console.error('Fetch chapter verses error:', err);
    return res.status(500).json({ error: 'Failed to load chapter verses.' });
  }
});

router.get('/verses/search', async (req: Request, res: Response) => {
  const q = sanitizePlainText(String(req.query.q || ''), 100);
  if (!q) {
    return res.json({ results: [] });
  }
  try {
    await ensureSeeded();
    const pattern = `%${q}%`;
    const results = await db
      .select()
      .from(verseMetadata)
      .where(
        or(
          ilike(verseMetadata.verseCode, pattern),
          ilike(verseMetadata.topicSummary, pattern),
          ilike(verseMetadata.speaker, pattern)
        )
      )
      .orderBy(asc(verseMetadata.chapterNumber), asc(verseMetadata.verseNumber))
      .limit(30);

    return res.json({ results });
  } catch (err) {
    console.error('Search verses error:', err);
    return res.status(500).json({ error: 'Search failed.' });
  }
});

router.get('/quizzes', async (req: Request, res: Response) => {
  const chFilter = req.query.chapter ? Number(req.query.chapter) : null;
  const modeFilter = typeof req.query.mode === 'string' ? req.query.mode : null;
  try {
    await ensureSeeded();
    const rows = await db
      .select({
        id: quizzes.id,
        chapterNumber: quizzes.chapterNumber,
        mode: quizzes.mode,
        prompt: quizzes.prompt,
        options: quizzes.options,
        sourceReference: quizzes.sourceReference,
        reviewed: quizzes.reviewed,
      })
      .from(quizzes)
      .where(eq(quizzes.reviewed, true))
      .orderBy(asc(quizzes.chapterNumber), asc(quizzes.id));

    const filtered = rows.filter((r) => {
      if (chFilter && r.chapterNumber !== chFilter) return false;
      if (modeFilter && modeFilter !== 'all' && r.mode !== modeFilter) return false;
      return true;
    });

    return res.json({ quizzes: filtered });
  } catch (err) {
    console.error('Fetch quizzes error:', err);
    return res.status(500).json({ error: 'Failed to load quizzes.' });
  }
});

router.get('/state', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await ensureSeeded();
    const bundle = await getUserStateBundle(req.authUser!.id);
    return res.json(bundle);
  } catch (err) {
    console.error('Get state error:', err);
    return res.status(500).json({ error: 'Failed to load user journey state.' });
  }
});

router.patch('/preferences', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    displayName: z.string().min(1).max(80).optional(),
    theme: z.enum(['krishna', 'radha_shyamasundara', 'gauranga']).optional(),
    language: z.string().min(2).max(10).optional(),
    dailyVerseTarget: z.number().int().min(1).max(50).optional(),
    missionMode: z
      .enum(['reading_only', 'reading_purport', 'reading_quiz', 'reading_audio', 'reading_reflection', 'custom'])
      .optional(),
    missionCustomRules: z
      .object({
        requirePurport: z.boolean().optional(),
        requireQuiz: z.boolean().optional(),
        requireReflection: z.boolean().optional(),
        requireAudio: z.boolean().optional(),
      })
      .optional(),
    missionPaused: z.boolean().optional(),
    readerMode: z.enum(['light', 'dark', 'sepia']).optional(),
    fontSize: z.number().int().min(14).max(28).optional(),
    versesPerView: z.number().int().min(1).max(10).optional(),
    showSanskrit: z.boolean().optional(),
    showTransliteration: z.boolean().optional(),
    showTranslation: z.boolean().optional(),
    showPurport: z.boolean().optional(),
    lastChapter: z.number().int().min(1).max(18).optional(),
    lastVerse: z.number().int().min(1).max(78).optional(),
    selectedEnvironment: z
      .enum(['yamuna_sanctuary', 'vrindavan_grove', 'temple_courtyard', 'navadvipa_dawn'])
      .optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid preferences.' });
  }

  try {
    const userId = req.authUser!.id;
    const { displayName, ...prefUpdates } = parsed.data;

    if (prefUpdates.selectedEnvironment) {
      const envSpec = GARDEN_ENVIRONMENTS.find((e) => e.code === prefUpdates.selectedEnvironment);
      if (envSpec && envSpec.requiredVerses > 0) {
        const currentBundle = await getUserStateBundle(userId);
        const completedCount = currentBundle?.stats.completedVersesCount ?? 0;
        if (completedCount < envSpec.requiredVerses) {
          return res.status(403).json({
            error: `${envSpec.name} unlocks at ${envSpec.requiredVerses} completed verses.`,
          });
        }
      }
    }

    if (displayName) {
      await db
        .update(users)
        .set({ displayName: sanitizePlainText(displayName, 80), updatedAt: new Date() })
        .where(eq(users.id, userId));
    }

    if (Object.keys(prefUpdates).length > 0) {
      await db
        .update(userPreferences)
        .set({ ...prefUpdates, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId));
    }

    const bundle = await getUserStateBundle(userId);
    return res.json(bundle);
  } catch (err) {
    console.error('Update preferences error:', err);
    return res.status(500).json({ error: 'Failed to save preferences.' });
  }
});

router.post('/progress/verse', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    verseCode: z.string().min(3).max(10),
    evidenceType: z.enum(['manual', 'reflection', 'quiz']).optional(),
    purportRead: z.boolean().optional(),
    audioListened: z.boolean().optional(),
    localDate: z.string().max(12).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid verse completion request.' });
  }

  try {
    const result = await completeVerseTransactional(req.authUser!.id, parsed.data);
    const bundle = await getUserStateBundle(req.authUser!.id);
    return res.json({ result, state: bundle });
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode || 400;
    return res.status(status).json({ error: (err as Error).message || 'Could not record verse completion.' });
  }
});

router.post('/missions/today', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    action: z.enum(['pause', 'resume', 'skip', 'update_target']),
    targetVerses: z.number().int().min(1).max(50).optional(),
    localDate: z.string().max(12).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid mission update.' });
  }

  const userId = req.authUser!.id;
  const todayIso =
    parsed.data.localDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.data.localDate)
      ? parsed.data.localDate
      : new Date().toISOString().slice(0, 10);

  try {
    if (parsed.data.action === 'pause') {
      await db
        .update(userPreferences)
        .set({ missionPaused: true, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId));
      await db
        .update(dailyMissions)
        .set({ status: 'paused', updatedAt: new Date() })
        .where(and(eq(dailyMissions.userId, userId), eq(dailyMissions.missionDate, todayIso)));
    } else if (parsed.data.action === 'resume') {
      await db
        .update(userPreferences)
        .set({ missionPaused: false, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId));
      await db
        .update(dailyMissions)
        .set({ status: 'active', updatedAt: new Date() })
        .where(and(eq(dailyMissions.userId, userId), eq(dailyMissions.missionDate, todayIso)));
    } else if (parsed.data.action === 'skip') {
      await db
        .update(dailyMissions)
        .set({ status: 'skipped', updatedAt: new Date() })
        .where(and(eq(dailyMissions.userId, userId), eq(dailyMissions.missionDate, todayIso)));
    } else if (parsed.data.action === 'update_target' && parsed.data.targetVerses) {
      await db
        .update(userPreferences)
        .set({ dailyVerseTarget: parsed.data.targetVerses, updatedAt: new Date() })
        .where(eq(userPreferences.userId, userId));
      await db
        .update(dailyMissions)
        .set({ targetVerses: parsed.data.targetVerses, updatedAt: new Date() })
        .where(and(eq(dailyMissions.userId, userId), eq(dailyMissions.missionDate, todayIso)));
    }

    const bundle = await getUserStateBundle(userId);
    return res.json(bundle);
  } catch (err) {
    console.error('Mission update error:', err);
    return res.status(500).json({ error: 'Failed to update daily mission.' });
  }
});

router.post('/bookmarks', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    verseCode: z.string().min(3).max(10),
    folder: z.string().min(1).max(40).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !validateVerseCode(parsed.data.verseCode)) {
    return res.status(400).json({ error: 'Invalid verse code.' });
  }

  await db
    .insert(bookmarks)
    .values({
      userId: req.authUser!.id,
      verseCode: parsed.data.verseCode,
      folder: sanitizePlainText(parsed.data.folder || 'Saved', 40),
    })
    .onConflictDoNothing({ target: [bookmarks.userId, bookmarks.verseCode] });

  const bundle = await getUserStateBundle(req.authUser!.id);
  return res.json(bundle);
});

router.delete('/bookmarks/:verseCode', requireAuth, async (req: AuthRequest, res: Response) => {
  const verseCode = String(req.params.verseCode || '');
  await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.userId, req.authUser!.id), eq(bookmarks.verseCode, verseCode)));
  const bundle = await getUserStateBundle(req.authUser!.id);
  return res.json(bundle);
});

router.post('/highlights', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    verseCode: z.string().min(3).max(10),
    color: z.enum(['gold', 'sky', 'saffron', 'rose']).default('gold'),
    excerpt: z.string().min(1).max(600),
    point: z.string().max(1000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !validateVerseCode(parsed.data.verseCode)) {
    return res.status(400).json({ error: 'Invalid highlight data.' });
  }

  const userId = req.authUser!.id;
  const cleanExcerpt = sanitizePlainText(parsed.data.excerpt, 600);
  const cleanPoint = parsed.data.point ? sanitizePlainText(parsed.data.point, 1000) : '';
  const reflectionNote = sanitizePlainText(
    formatHighlightReflectionNote(cleanExcerpt, cleanPoint),
    2000
  );

  await db.transaction(async (tx) => {
    await tx.insert(highlights).values({
      userId,
      verseCode: parsed.data.verseCode,
      color: parsed.data.color,
      excerpt: cleanExcerpt,
    });

    // Automatically save every highlighted excerpt into Reflections
    await tx.insert(reflections).values({
      userId,
      verseCode: parsed.data.verseCode,
      note: reflectionNote,
    });

    const [rule] = await tx
      .select()
      .from(xpRules)
      .where(eq(xpRules.code, 'reflection_bonus'))
      .limit(1);
    const amount = rule?.active ? rule.xpAmount : 5;
    if (amount > 0) {
      await tx
        .insert(xpTransactions)
        .values({
          userId,
          amount,
          reason: `Personal reflection on Bg. ${parsed.data.verseCode}`,
          eventKey: `reflection:${parsed.data.verseCode}`,
          metadata: { verseCode: parsed.data.verseCode },
        })
        .onConflictDoNothing({
          target: [xpTransactions.userId, xpTransactions.eventKey],
        });
    }
  });

  const bundle = await getUserStateBundle(userId);
  return res.json(bundle);
});

router.delete('/highlights/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid highlight ID.' });
  await db
    .delete(highlights)
    .where(and(eq(highlights.id, id), eq(highlights.userId, req.authUser!.id)));
  const bundle = await getUserStateBundle(req.authUser!.id);
  return res.json(bundle);
});

router.post('/reflections', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    verseCode: z.string().min(3).max(10),
    note: z.string().min(2).max(4000),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success || !validateVerseCode(parsed.data.verseCode)) {
    return res.status(400).json({ error: 'Reflection note must be 2–4000 characters.' });
  }

  const userId = req.authUser!.id;
  const cleanNote = sanitizePlainText(parsed.data.note, 4000);

  await db.transaction(async (tx) => {
    await tx.insert(reflections).values({
      userId,
      verseCode: parsed.data.verseCode,
      note: cleanNote,
    });

    const [rule] = await tx
      .select()
      .from(xpRules)
      .where(eq(xpRules.code, 'reflection_bonus'))
      .limit(1);
    const amount = rule?.active ? rule.xpAmount : 5;
    if (amount > 0) {
      await tx
        .insert(xpTransactions)
        .values({
          userId,
          amount,
          reason: `Personal reflection on Bg. ${parsed.data.verseCode}`,
          eventKey: `reflection:${parsed.data.verseCode}`,
          metadata: { verseCode: parsed.data.verseCode },
        })
        .onConflictDoNothing({
          target: [xpTransactions.userId, xpTransactions.eventKey],
        });
    }
  });

  const bundle = await getUserStateBundle(userId);
  return res.json(bundle);
});

router.patch('/reflections/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const schema = z.object({
    point: z.string().min(2).max(1000).optional(),
    note: z.string().min(2).max(4000).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success || (!parsed.data.point && !parsed.data.note)) {
    return res.status(400).json({ error: 'Invalid reflection point update.' });
  }

  const userId = req.authUser!.id;
  const [existing] = await db
    .select()
    .from(reflections)
    .where(and(eq(reflections.id, id), eq(reflections.userId, userId)))
    .limit(1);

  if (!existing) {
    return res.status(404).json({ error: 'Reflection not found.' });
  }

  const updatedNote = parsed.data.point
    ? sanitizePlainText(
        appendPointToReflectionNote(existing.note, sanitizePlainText(parsed.data.point, 1000)),
        4000
      )
    : sanitizePlainText(parsed.data.note || existing.note, 4000);

  await db
    .update(reflections)
    .set({ note: updatedNote, updatedAt: new Date() })
    .where(and(eq(reflections.id, id), eq(reflections.userId, userId)));

  const bundle = await getUserStateBundle(userId);
  return res.json(bundle);
});

router.post('/quizzes/:id/attempt', requireAuth, async (req: AuthRequest, res: Response) => {
  const quizId = Number(req.params.id);
  const schema = z.object({ selectedIndex: z.number().int().min(0).max(10) });
  const parsed = schema.safeParse(req.body);
  if (!Number.isInteger(quizId) || !parsed.success) {
    return res.status(400).json({ error: 'Invalid quiz submission.' });
  }

  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz question not found.' });
  }

  const userId = req.authUser!.id;
  const isCorrect = parsed.data.selectedIndex === quiz.correctIndex;
  // Spaced repetition interval: 3 days if correct, 12 hours if needs review
  const nextReviewAt = new Date(Date.now() + (isCorrect ? 3 * 86400000 : 12 * 3600000));

  let xpAwarded = 0;

  await db.transaction(async (tx) => {
    const prev = await tx
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)));

    await tx.insert(quizAttempts).values({
      userId,
      quizId,
      selectedIndex: parsed.data.selectedIndex,
      isCorrect,
      nextReviewAt,
      attemptCount: prev.length + 1,
    });

    if (isCorrect) {
      const [rule] = await tx
        .select()
        .from(xpRules)
        .where(eq(xpRules.code, 'quiz_correct'))
        .limit(1);
      const amount = rule?.active ? rule.xpAmount : 15;
      if (amount > 0) {
        const xpRes = await tx
          .insert(xpTransactions)
          .values({
            userId,
            amount,
            reason: `Answered Chapter ${quiz.chapterNumber} quiz (${quiz.mode})`,
            eventKey: `quiz_correct:${quizId}`,
            metadata: { quizId, chapterNumber: quiz.chapterNumber },
          })
          .onConflictDoNothing({
            target: [xpTransactions.userId, xpTransactions.eventKey],
          })
          .returning();
        if (xpRes.length > 0) xpAwarded = amount;
      }
    }
  });

  const bundle = await getUserStateBundle(userId);
  return res.json({
    isCorrect,
    correctIndex: quiz.correctIndex,
    explanation: quiz.explanation,
    sourceReference: quiz.sourceReference,
    xpAwarded,
    state: bundle,
  });
});

router.patch('/garden/:itemCode', requireAuth, async (req: AuthRequest, res: Response) => {
  const itemCode = sanitizePlainText(String(req.params.itemCode || ''), 40);
  const schema = z.object({
    placed: z.boolean().optional(),
    posX: z.number().int().min(5).max(95).optional(),
    posY: z.number().int().min(10).max(90).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid garden coordinates.' });
  }

  const updated = await db
    .update(gardenItems)
    .set(parsed.data)
    .where(and(eq(gardenItems.userId, req.authUser!.id), eq(gardenItems.itemCode, itemCode)))
    .returning();

  if (updated.length === 0) {
    return res.status(404).json({ error: 'Garden item not unlocked yet.' });
  }

  const bundle = await getUserStateBundle(req.authUser!.id);
  return res.json(bundle);
});

router.patch('/notifications/preferences', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    inAppEnabled: z.boolean().optional(),
    browserPushEnabled: z.boolean().optional(),
    browserPushSubscription: z.record(z.string(), z.unknown()).nullable().optional(),
    emailEnabled: z.boolean().optional(),
    frequency: z.enum(['daily', 'weekdays', 'weekly', 'paused']).optional(),
    morningTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    eveningTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
    timezone: z.string().min(1).max(64).optional(),
    quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    consentGranted: z.boolean().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid notification settings.' });
  }

  const { consentGranted, ...updates } = parsed.data;
  await db
    .update(notificationPreferences)
    .set({
      ...updates,
      ...(consentGranted ? { consentRecordedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(notificationPreferences.userId, req.authUser!.id));

  const bundle = await getUserStateBundle(req.authUser!.id);
  return res.json(bundle);
});

router.post('/notifications/read-all', requireAuth, async (req: AuthRequest, res: Response) => {
  await db
    .update(notificationDeliveryLogs)
    .set({ status: 'read', readAt: new Date() })
    .where(
      and(
        eq(notificationDeliveryLogs.userId, req.authUser!.id),
        eq(notificationDeliveryLogs.status, 'delivered')
      )
    );
  const bundle = await getUserStateBundle(req.authUser!.id);
  return res.json(bundle);
});

router.post('/notifications/dispatch-check', requireAuth, async (req: AuthRequest, res: Response) => {
  const outcome = await dispatchReminderCheck(req.authUser!.id);
  const bundle = await getUserStateBundle(req.authUser!.id);
  return res.json({ outcome, state: bundle });
});

router.post('/quests/:code/accept', requireAuth, async (req: AuthRequest, res: Response) => {
  const code = sanitizePlainText(String(req.params.code || ''), 60);
  try {
    await acceptQuestTransactional(req.authUser!.id, code);
    const bundle = await getUserStateBundle(req.authUser!.id);
    return res.json({ state: bundle });
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode || 400;
    return res.status(status).json({ error: (err as Error).message || 'Could not accept quest.' });
  }
});

router.post('/quests/:code/claim', requireAuth, async (req: AuthRequest, res: Response) => {
  const code = sanitizePlainText(String(req.params.code || ''), 60);
  try {
    const result = await claimQuestRewardTransactional(req.authUser!.id, code);
    const bundle = await getUserStateBundle(req.authUser!.id);
    return res.json({ result, state: bundle });
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode || 400;
    return res.status(status).json({ error: (err as Error).message || 'Could not claim quest reward.' });
  }
});

router.post('/skills/:code/unlock', requireAuth, async (req: AuthRequest, res: Response) => {
  const code = sanitizePlainText(String(req.params.code || ''), 60);
  try {
    const result = await unlockSkillNodeTransactional(req.authUser!.id, code);
    const bundle = await getUserStateBundle(req.authUser!.id);
    return res.json({ result, state: bundle });
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode || 400;
    return res.status(status).json({ error: (err as Error).message || 'Could not unlock skill.' });
  }
});

router.post('/challenges/complete', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    challengeType: z.enum(['sanskrit_match', 'verse_order']),
    challengeId: z.string().min(2).max(60),
    chapterNumber: z.number().int().min(1).max(18),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid challenge payload.' });
  }
  try {
    const result = await recordInteractiveChallengeTransactional(
      req.authUser!.id,
      parsed.data.challengeType,
      parsed.data.challengeId,
      parsed.data.chapterNumber
    );
    const bundle = await getUserStateBundle(req.authUser!.id);
    return res.json({ result, state: bundle });
  } catch (err) {
    const status = (err as Error & { statusCode?: number }).statusCode || 400;
    return res.status(status).json({ error: (err as Error).message || 'Could not record challenge.' });
  }
});

export default router;
