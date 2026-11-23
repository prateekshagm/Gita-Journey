import {
  GITA_CHAPTERS,
  QUEST_CATALOG,
  SKILL_TREE_NODES,
  TOTAL_GITA_VERSES,
} from './gitaData.ts';

export type ThemeId = 'krishna' | 'radha_shyamasundara' | 'gauranga';
export type ReaderMode = 'light' | 'dark' | 'sepia';
export type MissionMode =
  | 'reading_only'
  | 'reading_purport'
  | 'reading_quiz'
  | 'reading_audio'
  | 'reading_reflection'
  | 'custom';

export interface LevelInfo {
  index: number;
  name: string;
  minXp: number;
  nextLevelXp: number | null;
  progressPercent: number;
  description: string;
}

export const LEVELS: Array<{ name: string; minXp: number; description: string }> = [
  {
    name: 'Curious Explorer',
    minXp: 0,
    description: 'Taking the first welcoming steps into the eighteen chapters of Bhagavad-gītā.',
  },
  {
    name: 'Gita Beginner',
    minXp: 150,
    description: 'Becoming familiar with the opening verses and establishing a comfortable pace.',
  },
  {
    name: 'Dedicated Reader',
    minXp: 450,
    description: 'Returning regularly to read verses, explore purports, and jot down reflections.',
  },
  {
    name: 'Knowledge Seeker',
    minXp: 900,
    description: 'Deepening comprehension of Sanskrit vocabulary and chapter themes.',
  },
  {
    name: 'Consistent Learner',
    minXp: 1600,
    description: 'Sustaining a thoughtful study habit across multiple chapters.',
  },
  {
    name: 'Gita Enthusiast',
    minXp: 2600,
    description: 'Connecting insights across the middle chapters with clarity and care.',
  },
  {
    name: 'Journey Champion',
    minXp: 4200,
    description: 'Progressing steadily toward the concluding synthesis of Chapter 18.',
  },
  {
    name: '700-Verse Achiever',
    minXp: 7000,
    description: 'Completed reading and tracking all 700 verses across all 18 chapters.',
  },
];

/**
 * Computes user level from cumulative non-negative XP.
 * XP is never deducted for missed days.
 */
export function calculateLevel(rawXp: number, completedVersesCount = 0): LevelInfo {
  const xp = Math.max(0, Math.floor(rawXp));
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (i === LEVELS.length - 1) {
      if (completedVersesCount >= TOTAL_GITA_VERSES || xp >= LEVELS[i].minXp) {
        idx = i;
      }
    } else if (xp >= LEVELS[i].minXp) {
      idx = i;
    }
  }
  const current = LEVELS[idx];
  const next = idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  const progressPercent = next
    ? Math.min(100, Math.max(0, Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100)))
    : 100;

  return {
    index: idx + 1,
    name: current.name,
    minXp: current.minXp,
    nextLevelXp: next ? next.minXp : null,
    progressPercent,
    description: current.description,
  };
}

/**
 * Determines which chapters are unlocked based strictly on completed verse sets.
 * Chapter 1 is always unlocked.
 * Chapter N+1 unlocks only when ALL verses of Chapter N are completed.
 * Quizzes and bonus activities never block scripture progression.
 */
export function computeChapterStates(completedVerseCodes: Iterable<string>): Array<{
  chapterNumber: number;
  verseCount: number;
  completedCount: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  progressPercent: number;
}> {
  const completedSet = new Set(completedVerseCodes);
  const results: Array<{
    chapterNumber: number;
    verseCount: number;
    completedCount: number;
    status: 'locked' | 'available' | 'in_progress' | 'completed';
    progressPercent: number;
  }> = [];

  let prevChapterCompleted = true;

  for (const ch of GITA_CHAPTERS) {
    let completedCount = 0;
    for (let v = 1; v <= ch.verseCount; v++) {
      if (completedSet.has(`${ch.chapterNumber}.${v}`)) {
        completedCount++;
      }
    }
    const isChapterCompleted = completedCount >= ch.verseCount;
    const isUnlocked = ch.chapterNumber === 1 || prevChapterCompleted || completedCount > 0;

    let status: 'locked' | 'available' | 'in_progress' | 'completed';
    if (isChapterCompleted) {
      status = 'completed';
    } else if (!isUnlocked) {
      status = 'locked';
    } else if (completedCount > 0) {
      status = 'in_progress';
    } else {
      status = 'available';
    }

    results.push({
      chapterNumber: ch.chapterNumber,
      verseCount: ch.verseCount,
      completedCount,
      status,
      progressPercent: Math.round((completedCount / ch.verseCount) * 100),
    });

    prevChapterCompleted = isChapterCompleted;
  }

  return results;
}

/**
 * Checks whether a user is allowed to record completion or unlock a chapter
 * based on server-authoritative progression rules.
 */
export function isChapterUnlockedForUser(
  chapterNumber: number,
  completedVerseCodes: Iterable<string>
): boolean {
  if (chapterNumber < 1 || chapterNumber > 18) return false;
  if (chapterNumber === 1) return true;
  const states = computeChapterStates(completedVerseCodes);
  const target = states.find((c) => c.chapterNumber === chapterNumber);
  return target ? target.status !== 'locked' : false;
}

/**
 * Generates a sensible reading schedule starting from the next unread verse.
 */
export function generateReadingSchedule(
  completedVerseCodes: Iterable<string>,
  dailyTarget: number,
  daysToPreview = 7
): {
  remainingVerses: number;
  estimatedDaysRemaining: number;
  nextAssignedRange: string;
  nextVerseCode: string;
  previewDays: Array<{ dayOffset: number; rangeLabel: string; verseCodes: string[] }>;
} {
  const safeTarget = Math.max(1, Math.min(50, Math.floor(dailyTarget || 3)));
  const completedSet = new Set(completedVerseCodes);
  const unread: string[] = [];

  for (const ch of GITA_CHAPTERS) {
    for (let v = 1; v <= ch.verseCount; v++) {
      const code = `${ch.chapterNumber}.${v}`;
      if (!completedSet.has(code)) {
        unread.push(code);
      }
    }
  }

  const remainingVerses = unread.length;
  if (remainingVerses === 0) {
    return {
      remainingVerses: 0,
      estimatedDaysRemaining: 0,
      nextAssignedRange: 'All 700 verses completed — Revision & Bookmarks',
      nextVerseCode: '18.78',
      previewDays: [],
    };
  }

  const previewDays: Array<{ dayOffset: number; rangeLabel: string; verseCodes: string[] }> = [];
  for (let d = 0; d < daysToPreview; d++) {
    const slice = unread.slice(d * safeTarget, (d + 1) * safeTarget);
    if (slice.length === 0) break;
    const label = slice.length === 1 ? `Bg. ${slice[0]}` : `Bg. ${slice[0]} – ${slice[slice.length - 1]}`;
    previewDays.push({
      dayOffset: d,
      rangeLabel: label,
      verseCodes: slice,
    });
  }

  return {
    remainingVerses,
    estimatedDaysRemaining: Math.ceil(remainingVerses / safeTarget),
    nextAssignedRange: previewDays[0]?.rangeLabel ?? `Bg. ${unread[0]}`,
    nextVerseCode: unread[0],
    previewDays,
  };
}

/**
 * Parses HH:MM into minutes since midnight and evaluates quiet hours cleanly (including overnight spans like 22:00 - 06:00).
 */
export function isWithinQuietHours(
  localTimeHHMM: string,
  quietStartHHMM: string,
  quietEndHHMM: string
): boolean {
  const parse = (str: string) => {
    const [h, m] = str.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
  };
  const current = parse(localTimeHHMM);
  const start = parse(quietStartHHMM);
  const end = parse(quietEndHHMM);

  if (start === end) return false;
  if (start < end) {
    return current >= start && current < end;
  }
  // Overnight quiet window (e.g. 22:00 to 06:00)
  return current >= start || current < end;
}

/**
 * Computes consistent calendar-day streak and total active days without deducting XP for missed days.
 */
export function calculateConsistencyStats(completedDateStrings: string[], todayIsoDate: string): {
  activeDaysCount: number;
  currentStreakDays: number;
} {
  const uniqueDays = Array.from(new Set(completedDateStrings)).sort();
  if (uniqueDays.length === 0) {
    return { activeDaysCount: 0, currentStreakDays: 0 };
  }

  const daySet = new Set(uniqueDays);
  const toDayNumber = (iso: string) => Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86400000);
  const todayNum = toDayNumber(todayIsoDate);

  // Streak stays intact if user read today OR yesterday (gentle grace for today's in-progress reading)
  let cursor = daySet.has(todayIsoDate) ? todayNum : todayNum - 1;
  let streak = 0;

  while (true) {
    const dateStr = new Date(cursor * 86400000).toISOString().slice(0, 10);
    if (daySet.has(dateStr)) {
      streak++;
      cursor--;
    } else {
      break;
    }
  }

  return {
    activeDaysCount: uniqueDays.length,
    currentStreakDays: streak,
  };
}

export function resolveMissionRequirements(
  mode: MissionMode,
  customRules?: {
    requirePurport?: boolean;
    requireQuiz?: boolean;
    requireReflection?: boolean;
    requireAudio?: boolean;
  }
) {
  switch (mode) {
    case 'reading_only':
      return { mode, requirePurport: false, requireQuiz: false, requireReflection: false, requireAudio: false };
    case 'reading_purport':
      return { mode, requirePurport: true, requireQuiz: false, requireReflection: false, requireAudio: false };
    case 'reading_quiz':
      return { mode, requirePurport: false, requireQuiz: true, requireReflection: false, requireAudio: false };
    case 'reading_audio':
      return { mode, requirePurport: false, requireQuiz: false, requireReflection: false, requireAudio: true };
    case 'reading_reflection':
      return { mode, requirePurport: false, requireQuiz: false, requireReflection: true, requireAudio: false };
    case 'custom':
      return {
        mode,
        requirePurport: Boolean(customRules?.requirePurport),
        requireQuiz: Boolean(customRules?.requireQuiz),
        requireReflection: Boolean(customRules?.requireReflection),
        requireAudio: Boolean(customRules?.requireAudio),
      };
  }
}

export function validateVerseCode(verseCode: string): { chapterNumber: number; verseNumber: number } | null {
  const match = /^(\d{1,2})\.(\d{1,2})$/.exec(verseCode.trim());
  if (!match) return null;
  const ch = Number(match[1]);
  const v = Number(match[2]);
  const chapter = GITA_CHAPTERS.find((c) => c.chapterNumber === ch);
  if (!chapter || v < 1 || v > chapter.verseCount) return null;
  return { chapterNumber: ch, verseNumber: v };
}

export interface QuestProgressInput {
  todayVersesCompleted: number;
  dailyVerseTarget: number;
  purportReadCount: number;
  bookmarksCount: number;
  reflectionsCount: number;
  sanskritCorrectCount: number;
  wisdomCorrectCount: number;
  activeChapterCompletedCount: number;
  activeChapterVerseCount: number;
  activeChapterNumber: number;
  activeDaysCount: number;
  acceptedCodes: string[];
  claimedKeys: string[];
  todayIso: string;
}

export interface EvaluatedQuest {
  code: string;
  title: string;
  category: string;
  periodType: 'daily' | 'journey';
  description: string;
  objectiveLabel: string;
  xpReward: number;
  currentCount: number;
  targetCount: number;
  progressPercent: number;
  status: 'available' | 'accepted' | 'ready_to_claim' | 'claimed';
  periodKey: string;
  actionNav: 'reading' | 'play' | 'map' | 'progress';
  actionLabel: string;
}

export function evaluateQuestStates(input: QuestProgressInput): EvaluatedQuest[] {
  const acceptedSet = new Set(input.acceptedCodes);
  const claimedSet = new Set(input.claimedKeys);

  return QUEST_CATALOG.map((q) => {
    let current = 0;
    let target = q.targetCount;
    let objectiveLabel = q.objectiveLabel;
    const periodKey = q.periodType === 'daily' ? input.todayIso : 'journey';

    if (q.code === 'daily_reading_quest') {
      current = input.todayVersesCompleted;
      target = Math.max(1, input.dailyVerseTarget);
      objectiveLabel = `Complete ${target} ${target === 1 ? 'verse' : 'verses'} today`;
    } else if (q.code === 'understand_teaching') {
      current = input.purportReadCount;
    } else if (q.code === 'remember_verse') {
      current = input.bookmarksCount + input.reflectionsCount;
    } else if (q.code === 'sanskrit_explorer') {
      current = input.sanskritCorrectCount;
    } else if (q.code === 'wisdom_challenge') {
      current = input.wisdomCorrectCount;
    } else if (q.code === 'chapter_completion_quest') {
      current = input.activeChapterCompletedCount;
      target = Math.max(1, input.activeChapterVerseCount);
      objectiveLabel = `Complete Chapter ${input.activeChapterNumber} (${target} verses)`;
    } else if (q.code === 'consistency_quest') {
      current = input.activeDaysCount;
    }

    const clamped = Math.min(current, target);
    const pct = Math.min(100, Math.round((clamped / Math.max(1, target)) * 100));
    const claimKey = `${q.code}:${periodKey}`;
    const isClaimed = claimedSet.has(claimKey);
    const isReady = current >= target && !isClaimed;
    const isAccepted = acceptedSet.has(q.code);

    let status: EvaluatedQuest['status'] = 'available';
    if (isClaimed) {
      status = 'claimed';
    } else if (isReady) {
      status = 'ready_to_claim';
    } else if (isAccepted || q.periodType === 'daily') {
      status = 'accepted';
    }

    return {
      code: q.code,
      title: q.title,
      category: q.category,
      periodType: q.periodType,
      description: q.description,
      objectiveLabel,
      xpReward: q.xpReward,
      currentCount: clamped,
      targetCount: target,
      progressPercent: pct,
      status,
      periodKey,
      actionNav: q.actionNav,
      actionLabel: q.actionLabel,
    };
  });
}

export interface SkillTreeInput {
  activeDays: number;
  memoryItems: number;
  sanskritCompleted: number;
  understandingActions: number;
  completedChapters: number;
  unlockedCodes: string[];
}

export interface EvaluatedSkillNode {
  code: string;
  branch: string;
  tier: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  requirementLabel: string;
  currentCount: number;
  threshold: number;
  prerequisiteCode: string | null;
  xpReward: number;
  status: 'locked' | 'ready' | 'unlocked';
}

export function evaluateSkillTreeStates(input: SkillTreeInput): EvaluatedSkillNode[] {
  const unlockedSet = new Set(input.unlockedCodes);

  return SKILL_TREE_NODES.map((node) => {
    const currentCount = input[node.metricKey];
    const prereqMet = !node.prerequisiteCode || unlockedSet.has(node.prerequisiteCode);
    const thresholdMet = currentCount >= node.threshold;

    let status: EvaluatedSkillNode['status'] = 'locked';
    if (unlockedSet.has(node.code)) {
      status = 'unlocked';
    } else if (prereqMet && thresholdMet) {
      status = 'ready';
    }

    return {
      code: node.code,
      branch: node.branch,
      tier: node.tier,
      title: node.title,
      description: node.description,
      requirementLabel: node.requirementLabel,
      currentCount: Math.min(currentCount, node.threshold),
      threshold: node.threshold,
      prerequisiteCode: node.prerequisiteCode,
      xpReward: node.xpReward,
      status,
    };
  });
}

export function detectWelcomeBackGapDays(
  completedDateStrings: string[],
  todayIsoDate: string
): number {
  const uniqueDays = Array.from(new Set(completedDateStrings)).sort();
  if (uniqueDays.length === 0) return 0;
  const lastDay = uniqueDays[uniqueDays.length - 1];
  const toDayNumber = (iso: string) => Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / 86400000);
  return Math.max(0, toDayNumber(todayIsoDate) - toDayNumber(lastDay));
}

