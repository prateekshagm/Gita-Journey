import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  GitBranch,
  Pause,
  Play,
  ScrollText,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';
import { getThemeSpec } from '../lib/themes.ts';
import { GITA_CHAPTERS } from '../shared/gitaData.ts';

export const HomeDashboard: React.FC = () => {
  const {
    bundle,
    openReaderAt,
    setActiveNav,
    updateTodayMission,
    updatePreferences,
    acceptQuest,
    claimQuestReward,
  } = useJourney();

  if (!bundle) return null;

  const themeSpec = getThemeSpec(bundle.preferences.theme);
  const currentCh =
    GITA_CHAPTERS.find((c) => c.chapterNumber === bundle.preferences.lastChapter) ?? GITA_CHAPTERS[0];
  const currentChState = bundle.chapterStates.find(
    (s) => s.chapterNumber === currentCh.chapterNumber
  );

  const missionProgressPct = Math.min(
    100,
    Math.round(
      (bundle.todayMission.completedVerses / Math.max(1, bundle.todayMission.targetVerses)) * 100
    )
  );

  const earnedList = bundle.achievements.filter((a) =>
    bundle.earnedAchievements.some((e) => e.achievementCode === a.code)
  );

  const MISSION_MODE_LABELS: Record<string, string> = {
    reading_only: 'Reading Only',
    reading_purport: 'Reading + Purport',
    reading_quiz: 'Reading + Play & Learn Quiz',
    reading_reflection: 'Reading + Reflection Note',
    reading_audio: 'Reading + Authorized Audio',
    custom: 'Custom Combination',
  };

  const lastCode = `${bundle.preferences.lastChapter || 1}.${bundle.preferences.lastVerse || 1}`;
  const resumeCode = bundle.completedVerses.includes(lastCode)
    ? bundle.schedule.nextVerseCode
    : lastCode;
  const [resumeCh, resumeV] = resumeCode.split('.').map(Number);

  const greetingName = bundle.user?.displayName || 'Explorer';
  const welcomeBackGap = bundle.welcomeBackGapDays ?? 0;

  const featuredQuests = (bundle.quests || []).slice(0, 3);
  const readySkillsCount = (bundle.skillTree || []).filter((s) => s.status === 'ready').length;

  return (
    <div className="space-y-8 gj-enter">
      {/* Warm Welcome-Back Notice after breaks */}
      {welcomeBackGap >= 2 && (
        <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-surface)] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--gj-text)]">
              Welcome back, {greetingName}
            </p>
            <p className="text-xs text-[var(--gj-text-muted)] mt-0.5">
              It has been {welcomeBackGap} days since your last session. Your{' '}
              <span className="font-mono-num">{bundle.stats.completedVersesCount}</span> completed verses and{' '}
              <span className="font-mono-num">{bundle.stats.totalXp} XP</span> remain safely preserved—XP is never deducted.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openReaderAt(resumeCh || 1, resumeV || 1)}
            className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3.5 py-2 text-xs font-medium text-[var(--gj-text)] hover:border-[var(--gj-accent)] whitespace-nowrap shrink-0"
          >
            Resume at Bg. {resumeCode}
          </button>
        </div>
      )}

      {/* Dominant Focal Anchor Hero (Pure Typography & Progression — Zero Images) */}
      <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs text-[var(--gj-text-muted)]">
              {themeSpec.name} · Level {bundle.stats.level.index}: {bundle.stats.level.name}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--gj-text)] headline-balance">
              Hare Kṛṣṇa, {greetingName}
            </h1>
            <p className="text-sm text-[var(--gj-text-muted)] leading-relaxed">
              {bundle.stats.level.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => openReaderAt(resumeCh || 1, resumeV || 1)}
              className="inline-flex items-center gap-2.5 rounded-xl bg-[var(--gj-accent)] px-6 py-3.5 text-sm font-semibold text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)] transition-colors shadow-sm whitespace-nowrap shrink-0 min-h-[48px]"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>CONTINUE READING · Bg. {resumeCode}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveNav('map')}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] px-4 py-3 text-sm font-medium text-[var(--gj-text)] hover:bg-[var(--gj-surface-subtle)] transition-colors whitespace-nowrap shrink-0 min-h-[48px]"
            >
              <Compass className="w-4 h-4" aria-hidden="true" />
              <span>Adventure Map</span>
            </button>
          </div>
        </div>

        {/* Compact Journey Progress Strip */}
        <div className="pt-5 border-t border-[var(--gj-border)] grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-4">
            <p className="text-xs text-[var(--gj-text-muted)]">Verses Completed</p>
            <p className="font-mono-num text-2xl font-semibold text-[var(--gj-text)] mt-1">
              {bundle.stats.completedVersesCount} / {bundle.stats.totalVerses}
            </p>
            <p className="text-xs text-[var(--gj-text-muted)] mt-1">
              {Math.round((bundle.stats.completedVersesCount / 700) * 100)}% of Bhagavad-gītā
            </p>
          </div>

          <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-4">
            <p className="text-xs text-[var(--gj-text-muted)]">Study XP & Level</p>
            <p className="font-mono-num text-2xl font-semibold text-[var(--gj-text)] mt-1">
              {bundle.stats.totalXp} XP
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--gj-surface-subtle)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--gj-accent)]"
                style={{ width: `${bundle.stats.level.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-4">
            <p className="text-xs text-[var(--gj-text-muted)]">Chapters Unlocked</p>
            <p className="font-mono-num text-2xl font-semibold text-[var(--gj-text)] mt-1">
              {bundle.chapterStates.filter((c) => c.status !== 'locked').length} / 18
            </p>
            <p className="text-xs text-[var(--gj-text-muted)] mt-1">
              {bundle.stats.completedChaptersCount} completed
            </p>
          </div>

          <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-4">
            <p className="text-xs text-[var(--gj-text-muted)]">Consistent Days</p>
            <p className="font-mono-num text-2xl font-semibold text-[var(--gj-text)] mt-1">
              {bundle.stats.activeDaysCount} {bundle.stats.activeDaysCount === 1 ? 'day' : 'days'}
            </p>
            <p className="text-xs text-[var(--gj-text-muted)] mt-1">
              Current streak: {bundle.stats.currentStreakDays}{' '}
              {bundle.stats.currentStreakDays === 1 ? 'day' : 'days'}
            </p>
          </div>
        </div>
      </section>

      {/* Today's Personal Mission & Active Quests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-6 rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-5">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-[var(--gj-text-muted)]">
                  Today’s Mission · {bundle.todayMission.missionDate}
                </p>
                <h2 className="font-display text-2xl font-semibold text-[var(--gj-text)] mt-1">
                  {bundle.todayMission.assignedRange}
                </h2>
              </div>
              <span className="text-xs font-medium text-[var(--gj-accent)] capitalize">
                {bundle.todayMission.status}
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-[var(--gj-text-muted)] mb-1.5">
                <span>
                  Daily Progress:{' '}
                  <strong className="font-mono-num text-[var(--gj-text)]">
                    {bundle.todayMission.completedVerses} / {bundle.todayMission.targetVerses}
                  </strong>{' '}
                  verses
                </span>
                <span className="font-mono-num">{missionProgressPct}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[var(--gj-surface-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--gj-accent)] transition-all duration-300"
                  style={{ width: `${missionProgressPct}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--gj-text-muted)]">
              <div className="rounded-lg bg-[var(--gj-bg)] border border-[var(--gj-border)] p-3">
                <p className="font-medium text-[var(--gj-text)]">Mission Requirements</p>
                <p className="mt-1">
                  {MISSION_MODE_LABELS[bundle.preferences.missionMode] || 'Reading Only'}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--gj-bg)] border border-[var(--gj-border)] p-3">
                <p className="font-medium text-[var(--gj-text)]">Pace Forecast</p>
                <p className="mt-1">
                  {bundle.schedule.remainingVerses} remaining (~{bundle.schedule.estimatedDaysRemaining} days)
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--gj-border)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="dash-target-select" className="text-xs text-[var(--gj-text-muted)]">
                Target:
              </label>
              <select
                id="dash-target-select"
                value={bundle.preferences.dailyVerseTarget}
                onChange={(e) => void updateTodayMission('update_target', Number(e.target.value))}
                className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-2.5 py-1.5 text-xs text-[var(--gj-text)]"
              >
                {[1, 2, 3, 5, 7, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} verses/day
                  </option>
                ))}
              </select>

              {bundle.todayMission.status === 'paused' ? (
                <button
                  type="button"
                  onClick={() => void updateTodayMission('resume')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gj-border)] px-3 py-1.5 text-xs font-medium text-[var(--gj-text)] hover:bg-[var(--gj-surface-subtle)]"
                >
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void updateTodayMission('pause')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gj-border)] px-3 py-1.5 text-xs font-medium text-[var(--gj-text)] hover:bg-[var(--gj-surface-subtle)]"
                >
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Pause</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => void updateTodayMission('skip')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gj-border)] px-3 py-1.5 text-xs font-medium text-[var(--gj-text)] hover:bg-[var(--gj-surface-subtle)]"
              >
                <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Skip Today</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const [ch, v] = bundle.schedule.nextVerseCode.split('.').map(Number);
                openReaderAt(ch || 1, v || 1);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--gj-accent)] hover:underline"
            >
              <span>Read Next (Bg. {bundle.schedule.nextVerseCode})</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* Active Quests Preview */}
        <section className="lg:col-span-6 rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-[var(--gj-accent)]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-semibold text-[var(--gj-text)]">
                Active Quests
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('quests')}
              className="text-xs font-medium text-[var(--gj-accent)] hover:underline whitespace-nowrap"
            >
              View all 7 quests →
            </button>
          </div>

          <div className="space-y-3">
            {featuredQuests.map((q) => (
              <div
                key={q.code}
                className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--gj-text)]">{q.title}</p>
                    <p className="text-xs text-[var(--gj-text-muted)]">{q.objectiveLabel}</p>
                  </div>
                  <span className="font-mono-num text-xs font-semibold text-[var(--gj-accent)] whitespace-nowrap">
                    +{q.xpReward} XP
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--gj-surface-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--gj-accent)] transition-all"
                      style={{ width: `${q.progressPercent}%` }}
                    />
                  </div>
                  <span className="font-mono-num text-[11px] text-[var(--gj-text-muted)]">
                    {q.currentCount}/{q.targetCount}
                  </span>

                  {q.status === 'ready_to_claim' ? (
                    <button
                      type="button"
                      onClick={() => void claimQuestReward(q.code)}
                      className="rounded-lg bg-[var(--gj-accent)] px-3 py-1 text-xs font-medium text-[var(--gj-accent-text)] whitespace-nowrap"
                    >
                      Claim +{q.xpReward} XP
                    </button>
                  ) : q.status === 'available' ? (
                    <button
                      type="button"
                      onClick={() => void acceptQuest(q.code)}
                      className="rounded-lg border border-[var(--gj-border)] px-3 py-1 text-xs font-medium text-[var(--gj-text)] hover:border-[var(--gj-accent)] whitespace-nowrap"
                    >
                      Accept
                    </button>
                  ) : q.status === 'claimed' ? (
                    <span className="text-xs font-medium text-[var(--gj-success)]">Claimed</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveNav(q.actionNav)}
                      className="text-xs font-medium text-[var(--gj-accent)] hover:underline whitespace-nowrap"
                    >
                      Go →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {readySkillsCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveNav('skills')}
              className="w-full rounded-xl border border-[var(--gj-gold)]/50 bg-[var(--gj-surface-subtle)] px-4 py-2.5 text-xs font-medium text-[var(--gj-text)] flex items-center justify-between hover:border-[var(--gj-accent)]"
            >
              <span className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[var(--gj-accent)]" aria-hidden="true" />
                <span>
                  {readySkillsCount} {readySkillsCount === 1 ? 'skill node is' : 'skill nodes are'} ready to unlock in your Skill Tree
                </span>
              </span>
              <Sparkles className="w-4 h-4 text-[var(--gj-gold)]" aria-hidden="true" />
            </button>
          )}
        </section>
      </div>

      {/* Current Chapter & Recent Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-6 rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6">
          <p className="text-xs text-[var(--gj-text-muted)]">
            Current Chapter · {currentCh.transliterationTitle}
          </p>
          <h2 className="font-display text-2xl font-semibold text-[var(--gj-text)] mt-1">
            Chapter {currentCh.chapterNumber}: {currentCh.englishTitle}
          </h2>
          <p className="text-xs text-[var(--gj-text-muted)] mt-2 line-clamp-3">
            {currentCh.summary}
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[var(--gj-text-muted)] mb-1">
              <span>
                {currentChState?.completedCount ?? 0} of {currentCh.verseCount} verses
              </span>
              <span className="font-mono-num">{currentChState?.progressPercent ?? 0}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--gj-surface-subtle)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--gj-accent)]"
                style={{ width: `${currentChState?.progressPercent ?? 0}%` }}
              />
            </div>
          </div>
        </section>

        <section className="lg:col-span-6 rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Recent Milestones</h2>
            <button
              type="button"
              onClick={() => setActiveNav('achievements')}
              className="text-xs font-medium text-[var(--gj-accent)] hover:underline"
            >
              View all
            </button>
          </div>
          {earnedList.length === 0 ? (
            <p className="text-xs text-[var(--gj-text-muted)] mt-3">
              Complete your first verse in Chapter 1 to unlock your first study milestone and lotus
              for your garden.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {earnedList.slice(0, 3).map((a) => (
                <li key={a.code} className="text-xs border-b border-[var(--gj-border)] pb-2 last:border-0">
                  <span className="font-medium text-[var(--gj-text)]">{a.title}</span>
                  <span className="text-[var(--gj-text-muted)] block">{a.description}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 pt-3 border-t border-[var(--gj-border)] flex items-center justify-between">
            <span className="text-xs text-[var(--gj-text-muted)]">Quick Theme Switch</span>
            <div className="flex items-center gap-1.5">
              {(['krishna', 'radha_shyamasundara', 'gauranga'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => void updatePreferences({ theme: t })}
                  className={`px-2 py-1 rounded text-[11px] font-medium border ${
                    bundle.preferences.theme === t
                      ? 'border-[var(--gj-accent)] bg-[var(--gj-accent-soft)] text-[var(--gj-text)]'
                      : 'border-[var(--gj-border)] text-[var(--gj-text-muted)]'
                  }`}
                >
                  {t === 'krishna' ? 'Krishna' : t === 'gauranga' ? 'Gauranga' : 'Radha-Shyama'}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
