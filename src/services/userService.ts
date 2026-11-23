import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  achievements,
  bookmarks,
  chapterUnlocks,
  chapters,
  dailyMissions,
  gardenItems,
  highlights,
  missionActivities,
  notificationDeliveryLogs,
  notificationPreferences,
  quizAttempts,
  quizzes,
  readingProgress,
  reflections,
  userAchievements,
  userPreferences,
  userQuests,
  userSkills,
  users,
  xpRules,
  xpTransactions,
} from '../db/schema.ts';
import {
  GARDEN_CATALOG,
  GARDEN_ENVIRONMENTS,
  GITA_CHAPTERS,
  QUEST_CATALOG,
  SANSKRIT_MATCH_SETS,
  SKILL_TREE_NODES,
  VERSE_ORDER_CHALLENGES,
} from '../shared/gitaData.ts';
import {
  calculateConsistencyStats,
  calculateLevel,
  computeChapterStates,
  detectWelcomeBackGapDays,
  evaluateQuestStates,
  evaluateSkillTreeStates,
  generateReadingSchedule,
  isChapterUnlockedForUser,
  isWithinQuietHours,
  MissionMode,
  resolveMissionRequirements,
  validateVerseCode,
} from '../shared/progression.ts';

export async function initializeUserDefaults(
  userId: number,
  options?: {
    theme?: string;
    language?: string;
    dailyVerseTarget?: number;
    missionMode?: string;
    timezone?: string;
    notificationConsent?: boolean;
  }
) {
  await db.transaction(async (tx) => {
    await tx
      .insert(userPreferences)
      .values({
        userId,
        theme: options?.theme || 'krishna',
        language: options?.language || 'en',
        dailyVerseTarget: Math.max(1, Math.min(50, options?.dailyVerseTarget || 3)),
        missionMode: options?.missionMode || 'reading_only',
      })
      .onConflictDoNothing({ target: userPreferences.userId });

    await tx
      .insert(chapterUnlocks)
      .values({
        userId,
        chapterNumber: 1,
      })
      .onConflictDoNothing({
        target: [chapterUnlocks.userId, chapterUnlocks.chapterNumber],
      });

    await tx
      .insert(notificationPreferences)
      .values({
        userId,
        inAppEnabled: true,
        browserPushEnabled: false,
        emailEnabled: false,
        timezone: options?.timezone || 'UTC',
        consentRecordedAt: options?.notificationConsent ? new Date() : null,
      })
      .onConflictDoNothing({ target: notificationPreferences.userId });

    const existingLogs = await tx
      .select({ id: notificationDeliveryLogs.id })
      .from(notificationDeliveryLogs)
      .where(eq(notificationDeliveryLogs.userId, userId))
      .limit(1);

    if (existingLogs.length === 0) {
      await tx.insert(notificationDeliveryLogs).values({
        userId,
        channel: 'in_app',
        category: 'welcome_back',
        title: 'Welcome to Gītā Journey',
        body: 'Chapter 1 is unlocked and ready. Explore at a calm, steady pace.',
        status: 'delivered',
      });
    }
  });
}

async function getRuleXp(code: string, fallback: number): Promise<number> {
  const rows = await db
    .select({ xpAmount: xpRules.xpAmount, active: xpRules.active })
    .from(xpRules)
    .where(eq(xpRules.code, code))
    .limit(1);
  if (rows.length === 0) return fallback;
  return rows[0].active ? rows[0].xpAmount : 0;
}

export async function completeVerseTransactional(
  userId: number,
  params: {
    verseCode: string;
    evidenceType?: 'manual' | 'reflection' | 'quiz' | 'migrated_guest';
    purportRead?: boolean;
    audioListened?: boolean;
    localDate?: string;
  }
) {
  const parsed = validateVerseCode(params.verseCode);
  if (!parsed) {
    throw new Error('Invalid verse code');
  }
  const { chapterNumber, verseNumber } = parsed;
  const verseCode = `${chapterNumber}.${verseNumber}`;
  const todayIso = params.localDate && /^\d{4}-\d{2}-\d{2}$/.test(params.localDate)
    ? params.localDate
    : new Date().toISOString().slice(0, 10);

  const [verseXp, purportXp, chapterXp, missionXp] = await Promise.all([
    getRuleXp('verse_complete', 10),
    getRuleXp('purport_bonus', 5),
    getRuleXp('chapter_complete', 100),
    getRuleXp('daily_mission_complete', 25),
  ]);

  return await db.transaction(async (tx) => {
    const existingCompletedRows = await tx
      .select({ verseCode: readingProgress.verseCode })
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId));

    const completedSet = new Set(existingCompletedRows.map((r) => r.verseCode));

    if (!isChapterUnlockedForUser(chapterNumber, completedSet)) {
      const err = new Error(
        `Chapter ${chapterNumber} is locked until all verses of Chapter ${chapterNumber - 1} are completed.`
      );
      (err as Error & { statusCode?: number }).statusCode = 403;
      throw err;
    }

    const insertedProgress = await tx
      .insert(readingProgress)
      .values({
        userId,
        chapterNumber,
        verseNumber,
        verseCode,
        evidenceType: params.evidenceType || 'manual',
        purportRead: Boolean(params.purportRead),
        audioListened: Boolean(params.audioListened),
      })
      .onConflictDoNothing({
        target: [readingProgress.userId, readingProgress.verseCode],
      })
      .returning();

    const newlyCompleted = insertedProgress.length > 0;
    let xpAwarded = 0;

    if (newlyCompleted && verseXp > 0) {
      const xpInsert = await tx
        .insert(xpTransactions)
        .values({
          userId,
          amount: verseXp,
          reason: `Completed Bg. ${verseCode}`,
          eventKey: `verse_complete:${verseCode}`,
          metadata: { chapterNumber, verseNumber },
        })
        .onConflictDoNothing({
          target: [xpTransactions.userId, xpTransactions.eventKey],
        })
        .returning();
      if (xpInsert.length > 0) xpAwarded += verseXp;
    }

    if (params.purportRead && purportXp > 0) {
      await tx
        .update(readingProgress)
        .set({ purportRead: true })
        .where(and(eq(readingProgress.userId, userId), eq(readingProgress.verseCode, verseCode)));

      const purportInsert = await tx
        .insert(xpTransactions)
        .values({
          userId,
          amount: purportXp,
          reason: `Studied purport for Bg. ${verseCode}`,
          eventKey: `purport_bonus:${verseCode}`,
          metadata: { chapterNumber, verseNumber },
        })
        .onConflictDoNothing({
          target: [xpTransactions.userId, xpTransactions.eventKey],
        })
        .returning();
      if (purportInsert.length > 0) xpAwarded += purportXp;
    }

    completedSet.add(verseCode);

    // Update last reading position
    await tx
      .update(userPreferences)
      .set({
        lastChapter: chapterNumber,
        lastVerse: verseNumber,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));

    // Check chapter completion & next chapter unlock
    const chapterSpec = GITA_CHAPTERS.find((c) => c.chapterNumber === chapterNumber)!;
    const chapterCompletedCount = Array.from(completedSet).filter((code) =>
      code.startsWith(`${chapterNumber}.`)
    ).length;

    let unlockedNextChapter: number | null = null;
    if (chapterCompletedCount >= chapterSpec.verseCount) {
      await tx
        .insert(chapterUnlocks)
        .values({
          userId,
          chapterNumber,
          completedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [chapterUnlocks.userId, chapterUnlocks.chapterNumber],
          set: { completedAt: new Date() },
        });

      if (chapterXp > 0) {
        const chXpRes = await tx
          .insert(xpTransactions)
          .values({
            userId,
            amount: chapterXp,
            reason: `Completed Chapter ${chapterNumber}: ${chapterSpec.englishTitle}`,
            eventKey: `chapter_complete:${chapterNumber}`,
            metadata: { chapterNumber },
          })
          .onConflictDoNothing({
            target: [xpTransactions.userId, xpTransactions.eventKey],
          })
          .returning();
        if (chXpRes.length > 0) xpAwarded += chapterXp;
      }

      if (chapterNumber < 18) {
        const nextCh = chapterNumber + 1;
        const nextSpec = GITA_CHAPTERS.find((c) => c.chapterNumber === nextCh)!;
        const unlockRes = await tx
          .insert(chapterUnlocks)
          .values({
            userId,
            chapterNumber: nextCh,
          })
          .onConflictDoNothing({
            target: [chapterUnlocks.userId, chapterUnlocks.chapterNumber],
          })
          .returning();
        if (unlockRes.length > 0) {
          unlockedNextChapter = nextCh;
          await tx.insert(notificationDeliveryLogs).values({
            userId,
            channel: 'in_app',
            category: 'chapter_unlock',
            title: `Chapter ${nextCh} Unlocked`,
            body: `You completed Chapter ${chapterNumber} and unlocked ${nextSpec.englishTitle}.`,
            status: 'delivered',
          });
        }
      }
    }

    // Update or create today's daily mission
    const [prefs] = await tx
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const dailyTarget = prefs?.dailyVerseTarget ?? 3;
    const reqs = resolveMissionRequirements(
      (prefs?.missionMode as MissionMode) || 'reading_only',
      prefs?.missionCustomRules
    );
    const schedule = generateReadingSchedule(completedSet, dailyTarget, 1);

    const [mission] = await tx
      .insert(dailyMissions)
      .values({
        userId,
        missionDate: todayIso,
        targetVerses: dailyTarget,
        completedVerses: newlyCompleted ? 1 : 0,
        requirements: reqs,
        status: newlyCompleted && 1 >= dailyTarget ? 'completed' : 'active',
        assignedRange: schedule.nextAssignedRange,
      })
      .onConflictDoUpdate({
        target: [dailyMissions.userId, dailyMissions.missionDate],
        set: {
          updatedAt: new Date(),
        },
      })
      .returning();

    if (newlyCompleted) {
      const actInsert = await tx
        .insert(missionActivities)
        .values({
          missionId: mission.id,
          userId,
          activityType: 'read_verse',
          referenceId: verseCode,
        })
        .onConflictDoNothing({
          target: [
            missionActivities.missionId,
            missionActivities.activityType,
            missionActivities.referenceId,
          ],
        })
        .returning();

      if (actInsert.length > 0) {
        const countRes = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(missionActivities)
          .where(
            and(
              eq(missionActivities.missionId, mission.id),
              eq(missionActivities.activityType, 'read_verse')
            )
          );
        const missionCount = countRes[0]?.count ?? 1;
        const metTarget = missionCount >= mission.targetVerses;

        await tx
          .update(dailyMissions)
          .set({
            completedVerses: missionCount,
            status:
              mission.status === 'paused' || mission.status === 'skipped'
                ? mission.status
                : metTarget
                  ? 'completed'
                  : 'active',
            updatedAt: new Date(),
          })
          .where(eq(dailyMissions.id, mission.id));

        if (metTarget && missionXp > 0) {
          const mXpRes = await tx
            .insert(xpTransactions)
            .values({
              userId,
              amount: missionXp,
              reason: `Met daily target (${mission.targetVerses} verses) on ${todayIso}`,
              eventKey: `daily_mission:${todayIso}`,
              metadata: { missionDate: todayIso },
            })
            .onConflictDoNothing({
              target: [xpTransactions.userId, xpTransactions.eventKey],
            })
            .returning();
          if (mXpRes.length > 0) xpAwarded += missionXp;
        }
      }
    }

    // Evaluate achievements & cosmetic garden unlocks
    const totalCompleted = completedSet.size;
    const chapterStates = computeChapterStates(completedSet);
    const completedChaptersCount = chapterStates.filter((c) => c.status === 'completed').length;

    const allAchievements = await tx.select().from(achievements);
    const newlyEarnedAchievements: string[] = [];

    for (const ach of allAchievements) {
      let qualified = false;
      if (ach.category === 'verse_milestone' && totalCompleted >= ach.targetCount) {
        qualified = true;
      } else if (ach.code === 'chapter_1_complete' && chapterStates[0]?.status === 'completed') {
        qualified = true;
      } else if (ach.code === 'chapters_6_complete' && completedChaptersCount >= 6) {
        qualified = true;
      }

      if (qualified) {
        const earnedRes = await tx
          .insert(userAchievements)
          .values({ userId, achievementCode: ach.code })
          .onConflictDoNothing({
            target: [userAchievements.userId, userAchievements.achievementCode],
          })
          .returning();

        if (earnedRes.length > 0) {
          newlyEarnedAchievements.push(ach.title);
          if (ach.xpReward > 0) {
            const achXpRes = await tx
              .insert(xpTransactions)
              .values({
                userId,
                amount: ach.xpReward,
                reason: `Milestone: ${ach.title}`,
                eventKey: `achievement:${ach.code}`,
                metadata: { achievementCode: ach.code },
              })
              .onConflictDoNothing({
                target: [xpTransactions.userId, xpTransactions.eventKey],
              })
              .returning();
            if (achXpRes.length > 0) xpAwarded += ach.xpReward;
          }
          if (ach.gardenRewardCode) {
            const catalog = GARDEN_CATALOG.find((g) => g.code === ach.gardenRewardCode);
            await tx
              .insert(gardenItems)
              .values({
                userId,
                itemCode: ach.gardenRewardCode,
                unlockedVia: ach.title,
                placed: true,
                posX: catalog?.defaultX ?? 50,
                posY: catalog?.defaultY ?? 50,
              })
              .onConflictDoNothing({
                target: [gardenItems.userId, gardenItems.itemCode],
              });
          }
          await tx.insert(notificationDeliveryLogs).values({
            userId,
            channel: 'in_app',
            category: 'milestone',
            title: `Milestone: ${ach.title}`,
            body: ach.description,
            status: 'delivered',
          });
        }
      }
    }

    return {
      verseCode,
      newlyCompleted,
      xpAwarded,
      unlockedNextChapter,
      newlyEarnedAchievements,
    };
  });
}

export async function migrateGuestStateTransactional(
  userId: number,
  guestState: {
    theme?: string;
    language?: string;
    dailyVerseTarget?: number;
    missionMode?: string;
    readerMode?: string;
    fontSize?: number;
    selectedEnvironment?: string;
    completedVerses?: string[];
    bookmarks?: string[];
    reflections?: Array<{ verseCode: string; note: string }>;
    acceptedQuests?: string[];
    completedChallenges?: string[];
  }
) {
  if (!guestState) return { migratedVerses: 0 };

  if (
    guestState.theme ||
    guestState.dailyVerseTarget ||
    guestState.language ||
    guestState.readerMode
  ) {
    await db
      .update(userPreferences)
      .set({
        ...(guestState.theme ? { theme: guestState.theme } : {}),
        ...(guestState.language ? { language: guestState.language } : {}),
        ...(guestState.dailyVerseTarget
          ? { dailyVerseTarget: Math.max(1, Math.min(50, guestState.dailyVerseTarget)) }
          : {}),
        ...(guestState.missionMode ? { missionMode: guestState.missionMode } : {}),
        ...(guestState.readerMode ? { readerMode: guestState.readerMode } : {}),
        ...(guestState.fontSize ? { fontSize: Math.max(14, Math.min(28, guestState.fontSize)) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
  }

  let migratedVerses = 0;
  const sortedVerses = (guestState.completedVerses || [])
    .filter((v) => validateVerseCode(v) !== null)
    .sort((a, b) => {
      const [ca, va] = a.split('.').map(Number);
      const [cb, vb] = b.split('.').map(Number);
      return ca !== cb ? ca - cb : va - vb;
    });

  for (const code of sortedVerses) {
    try {
      const res = await completeVerseTransactional(userId, {
        verseCode: code,
        evidenceType: 'migrated_guest',
      });
      if (res.newlyCompleted) migratedVerses++;
    } catch {
      // Skip locked chapters safely if guest state was tampered with
    }
  }

  for (const bm of guestState.bookmarks || []) {
    if (validateVerseCode(bm)) {
      await db
        .insert(bookmarks)
        .values({ userId, verseCode: bm, folder: 'Saved' })
        .onConflictDoNothing({ target: [bookmarks.userId, bookmarks.verseCode] });
    }
  }

  for (const ref of guestState.reflections || []) {
    if (validateVerseCode(ref.verseCode) && ref.note.trim()) {
      await db.insert(reflections).values({
        userId,
        verseCode: ref.verseCode,
        note: ref.note.trim().slice(0, 2000),
      });
    }
  }

  if (guestState.selectedEnvironment) {
    const env = GARDEN_ENVIRONMENTS.find((e) => e.code === guestState.selectedEnvironment);
    if (env) {
      const progressCountRes = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(readingProgress)
        .where(eq(readingProgress.userId, userId));
      const count = progressCountRes[0]?.count ?? 0;
      if (count >= env.requiredVerses) {
        await db
          .update(userPreferences)
          .set({ selectedEnvironment: env.code, updatedAt: new Date() })
          .where(eq(userPreferences.userId, userId));
      }
    }
  }

  for (const questCode of guestState.acceptedQuests || []) {
    const def = QUEST_CATALOG.find((q) => q.code === questCode);
    if (def) {
      const periodKey = def.periodType === 'daily' ? new Date().toISOString().slice(0, 10) : 'journey';
      await db
        .insert(userQuests)
        .values({ userId, questCode: def.code, periodKey, status: 'accepted' })
        .onConflictDoNothing({
          target: [userQuests.userId, userQuests.questCode, userQuests.periodKey],
        });
    }
  }

  for (const chKey of guestState.completedChallenges || []) {
    const [type, id] = chKey.split(':');
    if (type === 'sanskrit_match') {
      const found = SANSKRIT_MATCH_SETS.find((s) => s.id === id);
      if (found) {
        await recordInteractiveChallengeTransactional(userId, 'sanskrit_match', found.id, found.chapterNumber).catch(
          () => {}
        );
      }
    } else if (type === 'verse_order') {
      const found = VERSE_ORDER_CHALLENGES.find((s) => s.id === id);
      if (found) {
        await recordInteractiveChallengeTransactional(userId, 'verse_order', found.id, found.chapterNumber).catch(
          () => {}
        );
      }
    }
  }

  return { migratedVerses };
}

export async function getUserStateBundle(userId: number) {
  const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRow) return null;

  await initializeUserDefaults(userId);

  const todayIso = new Date().toISOString().slice(0, 10);

  const [
    [prefs],
    progressRows,
    unlockRows,
    xpRows,
    earnedAchRows,
    allAchRows,
    gardenRows,
    bookmarkRows,
    highlightRows,
    reflectionRows,
    quizAttemptRows,
    allQuizRows,
    questRows,
    skillRows,
    [notifPrefs],
    notifLogRows,
    ruleRows,
  ] = await Promise.all([
    db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1),
    db
      .select()
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId))
      .orderBy(desc(readingProgress.completedAt)),
    db.select().from(chapterUnlocks).where(eq(chapterUnlocks.userId, userId)),
    db
      .select()
      .from(xpTransactions)
      .where(eq(xpTransactions.userId, userId))
      .orderBy(desc(xpTransactions.createdAt)),
    db.select().from(userAchievements).where(eq(userAchievements.userId, userId)),
    db.select().from(achievements),
    db.select().from(gardenItems).where(eq(gardenItems.userId, userId)),
    db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt)),
    db
      .select()
      .from(highlights)
      .where(eq(highlights.userId, userId))
      .orderBy(desc(highlights.createdAt)),
    db
      .select()
      .from(reflections)
      .where(eq(reflections.userId, userId))
      .orderBy(desc(reflections.createdAt)),
    db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.createdAt)),
    db.select({ id: quizzes.id, mode: quizzes.mode }).from(quizzes),
    db.select().from(userQuests).where(eq(userQuests.userId, userId)),
    db.select().from(userSkills).where(eq(userSkills.userId, userId)),
    db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1),
    db
      .select()
      .from(notificationDeliveryLogs)
      .where(eq(notificationDeliveryLogs.userId, userId))
      .orderBy(desc(notificationDeliveryLogs.createdAt))
      .limit(30),
    db.select().from(xpRules),
  ]);

  const completedVerses = progressRows.map((p) => p.verseCode);
  const completedDates = progressRows.map((p) => p.completedAt.toISOString().slice(0, 10));
  const totalXp = xpRows.reduce((sum, tx) => sum + tx.amount, 0);
  const level = calculateLevel(totalXp, completedVerses.length);
  const chapterStates = computeChapterStates(completedVerses);
  const consistency = calculateConsistencyStats(completedDates, todayIso);
  const welcomeBackGapDays = detectWelcomeBackGapDays(completedDates, todayIso);

  const schedule = generateReadingSchedule(completedVerses, prefs?.dailyVerseTarget ?? 3, 7);

  // Compute server-validated Quests, Challenges, and Skill Tree
  const quizModeMap = new Map(allQuizRows.map((q) => [q.id, q.mode]));
  const correctQuizIds = new Set<number>();
  const correctSanskritQuizIds = new Set<number>();
  for (const att of quizAttemptRows) {
    if (att.isCorrect) {
      correctQuizIds.add(att.quizId);
      const mode = quizModeMap.get(att.quizId);
      if (mode === 'vocabulary' || mode === 'missing_word' || mode === 'transliteration_order') {
        correctSanskritQuizIds.add(att.quizId);
      }
    }
  }

  const completedChallenges = xpRows
    .filter((tx) => tx.eventKey.startsWith('challenge:'))
    .map((tx) => tx.eventKey.slice('challenge:'.length));

  const purportReadCount = progressRows.filter((p) => p.purportRead).length;
  const todayVersesCompleted = progressRows.filter(
    (p) => p.completedAt.toISOString().slice(0, 10) === todayIso
  ).length;

  const activeChapter =
    chapterStates.find((c) => c.status === 'in_progress') ||
    chapterStates.find((c) => c.status === 'available') ||
    chapterStates[chapterStates.length - 1];

  const questStates = evaluateQuestStates({
    todayVersesCompleted,
    dailyVerseTarget: prefs?.dailyVerseTarget ?? 3,
    purportReadCount,
    bookmarksCount: bookmarkRows.length,
    reflectionsCount: reflectionRows.length,
    sanskritCorrectCount: correctSanskritQuizIds.size + completedChallenges.length,
    wisdomCorrectCount: correctQuizIds.size + completedChallenges.length,
    activeChapterCompletedCount: activeChapter?.completedCount ?? 0,
    activeChapterVerseCount: activeChapter?.verseCount ?? 46,
    activeChapterNumber: activeChapter?.chapterNumber ?? 1,
    activeDaysCount: consistency.activeDaysCount,
    acceptedCodes: questRows.map((q) => q.questCode),
    claimedKeys: questRows
      .filter((q) => q.status === 'claimed')
      .map((q) => `${q.questCode}:${q.periodKey}`),
    todayIso,
  });

  const completedChaptersCount = chapterStates.filter((c) => c.status === 'completed').length;
  const skillTree = evaluateSkillTreeStates({
    activeDays: consistency.activeDaysCount,
    memoryItems: bookmarkRows.length + reflectionRows.length,
    sanskritCompleted: correctSanskritQuizIds.size + completedChallenges.length,
    understandingActions: purportReadCount + correctQuizIds.size,
    completedChapters: completedChaptersCount,
    unlockedCodes: skillRows.map((s) => s.skillCode),
  });

  // Ensure today's mission record exists
  const reqs = resolveMissionRequirements(
    (prefs?.missionMode as MissionMode) || 'reading_only',
    prefs?.missionCustomRules
  );
  const [todayMission] = await db
    .insert(dailyMissions)
    .values({
      userId,
      missionDate: todayIso,
      targetVerses: prefs?.dailyVerseTarget ?? 3,
      completedVerses: todayVersesCompleted,
      requirements: reqs,
      status: prefs?.missionPaused ? 'paused' : 'active',
      assignedRange: schedule.nextAssignedRange,
    })
    .onConflictDoUpdate({
      target: [dailyMissions.userId, dailyMissions.missionDate],
      set: {
        assignedRange: schedule.nextAssignedRange,
      },
    })
    .returning();

  return {
    user: {
      id: userRow.id,
      uid: userRow.uid,
      email: userRow.email,
      displayName: userRow.displayName,
      role: userRow.role,
      authProvider: userRow.authProvider,
      createdAt: userRow.createdAt,
    },
    preferences: prefs,
    stats: {
      totalXp,
      level,
      completedVersesCount: completedVerses.length,
      totalVerses: 700,
      completedChaptersCount,
      activeDaysCount: consistency.activeDaysCount,
      currentStreakDays: consistency.currentStreakDays,
    },
    welcomeBackGapDays,
    completedVerses,
    readingHistory: progressRows.slice(0, 100),
    chapterStates,
    chapterUnlocks: unlockRows,
    todayMission,
    schedule,
    quests: questStates,
    skillTree,
    completedChallenges,
    xpTransactions: xpRows.slice(0, 50),
    xpRules: ruleRows,
    achievements: allAchRows,
    earnedAchievements: earnedAchRows,
    gardenItems: gardenRows,
    bookmarks: bookmarkRows,
    highlights: highlightRows,
    reflections: reflectionRows,
    quizAttempts: quizAttemptRows.slice(0, 50),
    notificationPreferences: notifPrefs,
    notifications: notifLogRows,
  };
}

export async function acceptQuestTransactional(userId: number, questCode: string) {
  const def = QUEST_CATALOG.find((q) => q.code === questCode);
  if (!def) {
    const err = new Error('Unknown quest code.');
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }
  const periodKey = def.periodType === 'daily' ? new Date().toISOString().slice(0, 10) : 'journey';
  await db
    .insert(userQuests)
    .values({
      userId,
      questCode: def.code,
      periodKey,
      status: 'accepted',
    })
    .onConflictDoNothing({
      target: [userQuests.userId, userQuests.questCode, userQuests.periodKey],
    });
  return { questCode: def.code, periodKey };
}

export async function claimQuestRewardTransactional(userId: number, questCode: string) {
  const def = QUEST_CATALOG.find((q) => q.code === questCode);
  if (!def) {
    const err = new Error('Unknown quest code.');
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }

  const bundle = await getUserStateBundle(userId);
  if (!bundle) throw new Error('User not found');

  const evaluated = bundle.quests.find((q) => q.code === questCode);
  if (!evaluated) {
    throw new Error('Quest unavailable.');
  }
  if (evaluated.status === 'claimed') {
    const err = new Error('Quest reward has already been claimed.');
    (err as Error & { statusCode?: number }).statusCode = 409;
    throw err;
  }
  if (evaluated.status !== 'ready_to_claim') {
    const err = new Error(`Quest objective not yet met (${evaluated.currentCount}/${evaluated.targetCount}).`);
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }

  let xpAwarded = 0;
  await db.transaction(async (tx) => {
    await tx
      .insert(userQuests)
      .values({
        userId,
        questCode: evaluated.code,
        periodKey: evaluated.periodKey,
        status: 'claimed',
        claimedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userQuests.userId, userQuests.questCode, userQuests.periodKey],
        set: {
          status: 'claimed',
          claimedAt: new Date(),
        },
      });

    const xpInsert = await tx
      .insert(xpTransactions)
      .values({
        userId,
        amount: evaluated.xpReward,
        reason: `Completed Quest: ${evaluated.title}`,
        eventKey: `quest_claim:${evaluated.code}:${evaluated.periodKey}`,
        metadata: { questCode: evaluated.code, periodKey: evaluated.periodKey },
      })
      .onConflictDoNothing({
        target: [xpTransactions.userId, xpTransactions.eventKey],
      })
      .returning();

    if (xpInsert.length > 0) {
      xpAwarded = evaluated.xpReward;
    }
  });

  return { quest: evaluated, xpAwarded };
}

export async function unlockSkillNodeTransactional(userId: number, skillCode: string) {
  const spec = SKILL_TREE_NODES.find((s) => s.code === skillCode);
  if (!spec) {
    const err = new Error('Unknown skill node.');
    (err as Error & { statusCode?: number }).statusCode = 404;
    throw err;
  }

  const bundle = await getUserStateBundle(userId);
  if (!bundle) throw new Error('User not found');

  const node = bundle.skillTree.find((n) => n.code === skillCode);
  if (!node) throw new Error('Skill node unavailable.');

  if (node.status === 'unlocked') {
    const err = new Error('Skill node is already unlocked.');
    (err as Error & { statusCode?: number }).statusCode = 409;
    throw err;
  }
  if (node.status !== 'ready') {
    const err = new Error(
      `Skill prerequisites or threshold not yet met (${node.requirementLabel}).`
    );
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }

  let xpAwarded = 0;
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(userSkills)
      .values({
        userId,
        skillCode: node.code,
      })
      .onConflictDoNothing({
        target: [userSkills.userId, userSkills.skillCode],
      })
      .returning();

    if (inserted.length > 0) {
      const xpInsert = await tx
        .insert(xpTransactions)
        .values({
          userId,
          amount: node.xpReward,
          reason: `Unlocked Skill: ${node.title}`,
          eventKey: `skill_unlock:${node.code}`,
          metadata: { skillCode: node.code, branch: node.branch },
        })
        .onConflictDoNothing({
          target: [xpTransactions.userId, xpTransactions.eventKey],
        })
        .returning();
      if (xpInsert.length > 0) {
        xpAwarded = node.xpReward;
      }
    }
  });

  return { skill: node, xpAwarded };
}

export async function recordInteractiveChallengeTransactional(
  userId: number,
  challengeType: 'sanskrit_match' | 'verse_order',
  challengeId: string,
  chapterNumber: number
) {
  let title = '';
  if (challengeType === 'sanskrit_match') {
    const found = SANSKRIT_MATCH_SETS.find((s) => s.id === challengeId);
    if (!found) {
      const err = new Error('Invalid Sanskrit matching challenge ID.');
      (err as Error & { statusCode?: number }).statusCode = 404;
      throw err;
    }
    title = found.title;
  } else {
    const found = VERSE_ORDER_CHALLENGES.find((s) => s.id === challengeId);
    if (!found) {
      const err = new Error('Invalid verse ordering challenge ID.');
      (err as Error & { statusCode?: number }).statusCode = 404;
      throw err;
    }
    title = found.title;
  }

  const xpAmount = 20;
  const eventKey = `challenge:${challengeType}:${challengeId}`;
  const inserted = await db
    .insert(xpTransactions)
    .values({
      userId,
      amount: xpAmount,
      reason: `Completed ${challengeType === 'sanskrit_match' ? 'Sanskrit Matching' : 'Verse Ordering'}: ${title}`,
      eventKey,
      metadata: { challengeType, challengeId, chapterNumber },
    })
    .onConflictDoNothing({
      target: [xpTransactions.userId, xpTransactions.eventKey],
    })
    .returning();

  return {
    challengeKey: `${challengeType}:${challengeId}`,
    xpAwarded: inserted.length > 0 ? xpAmount : 0,
  };
}

export async function dispatchReminderCheck(userId: number) {
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  if (!prefs) return { status: 'no_preferences' };

  const [userPref] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (prefs.frequency === 'paused') {
    return { status: 'paused', message: 'Notifications are paused by your preference.' };
  }

  let localTime = '08:00';
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: prefs.timezone || 'UTC',
    });
    localTime = formatter.format(new Date());
  } catch {
    localTime = new Date().toISOString().slice(11, 16);
  }

  if (isWithinQuietHours(localTime, prefs.quietHoursStart, prefs.quietHoursEnd)) {
    const [log] = await db
      .insert(notificationDeliveryLogs)
      .values({
        userId,
        channel: 'in_app',
        category: 'morning_reminder',
        title: 'Quiet Hours Active',
        body: `Reminder held during quiet hours (${prefs.quietHoursStart}–${prefs.quietHoursEnd} ${prefs.timezone}).`,
        status: 'skipped_quiet_hours',
      })
      .returning();
    return { status: 'skipped_quiet_hours', log };
  }

  const logs = [];
  if (prefs.inAppEnabled) {
    const [inAppLog] = await db
      .insert(notificationDeliveryLogs)
      .values({
        userId,
        channel: 'in_app',
        category: 'morning_reminder',
        title: 'Reading Reminder',
        body: `Your daily target of ${userPref?.dailyVerseTarget ?? 3} verses awaits at Bg. ${userPref?.lastChapter ?? 1}.${userPref?.lastVerse ?? 1}.`,
        status: 'delivered',
      })
      .returning();
    logs.push(inAppLog);
  }

  if (prefs.emailEnabled) {
    const emailConfigured = Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY);
    const [emailLog] = await db
      .insert(notificationDeliveryLogs)
      .values({
        userId,
        channel: 'email',
        category: 'morning_reminder',
        title: 'Email Reminder Request',
        body: emailConfigured
          ? 'Email reminder queued for dispatch.'
          : 'Email delivery provider (SMTP_HOST / RESEND_API_KEY) is not configured in this environment.',
        status: emailConfigured ? 'queued' : 'provider_unconfigured',
      })
      .returning();
    logs.push(emailLog);
  }

  return { status: 'processed', logs };
}
