import React, { useState } from 'react';
import { Award, CheckCircle2, Lock, Printer } from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';
import { GITA_CHAPTERS } from '../shared/gitaData.ts';
import { LEVELS } from '../shared/progression.ts';

export const AchievementsPage: React.FC = () => {
  const { bundle } = useJourney();
  const [showCertificate, setShowCertificate] = useState(false);

  if (!bundle) return null;

  const earnedMap = new Map(
    bundle.earnedAchievements.map((e) => [e.achievementCode, e.earnedAt])
  );

  const canClaim700Certificate = bundle.stats.completedVersesCount >= 700;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--gj-text-muted)]">
            Educational Milestones · {bundle.earnedAchievements.length} of {bundle.achievements.length} Earned
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
            Achievements & Certificates
          </h1>
          <p className="text-sm text-[var(--gj-text-muted)] mt-1 max-w-2xl">
            Badges recognize reading milestones and consistent study habits. They are educational
            keepsakes only and never measure personal devotion or spiritual standing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCertificate((s) => !s)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--gj-border)] bg-[var(--gj-surface)] px-4 py-2.5 text-xs font-medium hover:bg-[var(--gj-surface-subtle)] self-start min-h-[40px]"
        >
          <Printer className="w-4 h-4" aria-hidden="true" />
          <span>{showCertificate ? 'Hide Certificate Preview' : 'Completion Certificate'}</span>
        </button>
      </div>

      {showCertificate && (
        <section className="rounded-2xl border-2 border-[var(--gj-gold)] bg-[var(--gj-surface)] p-8 text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gj-text-muted)]">
            GĪTĀ JOURNEY · Certificate of Study Completion
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold">
            {bundle.user?.displayName || 'Guest Explorer'}
          </h2>
          <p className="text-sm text-[var(--gj-text-muted)] max-w-lg mx-auto">
            {canClaim700Certificate
              ? 'Has completed reading and tracking all 700 verses across the 18 chapters of Bhagavad-gītā As It Is.'
              : `Currently on the 700-verse reading path (${bundle.stats.completedVersesCount} / 700 verses completed). Complete all 700 verses to finalize your official completion certificate.`}
          </p>
          <p className="font-mono-num text-xs text-[var(--gj-text-muted)]">
            Verses Completed: {bundle.stats.completedVersesCount} / 700 · Level: {bundle.stats.level.name}
          </p>
          {canClaim700Certificate && (
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-[var(--gj-accent)] px-5 py-2 text-xs font-medium text-[var(--gj-accent-text)]"
            >
              Print / Save PDF Certificate
            </button>
          )}
        </section>
      )}

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bundle.achievements.map((ach) => {
          const earnedAt = earnedMap.get(ach.code);
          const earned = Boolean(earnedAt);
          return (
            <div
              key={ach.code}
              className={`rounded-xl border p-5 flex flex-col justify-between ${
                earned
                  ? 'border-[var(--gj-accent)]/40 bg-[var(--gj-surface)]'
                  : 'border-[var(--gj-border)] bg-[var(--gj-bg)] opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[var(--gj-text-muted)] capitalize">
                    {ach.category.replace('_', ' ')}
                  </span>
                  {earned ? (
                    <span className="inline-flex items-center gap-1 font-medium text-[var(--gj-success)]">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Earned
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[var(--gj-text-muted)]">
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                      Locked
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-start gap-3">
                  <Award
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      earned ? 'text-[var(--gj-accent)]' : 'text-[var(--gj-text-muted)]'
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="font-display text-xl font-semibold">{ach.title}</h2>
                    <p className="text-xs text-[var(--gj-text-muted)] mt-1">{ach.description}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--gj-border)] flex items-center justify-between text-xs text-[var(--gj-text-muted)]">
                <span className="font-mono-num">+{ach.xpReward} XP</span>
                <span>
                  {earnedAt
                    ? `Earned ${new Date(earnedAt).toLocaleDateString()}`
                    : ach.gardenRewardCode
                      ? 'Includes garden reward'
                      : 'Milestone reward'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ProgressPage: React.FC = () => {
  const { bundle, openReaderAt } = useJourney();
  if (!bundle) return null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[var(--gj-text-muted)]">
          Auditable Study Ledger · Cumulative Consistency
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
          My Progress
        </h1>
        <p className="text-sm text-[var(--gj-text-muted)] mt-1 max-w-2xl">
          Track your reading schedule, transparent XP rules, level milestones, and chapter-by-chapter
          completion across all 700 verses.
        </p>
      </div>

      {/* Level Ladder */}
      <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs text-[var(--gj-text-muted)]">Current Level</p>
            <h2 className="font-display text-2xl font-semibold">
              Level {bundle.stats.level.index}: {bundle.stats.level.name}
            </h2>
          </div>
          <p className="font-mono-num text-sm font-medium">
            {bundle.stats.totalXp} XP
            {bundle.stats.level.nextLevelXp
              ? ` / ${bundle.stats.level.nextLevelXp} XP to next level`
              : ' (Top tier reached)'}
          </p>
        </div>

        <div className="h-2.5 rounded-full bg-[var(--gj-surface-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--gj-accent)]"
            style={{ width: `${bundle.stats.level.progressPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {LEVELS.map((lvl, idx) => {
            const reached = idx + 1 <= bundle.stats.level.index;
            return (
              <div
                key={lvl.name}
                className={`rounded-lg border p-3 text-xs ${
                  reached
                    ? 'border-[var(--gj-accent)]/40 bg-[var(--gj-bg)]'
                    : 'border-[var(--gj-border)] opacity-60'
                }`}
              >
                <p className="font-mono-num text-[11px] text-[var(--gj-text-muted)]">
                  Lv. {idx + 1} · {lvl.minXp} XP
                </p>
                <p className="font-semibold text-[var(--gj-text)] mt-0.5">{lvl.name}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transparent XP Rules & Transaction Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6">
          <h2 className="font-display text-xl font-semibold">Transparent XP Rules</h2>
          <p className="text-xs text-[var(--gj-text-muted)] mt-1">
            Rewards are non-duplicable and never deducted for missed days.
          </p>
          <ul className="mt-4 divide-y divide-[var(--gj-border)] text-xs">
            {bundle.xpRules.map((rule) => (
              <li key={rule.code} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--gj-text)]">{rule.label}</p>
                  <p className="text-[var(--gj-text-muted)] mt-0.5">{rule.description}</p>
                </div>
                <span className="font-mono-num font-semibold text-[var(--gj-accent)] whitespace-nowrap">
                  +{rule.xpAmount} XP
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="lg:col-span-7 rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6">
          <h2 className="font-display text-xl font-semibold">XP & Reading Ledger</h2>
          {bundle.xpTransactions.length === 0 ? (
            <p className="text-xs text-[var(--gj-text-muted)] mt-3">
              No XP entries recorded yet. Complete your first verse in the Reading Room to begin your ledger.
            </p>
          ) : (
            <div className="mt-4 max-h-80 overflow-y-auto divide-y divide-[var(--gj-border)] text-xs">
              {bundle.xpTransactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-[var(--gj-text)]">{tx.reason}</p>
                    <p className="text-[var(--gj-text-muted)]">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="font-mono-num font-semibold text-[var(--gj-success)] whitespace-nowrap">
                    +{tx.amount} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 18-Chapter Tabular Breakdown */}
      <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--gj-border)]">
          <h2 className="font-display text-xl font-semibold">Chapter-by-Chapter Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--gj-border)] bg-[var(--gj-surface-subtle)] text-[var(--gj-text-muted)]">
                <th className="py-3 px-4 font-medium">Ch.</th>
                <th className="py-3 px-4 font-medium">Title</th>
                <th className="py-3 px-4 font-medium">Read / Total</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gj-border)]">
              {GITA_CHAPTERS.map((ch) => {
                const st = bundle.chapterStates.find((s) => s.chapterNumber === ch.chapterNumber)!;
                return (
                  <tr key={ch.chapterNumber}>
                    <td className="py-3 px-4 font-mono-num">{ch.chapterNumber}</td>
                    <td className="py-3 px-4 font-medium">{ch.englishTitle}</td>
                    <td className="py-3 px-4 font-mono-num">
                      {st.completedCount} / {st.verseCount} ({st.progressPercent}%)
                    </td>
                    <td className="py-3 px-4 capitalize">{st.status.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openReaderAt(ch.chapterNumber, 1)}
                        className="text-[var(--gj-accent)] hover:underline font-medium"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
