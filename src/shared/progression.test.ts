import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GITA_CHAPTERS,
  TOTAL_GITA_VERSES,
  buildAllVerseMetadata,
  VERIFIED_QUIZ_SEEDS,
  SANSKRIT_MATCH_SETS,
  VERSE_ORDER_CHALLENGES,
} from './gitaData.ts';
import {
  calculateLevel,
  computeChapterStates,
  isChapterUnlockedForUser,
  generateReadingSchedule,
  isWithinQuietHours,
  calculateConsistencyStats,
  validateVerseCode,
  evaluateQuestStates,
  evaluateSkillTreeStates,
  detectWelcomeBackGapDays,
} from './progression.ts';

test('Gita structure matches exact 18 chapters and 700 verses verified against Vedabase', () => {
  assert.equal(GITA_CHAPTERS.length, 18);
  const expectedCounts = [46, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78];
  assert.deepEqual(
    GITA_CHAPTERS.map((c) => c.verseCount),
    expectedCounts
  );
  assert.equal(TOTAL_GITA_VERSES, 700);
  const allVerses = buildAllVerseMetadata();
  assert.equal(allVerses.length, 700);
  assert.equal(allVerses[0].verseCode, '1.1');
  assert.equal(allVerses[0].vedabaseUrl, 'https://vedabase.io/en/library/bg/1/1/');
  assert.equal(allVerses[699].verseCode, '18.78');
  assert.equal(allVerses[699].vedabaseUrl, 'https://vedabase.io/en/library/bg/18/78/');
});

test('Level calculation uses neutral encouraging tiers and never drops below 0 XP', () => {
  assert.equal(calculateLevel(0).name, 'Curious Explorer');
  assert.equal(calculateLevel(-50).name, 'Curious Explorer');
  assert.equal(calculateLevel(150).name, 'Gita Beginner');
  assert.equal(calculateLevel(450).name, 'Dedicated Reader');
  assert.equal(calculateLevel(900).name, 'Knowledge Seeker');
  assert.equal(calculateLevel(1600).name, 'Consistent Learner');
  assert.equal(calculateLevel(2600).name, 'Gita Enthusiast');
  assert.equal(calculateLevel(4200).name, 'Journey Champion');
  assert.equal(calculateLevel(7000).name, '700-Verse Achiever');
  assert.equal(calculateLevel(200, 700).name, '700-Verse Achiever');
});

test('Chapter unlocking starts at Chapter 1 and unlocks Chapter 2 only after all 46 verses of Chapter 1', () => {
  const initial = computeChapterStates([]);
  assert.equal(initial[0].status, 'available');
  assert.equal(initial[1].status, 'locked');
  assert.equal(isChapterUnlockedForUser(1, []), true);
  assert.equal(isChapterUnlockedForUser(2, []), false);

  const partialCh1 = Array.from({ length: 45 }, (_, i) => `1.${i + 1}`);
  const partialStates = computeChapterStates(partialCh1);
  assert.equal(partialStates[0].status, 'in_progress');
  assert.equal(partialStates[0].completedCount, 45);
  assert.equal(partialStates[1].status, 'locked');
  assert.equal(isChapterUnlockedForUser(2, partialCh1), false);

  const fullCh1 = Array.from({ length: 46 }, (_, i) => `1.${i + 1}`);
  const unlockedStates = computeChapterStates(fullCh1);
  assert.equal(unlockedStates[0].status, 'completed');
  assert.equal(unlockedStates[1].status, 'available');
  assert.equal(unlockedStates[2].status, 'locked');
  assert.equal(isChapterUnlockedForUser(2, fullCh1), true);
  assert.equal(isChapterUnlockedForUser(3, fullCh1), false);
});

test('Daily reading schedule computes remaining verses and multi-day ranges accurately', () => {
  const schedule = generateReadingSchedule(['1.1', '1.2'], 3, 2);
  assert.equal(schedule.remainingVerses, 698);
  assert.equal(schedule.nextVerseCode, '1.3');
  assert.equal(schedule.nextAssignedRange, 'Bg. 1.3 – 1.5');
  assert.equal(schedule.previewDays.length, 2);
  assert.deepEqual(schedule.previewDays[1].verseCodes, ['1.6', '1.7', '1.8']);
});

test('Quiet hours handle overnight and daytime windows accurately', () => {
  assert.equal(isWithinQuietHours('23:15', '22:00', '06:00'), true);
  assert.equal(isWithinQuietHours('05:59', '22:00', '06:00'), true);
  assert.equal(isWithinQuietHours('06:00', '22:00', '06:00'), false);
  assert.equal(isWithinQuietHours('14:00', '22:00', '06:00'), false);
});

test('Consistency calculation tracks active days without penalizing missed days', () => {
  const stats = calculateConsistencyStats(['2026-11-20', '2026-11-22', '2026-11-23'], '2026-11-23');
  assert.equal(stats.activeDaysCount, 3);
  assert.equal(stats.currentStreakDays, 2);
});

test('Verse code validator rejects invalid chapters and out-of-range verses', () => {
  assert.deepEqual(validateVerseCode('1.46'), { chapterNumber: 1, verseNumber: 46 });
  assert.equal(validateVerseCode('1.47'), null);
  assert.equal(validateVerseCode('19.1'), null);
  assert.deepEqual(validateVerseCode('2.72'), { chapterNumber: 2, verseNumber: 72 });
  assert.equal(validateVerseCode('2.73'), null);
});

test('All quiz seeds have valid source references and valid correctIndex', () => {
  for (const q of VERIFIED_QUIZ_SEEDS) {
    assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length);
    assert.ok(q.sourceReference.includes('vedabase.io/en/library/bg/'));
  }
  assert.ok(SANSKRIT_MATCH_SETS.length >= 3);
  assert.ok(VERSE_ORDER_CHALLENGES.length >= 4);
});

test('Quest evaluator computes ready_to_claim, accepted, and claimed states accurately', () => {
  const quests = evaluateQuestStates({
    todayVersesCompleted: 3,
    dailyVerseTarget: 3,
    purportReadCount: 1,
    bookmarksCount: 2,
    reflectionsCount: 1,
    sanskritCorrectCount: 0,
    wisdomCorrectCount: 1,
    activeChapterCompletedCount: 10,
    activeChapterVerseCount: 46,
    activeChapterNumber: 1,
    activeDaysCount: 1,
    acceptedCodes: ['understand_teaching'],
    claimedKeys: ['remember_verse:journey'],
    todayIso: '2026-11-23',
  });
  const daily = quests.find((q) => q.code === 'daily_reading_quest')!;
  const understand = quests.find((q) => q.code === 'understand_teaching')!;
  const remember = quests.find((q) => q.code === 'remember_verse')!;
  assert.equal(daily.status, 'ready_to_claim');
  assert.equal(understand.status, 'accepted');
  assert.equal(remember.status, 'claimed');
});

test('Skill tree evaluator respects prerequisites and study thresholds', () => {
  const nodes = evaluateSkillTreeStates({
    activeDays: 4,
    memoryItems: 0,
    sanskritCompleted: 0,
    understandingActions: 0,
    completedChapters: 0,
    unlockedCodes: [],
  });
  const c1 = nodes.find((n) => n.code === 'consistency_1')!;
  const c2 = nodes.find((n) => n.code === 'consistency_2')!;
  assert.equal(c1.status, 'ready');
  assert.equal(c2.status, 'locked'); // locked until prerequisite consistency_1 is unlocked

  const afterC1 = evaluateSkillTreeStates({
    activeDays: 4,
    memoryItems: 0,
    sanskritCompleted: 0,
    understandingActions: 0,
    completedChapters: 0,
    unlockedCodes: ['consistency_1'],
  });
  assert.equal(afterC1.find((n) => n.code === 'consistency_1')!.status, 'unlocked');
  assert.equal(afterC1.find((n) => n.code === 'consistency_2')!.status, 'ready');
});

test('Welcome-back gap detector calculates days since last reading session', () => {
  assert.equal(detectWelcomeBackGapDays([], '2026-11-23'), 0);
  assert.equal(detectWelcomeBackGapDays(['2026-11-23'], '2026-11-23'), 0);
  assert.equal(detectWelcomeBackGapDays(['2026-11-18'], '2026-11-23'), 5);
});

