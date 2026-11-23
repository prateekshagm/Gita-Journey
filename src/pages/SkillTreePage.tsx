import React from 'react';
import { CheckCircle2, GitBranch, Lock, Sparkles } from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';
import type { SkillBranch } from '../shared/gitaData.ts';

const BRANCH_ORDER: SkillBranch[] = [
  'Reading Consistency',
  'Verse Memory',
  'Sanskrit Vocabulary',
  'Scripture Understanding',
  'Chapter Mastery',
];

export const SkillTreePage: React.FC = () => {
  const { bundle, unlockSkillNode } = useJourney();
  if (!bundle) return null;

  const unlockedCount = bundle.skillTree.filter((s) => s.status === 'unlocked').length;
  const readyCount = bundle.skillTree.filter((s) => s.status === 'ready').length;

  return (
    <div className="space-y-8 gj-enter">
      <div>
        <p className="text-xs text-[var(--gj-text-muted)]">
          5 Study Branches · {unlockedCount} of {bundle.skillTree.length} Unlocked
          {readyCount > 0 ? ` · ${readyCount} Ready` : ''}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--gj-text)] mt-1">
          Skill Tree
        </h1>
        <p className="text-sm text-[var(--gj-text-muted)] mt-1 max-w-2xl">
          Track how your study habits grow across consistency, memory, Sanskrit vocabulary,
          scripture understanding, and chapter completion. These nodes recognize study effort
          only and never represent personal devotion or spiritual standing.
        </p>
      </div>

      {/* Interactive Five-Branch Progression Tree */}
      <div className="space-y-6">
        {BRANCH_ORDER.map((branchName) => {
          const nodes = bundle.skillTree
            .filter((n) => n.branch === branchName)
            .sort((a, b) => a.tier - b.tier);

          return (
            <section
              key={branchName}
              className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-semibold text-[var(--gj-text)] flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[var(--gj-accent)]" aria-hidden="true" />
                  <span>{branchName}</span>
                </h2>
                <span className="font-mono-num text-xs text-[var(--gj-text-muted)]">
                  {nodes.filter((n) => n.status === 'unlocked').length} / {nodes.length} unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch">
                {nodes.map((node, index) => {
                  const pct = Math.min(
                    100,
                    Math.round((node.currentCount / Math.max(1, node.threshold)) * 100)
                  );
                  const isUnlocked = node.status === 'unlocked';
                  const isReady = node.status === 'ready';

                  return (
                    <div key={node.code} className="relative flex items-stretch gap-3">
                      {index > 0 && (
                        <div
                          aria-hidden="true"
                          className="hidden md:flex items-center justify-center -ml-2"
                        >
                          <svg width="16" height="24" viewBox="0 0 16 24">
                            <path
                              d="M0 12 H16 M11 7 L16 12 L11 17"
                              fill="none"
                              stroke={
                                isUnlocked || isReady ? 'var(--gj-accent)' : 'var(--gj-border)'
                              }
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}

                      <div
                        className={`flex-1 rounded-xl border p-4 flex flex-col justify-between gap-3 ${
                          isUnlocked
                            ? 'border-[var(--gj-success)]/50 bg-[var(--gj-success-bg)]/40'
                            : isReady
                              ? 'border-[var(--gj-gold)] bg-[var(--gj-bg)] shadow-sm'
                              : 'border-[var(--gj-border)] bg-[var(--gj-bg)] opacity-85'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="font-mono-num text-[var(--gj-text-muted)]">
                              Tier {node.tier}
                            </span>
                            <span className="font-mono-num font-semibold text-[var(--gj-accent)]">
                              +{node.xpReward} XP
                            </span>
                          </div>

                          <h3 className="font-display text-xl font-semibold text-[var(--gj-text)] leading-snug">
                            {node.title}
                          </h3>
                          <p className="text-xs text-[var(--gj-text-muted)] leading-relaxed">
                            {node.description}
                          </p>
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-[var(--gj-border)]">
                          <div className="flex items-center justify-between text-[11px] text-[var(--gj-text-muted)]">
                            <span>{node.requirementLabel}</span>
                            <span className="font-mono-num">
                              {node.currentCount}/{node.threshold}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--gj-surface-subtle)] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: isUnlocked
                                  ? 'var(--gj-success)'
                                  : 'var(--gj-accent)',
                              }}
                            />
                          </div>

                          {isUnlocked ? (
                            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gj-success)]">
                              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Unlocked</span>
                            </div>
                          ) : isReady ? (
                            <button
                              type="button"
                              onClick={() => void unlockSkillNode(node.code)}
                              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--gj-accent)] px-3 py-2 text-xs font-semibold text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)]"
                            >
                              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Unlock Skill (+{node.xpReward} XP)</span>
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 text-xs text-[var(--gj-text-muted)]">
                              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>
                                {node.prerequisiteCode ? 'Requires prior tier & goal' : 'Keep studying'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
