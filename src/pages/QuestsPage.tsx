import React from 'react';
import { ArrowRight, CheckCircle2, ScrollText, Sparkles } from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';

export const QuestsPage: React.FC = () => {
  const { bundle, acceptQuest, claimQuestReward, setActiveNav, updateTodayMission } = useJourney();
  if (!bundle) return null;

  const dailyQuests = bundle.quests.filter((q) => q.periodType === 'daily');
  const journeyQuests = bundle.quests.filter((q) => q.periodType === 'journey');

  const readyCount = bundle.quests.filter((q) => q.status === 'ready_to_claim').length;
  const claimedCount = bundle.quests.filter((q) => q.status === 'claimed').length;

  const renderQuestCard = (q: (typeof bundle.quests)[number]) => {
    const isClaimed = q.status === 'claimed';
    const isReady = q.status === 'ready_to_claim';

    return (
      <article
        key={q.code}
        className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors ${
          isReady
            ? 'border-[var(--gj-gold)] bg-[var(--gj-surface)]'
            : isClaimed
              ? 'border-[var(--gj-success)]/40 bg-[var(--gj-surface)]'
              : 'border-[var(--gj-border)] bg-[var(--gj-surface)]'
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[var(--gj-text-muted)]">
                {q.periodType === 'daily' ? 'Daily Quest' : 'Journey Quest'} · {q.category}
              </p>
              <h2 className="font-display text-2xl font-semibold text-[var(--gj-text)] mt-0.5">
                {q.title}
              </h2>
            </div>
            <span className="font-mono-num text-sm font-semibold text-[var(--gj-accent)] whitespace-nowrap">
              +{q.xpReward} XP
            </span>
          </div>

          <p className="text-sm text-[var(--gj-text-muted)] leading-relaxed">{q.description}</p>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--gj-text)]">{q.objectiveLabel}</span>
              <span className="font-mono-num text-[var(--gj-text-muted)]">
                {q.currentCount} / {q.targetCount} ({q.progressPercent}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--gj-surface-subtle)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${q.progressPercent}%`,
                  backgroundColor: isClaimed ? 'var(--gj-success)' : 'var(--gj-accent)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--gj-border)] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveNav(q.actionNav)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--gj-accent)] hover:underline whitespace-nowrap"
          >
            <span>{q.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            {isClaimed ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gj-success)]">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Reward Claimed</span>
              </span>
            ) : isReady ? (
              <button
                type="button"
                onClick={() => void claimQuestReward(q.code)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--gj-accent)] px-4 py-2 text-xs font-semibold text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)] whitespace-nowrap min-h-[38px]"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Claim +{q.xpReward} XP</span>
              </button>
            ) : q.status === 'available' ? (
              <button
                type="button"
                onClick={() => void acceptQuest(q.code)}
                className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-4 py-2 text-xs font-medium text-[var(--gj-text)] hover:border-[var(--gj-accent)] whitespace-nowrap min-h-[38px]"
              >
                Accept Quest
              </button>
            ) : (
              <span className="text-xs text-[var(--gj-text-muted)]">In Progress</span>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-8 gj-enter">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--gj-text-muted)]">
            Server-Validated Study Quests · {claimedCount} Claimed · {readyCount} Ready
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--gj-text)] mt-1">
            Quest Log
          </h1>
          <p className="text-sm text-[var(--gj-text-muted)] mt-1 max-w-2xl">
            Accept purposeful reading, Sanskrit, and comprehension quests to structure your daily
            practice. All objectives are verified from your actual reading & challenge history.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          <label htmlFor="quest-daily-target" className="text-[var(--gj-text-muted)]">
            Daily Target:
          </label>
          <select
            id="quest-daily-target"
            value={bundle.preferences.dailyVerseTarget}
            onChange={(e) => void updateTodayMission('update_target', Number(e.target.value))}
            className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-surface)] px-3 py-2 text-xs font-medium"
          >
            {[1, 2, 3, 5, 7, 10, 15].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'verse' : 'verses'} / day
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Daily Quest Highlight */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-[var(--gj-accent)]" aria-hidden="true" />
          <span>Today’s Quest</span>
        </h2>
        <div className="grid grid-cols-1 gap-4">{dailyQuests.map(renderQuestCard)}</div>
      </section>

      {/* Journey Quests */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Journey & Mastery Quests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{journeyQuests.map(renderQuestCard)}</div>
      </section>
    </div>
  );
};
