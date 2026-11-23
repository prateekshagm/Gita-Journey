import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Languages,
  ListOrdered,
  RefreshCw,
  Swords,
  XCircle,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';
import {
  GITA_CHAPTERS,
  SANSKRIT_MATCH_SETS,
  VERSE_ORDER_CHALLENGES,
} from '../shared/gitaData.ts';
import type { QuizQuestion } from '../types/journey.ts';

function shuffleDeterministic<T>(items: T[], salt: string): T[] {
  const arr = [...items];
  let seed = 0;
  for (let i = 0; i < salt.length; i++) seed = (seed * 31 + salt.charCodeAt(i)) % 9973;
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 17 + 13) % 9973;
    const j = seed % (i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export const PlayLearnPage: React.FC = () => {
  const {
    bundle,
    submitQuizAttempt,
    openReaderAt,
    challengeFilterChapter,
    setChallengeFilterChapter,
    completeInteractiveChallenge,
  } = useJourney();

  const [activeArena, setActiveArena] = useState<'quizzes' | 'sanskrit_match' | 'verse_order'>(
    'quizzes'
  );
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [chapterFilter, setChapterFilter] = useState<string>(
    challengeFilterChapter ? String(challengeFilterChapter) : 'all'
  );
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<
    Record<
      number,
      {
        isCorrect: boolean;
        correctIndex: number;
        explanation: string;
        sourceReference: string;
        xpAwarded: number;
      }
    >
  >({});

  // Sanskrit Match State
  const [activeMatchId, setActiveMatchId] = useState<string>(SANSKRIT_MATCH_SETS[0].id);
  const [pickedTerm, setPickedTerm] = useState<string | null>(null);
  const [matchedTerms, setMatchedTerms] = useState<string[]>([]);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchSuccessMsg, setMatchSuccessMsg] = useState<string | null>(null);

  // Verse Ordering State
  const [activeOrderId, setActiveOrderId] = useState<string>(VERSE_ORDER_CHALLENGES[0].id);
  const [pickedOrderTokens, setPickedOrderTokens] = useState<string[]>([]);
  const [orderFeedback, setOrderFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (challengeFilterChapter) {
      setChapterFilter(String(challengeFilterChapter));
      setActiveArena('quizzes');
      setChallengeFilterChapter(null);
    }
  }, [challengeFilterChapter, setChallengeFilterChapter]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (modeFilter !== 'all') params.set('mode', modeFilter);
    if (chapterFilter !== 'all') params.set('chapter', chapterFilter);
    fetch(`/api/quizzes?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setQuizzes(d.quizzes || []))
      .finally(() => setLoading(false));
  }, [modeFilter, chapterFilter]);

  const activeMatchSet =
    SANSKRIT_MATCH_SETS.find((s) => s.id === activeMatchId) ?? SANSKRIT_MATCH_SETS[0];
  const shuffledMeanings = useMemo(
    () =>
      shuffleDeterministic(
        activeMatchSet.pairs.map((p) => ({ term: p.term, meaning: p.meaning })),
        activeMatchSet.id
      ),
    [activeMatchSet]
  );

  const activeOrderSet =
    VERSE_ORDER_CHALLENGES.find((s) => s.id === activeOrderId) ?? VERSE_ORDER_CHALLENGES[0];
  const scrambledOrderTokens = useMemo(
    () => shuffleDeterministic(activeOrderSet.orderedTokens, activeOrderSet.id),
    [activeOrderSet]
  );

  if (!bundle) return null;

  const handleAnswer = async (quizId: number, idx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [quizId]: idx }));
    const res = await submitQuizAttempt(quizId, idx);
    setFeedback((prev) => ({ ...prev, [quizId]: res }));
  };

  const retryQuestion = (quizId: number) => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[quizId];
      return copy;
    });
    setFeedback((prev) => {
      const copy = { ...prev };
      delete copy[quizId];
      return copy;
    });
  };

  const handleSelectMeaning = async (meaningTerm: string) => {
    if (!pickedTerm) {
      setMatchError('Select a Sanskrit term on the left first.');
      return;
    }
    if (pickedTerm === meaningTerm) {
      const nextMatched = [...matchedTerms, pickedTerm];
      setMatchedTerms(nextMatched);
      setPickedTerm(null);
      setMatchError(null);
      if (nextMatched.length === activeMatchSet.pairs.length) {
        const res = await completeInteractiveChallenge(
          'sanskrit_match',
          activeMatchSet.id,
          activeMatchSet.chapterNumber
        );
        setMatchSuccessMsg(
          res.xpAwarded > 0
            ? `All pairs matched! Earned +${res.xpAwarded} XP.`
            : 'All pairs matched! (XP already claimed for this set.)'
        );
      }
    } else {
      setMatchError('Those do not match yet — try another pairing.');
    }
  };

  const handleSelectOrderToken = async (token: string) => {
    if (pickedOrderTokens.includes(token)) return;
    const next = [...pickedOrderTokens, token];
    setPickedOrderTokens(next);
    setOrderFeedback(null);

    if (next.length === activeOrderSet.orderedTokens.length) {
      const isExact = next.every((val, i) => val === activeOrderSet.orderedTokens[i]);
      if (isExact) {
        const res = await completeInteractiveChallenge(
          'verse_order',
          activeOrderSet.id,
          activeOrderSet.chapterNumber
        );
        setOrderFeedback({
          ok: true,
          message: `${activeOrderSet.explanation}${res.xpAwarded > 0 ? ` (+${res.xpAwarded} XP)` : ''}`,
        });
      } else {
        setOrderFeedback({
          ok: false,
          message: 'Not quite the exact sequence — reset and try placing the opening phrase first.',
        });
      }
    }
  };

  // Spaced repetition due items
  const now = Date.now();
  const dueQuizIds = new Set(
    bundle.quizAttempts
      .filter((a) => new Date(a.nextReviewAt).getTime() <= now)
      .map((a) => a.quizId)
  );

  const solvedQuizIds = new Set(
    bundle.quizAttempts.filter((a) => a.isCorrect).map((a) => a.quizId)
  );
  const completedChallengeSet = new Set(bundle.completedChallenges || []);

  const modeLabels: Record<string, string> = {
    comprehension: 'Comprehension',
    vocabulary: 'Sanskrit Vocabulary',
    missing_word: 'Missing Word',
    transliteration_order: 'Word Order',
    chapter_recap: 'Chapter Recap',
    scenario: 'Teaching Scenario',
    chapter_battle: 'Chapter Knowledge Battle',
  };

  return (
    <div className="space-y-8 gj-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--gj-text-muted)]">
            7 Interactive Challenge Modes · Source-Verified Explanations
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
            Play & Learn Arena
          </h1>
          <p className="text-sm text-[var(--gj-text-muted)] mt-1 max-w-2xl">
            Practice Sanskrit word matching, verse sequencing, scenario reflection, and Chapter
            Knowledge Battles. Challenges reward XP and skill progress—never blocking scripture.
          </p>
        </div>

        {/* Top Arena Switcher */}
        <div
          role="tablist"
          aria-label="Challenge arena mode"
          className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 rounded-xl bg-[var(--gj-surface-subtle)] border border-[var(--gj-border)] self-start shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeArena === 'quizzes'}
            onClick={() => setActiveArena('quizzes')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeArena === 'quizzes'
                ? 'bg-[var(--gj-surface)] text-[var(--gj-text)] shadow-sm'
                : 'text-[var(--gj-text-muted)]'
            }`}
          >
            <Swords className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Quizzes & Battles</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeArena === 'sanskrit_match'}
            onClick={() => setActiveArena('sanskrit_match')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeArena === 'sanskrit_match'
                ? 'bg-[var(--gj-surface)] text-[var(--gj-text)] shadow-sm'
                : 'text-[var(--gj-text-muted)]'
            }`}
          >
            <Languages className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sanskrit Match</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeArena === 'verse_order'}
            onClick={() => setActiveArena('verse_order')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeArena === 'verse_order'
                ? 'bg-[var(--gj-surface)] text-[var(--gj-text)] shadow-sm'
                : 'text-[var(--gj-text-muted)]'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Verse Ordering</span>
          </button>
        </div>
      </div>

      {/* Bookmarked Verse Revision Strip */}
      <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[var(--gj-accent)]" aria-hidden="true" />
            <span>Bookmarked Verse Revision</span>
          </h2>
          <span className="text-xs text-[var(--gj-text-muted)] font-mono-num">
            {bundle.bookmarks.length} saved
          </span>
        </div>
        {bundle.bookmarks.length === 0 ? (
          <p className="text-xs text-[var(--gj-text-muted)] mt-2">
            Bookmark any verse in the Reading Room to revisit and revise it here.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {bundle.bookmarks.map((bm) => {
              const [ch, v] = bm.verseCode.split('.').map(Number);
              return (
                <button
                  key={bm.verseCode}
                  type="button"
                  onClick={() => openReaderAt(ch, v)}
                  className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-1.5 text-xs font-mono-num hover:border-[var(--gj-accent)]"
                >
                  Revise Bg. {bm.verseCode}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {activeArena === 'sanskrit_match' && (
        <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--gj-text-muted)]">
                Interactive Vocabulary Board · +20 XP per completed set
              </p>
              <h2 className="font-display text-2xl font-semibold mt-0.5">
                {activeMatchSet.title}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {SANSKRIT_MATCH_SETS.map((s) => {
                const done = completedChallengeSet.has(`sanskrit_match:${s.id}`);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveMatchId(s.id);
                      setPickedTerm(null);
                      setMatchedTerms([]);
                      setMatchError(null);
                      setMatchSuccessMsg(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                      activeMatchId === s.id
                        ? 'border-[var(--gj-accent)] bg-[var(--gj-accent-soft)] text-[var(--gj-text)]'
                        : 'border-[var(--gj-border)] text-[var(--gj-text-muted)]'
                    }`}
                  >
                    Ch. {s.chapterNumber} {done ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-[var(--gj-text-muted)]">
            Step 1: Click a Sanskrit word on the left. Step 2: Click its matching translation on the right.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-[var(--gj-text-muted)]">Sanskrit Terms</p>
              {activeMatchSet.pairs.map((p) => {
                const isMatched = matchedTerms.includes(p.term);
                const isPicked = pickedTerm === p.term;
                return (
                  <button
                    key={p.term}
                    type="button"
                    disabled={isMatched}
                    onClick={() => {
                      setPickedTerm(p.term);
                      setMatchError(null);
                    }}
                    className={`w-full text-left rounded-xl border px-4 py-3 text-sm font-medium transition-colors min-h-[46px] ${
                      isMatched
                        ? 'border-[var(--gj-success)] bg-[var(--gj-success-bg)] text-[var(--gj-success)]'
                        : isPicked
                          ? 'border-[var(--gj-accent)] bg-[var(--gj-accent-soft)] text-[var(--gj-text)]'
                          : 'border-[var(--gj-border)] bg-[var(--gj-bg)] hover:border-[var(--gj-accent)]'
                    }`}
                  >
                    {p.term} {isMatched ? '✓' : ''}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-[var(--gj-text-muted)]">Verified Meanings</p>
              {shuffledMeanings.map((item) => {
                const isMatched = matchedTerms.includes(item.term);
                return (
                  <button
                    key={item.term}
                    type="button"
                    disabled={isMatched}
                    onClick={() => void handleSelectMeaning(item.term)}
                    className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors min-h-[46px] ${
                      isMatched
                        ? 'border-[var(--gj-success)] bg-[var(--gj-success-bg)] text-[var(--gj-success)]'
                        : 'border-[var(--gj-border)] bg-[var(--gj-bg)] hover:border-[var(--gj-accent)]'
                    }`}
                  >
                    {item.meaning}
                  </button>
                );
              })}
            </div>
          </div>

          {matchError && (
            <p className="text-xs text-[var(--gj-danger)]" role="status">
              {matchError}
            </p>
          )}
          {matchSuccessMsg && (
            <div className="rounded-xl border border-[var(--gj-success)]/40 bg-[var(--gj-success-bg)] p-4 text-xs text-[var(--gj-success)] flex items-center justify-between gap-3">
              <span>{matchSuccessMsg}</span>
              <span className="text-[var(--gj-text-muted)]">{activeMatchSet.sourceReference}</span>
            </div>
          )}
        </section>
      )}

      {activeArena === 'verse_order' && (
        <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--gj-text-muted)]">
                Interactive Transliteration Ordering · +20 XP per verse sequence
              </p>
              <h2 className="font-display text-2xl font-semibold mt-0.5">
                {activeOrderSet.title}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {VERSE_ORDER_CHALLENGES.map((c) => {
                const done = completedChallengeSet.has(`verse_order:${c.id}`);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveOrderId(c.id);
                      setPickedOrderTokens([]);
                      setOrderFeedback(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                      activeOrderId === c.id
                        ? 'border-[var(--gj-accent)] bg-[var(--gj-accent-soft)] text-[var(--gj-text)]'
                        : 'border-[var(--gj-border)] text-[var(--gj-text-muted)]'
                    }`}
                  >
                    Bg. {c.verseCode} {done ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assembled Tray */}
          <div className="rounded-xl border border-dashed border-[var(--gj-border)] bg-[var(--gj-bg)] p-4 min-h-[68px] flex flex-wrap items-center gap-2">
            {pickedOrderTokens.length === 0 ? (
              <span className="text-xs text-[var(--gj-text-muted)]">
                Tap the Sanskrit phrases below in their exact opening order...
              </span>
            ) : (
              pickedOrderTokens.map((tok, i) => (
                <span
                  key={tok}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--gj-accent)] px-3 py-1.5 text-xs font-medium text-[var(--gj-accent-text)]"
                >
                  <span className="font-mono-num opacity-75">{i + 1}.</span>
                  <span>{tok}</span>
                </span>
              ))
            )}
          </div>

          {/* Scrambled Options */}
          <div className="flex flex-wrap gap-2.5">
            {scrambledOrderTokens.map((tok) => {
              const used = pickedOrderTokens.includes(tok);
              return (
                <button
                  key={tok}
                  type="button"
                  disabled={used}
                  onClick={() => void handleSelectOrderToken(tok)}
                  className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] px-4 py-2.5 text-sm font-medium hover:border-[var(--gj-accent)] disabled:opacity-35 min-h-[42px]"
                >
                  {tok}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setPickedOrderTokens([]);
                setOrderFeedback(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--gj-border)] px-3.5 py-2.5 text-xs text-[var(--gj-text-muted)] hover:text-[var(--gj-text)]"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>

          {orderFeedback && (
            <div
              role="status"
              className={`rounded-xl border p-4 text-xs space-y-1 ${
                orderFeedback.ok
                  ? 'border-[var(--gj-success)]/40 bg-[var(--gj-success-bg)] text-[var(--gj-success)]'
                  : 'border-[var(--gj-danger)]/40 bg-[var(--gj-danger-bg)] text-[var(--gj-danger)]'
              }`}
            >
              <p className="font-medium">{orderFeedback.message}</p>
              <p className="text-[var(--gj-text-muted)]">{activeOrderSet.sourceReference}</p>
            </div>
          )}
        </section>
      )}

      {activeArena === 'quizzes' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-4">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[var(--gj-surface-subtle)] border border-[var(--gj-border)]">
              {[
                ['all', 'All Modes'],
                ['comprehension', 'Wisdom Quizzes'],
                ['chapter_battle', 'Chapter Battles'],
                ['scenario', 'Teaching Scenarios'],
                ['vocabulary', 'Sanskrit Terms'],
                ['missing_word', 'Missing Word'],
                ['transliteration_order', 'Word Order'],
                ['chapter_recap', 'Chapter Recap'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setModeFilter(id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    modeFilter === id
                      ? 'bg-[var(--gj-surface)] text-[var(--gj-text)] shadow-sm'
                      : 'text-[var(--gj-text-muted)] hover:text-[var(--gj-text)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="quiz-chapter-filter" className="text-[var(--gj-text-muted)]">
                Chapter:
              </label>
              <select
                id="quiz-chapter-filter"
                value={chapterFilter}
                onChange={(e) => setChapterFilter(e.target.value)}
                className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-1.5"
              >
                <option value="all">All Chapters</option>
                {GITA_CHAPTERS.map((c) => (
                  <option key={c.chapterNumber} value={c.chapterNumber}>
                    Chapter {c.chapterNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Battle Mastery Indicator when filtered */}
          {quizzes.length > 0 && (
            <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-surface)] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
              <span className="font-medium text-[var(--gj-text)]">
                Challenge Set Mastery:{' '}
                <strong className="font-mono-num">
                  {quizzes.filter((q) => solvedQuizIds.has(q.id)).length} / {quizzes.length}
                </strong>{' '}
                solved accurately
              </span>
              <div className="w-48 h-2 rounded-full bg-[var(--gj-surface-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--gj-accent)] transition-all"
                  style={{
                    width: `${Math.round(
                      (quizzes.filter((q) => solvedQuizIds.has(q.id)).length / quizzes.length) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Quiz Cards */}
          {loading ? (
            <p className="text-sm text-[var(--gj-text-muted)]">Loading verified study questions...</p>
          ) : quizzes.length === 0 ? (
            <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-8 text-center space-y-2 text-sm text-[var(--gj-text-muted)]">
              <p>No challenges match this chapter and mode filter yet.</p>
              <button
                type="button"
                onClick={() => {
                  setModeFilter('all');
                  setChapterFilter('all');
                }}
                className="text-xs font-medium text-[var(--gj-accent)] hover:underline"
              >
                Reset filters to view all challenges
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {quizzes.map((q) => {
                const fb = feedback[q.id];
                const chosen = selectedAnswers[q.id];
                const dueForReview = dueQuizIds.has(q.id);
                const isBattle = q.mode === 'chapter_battle';
                return (
                  <article
                    key={q.id}
                    className={`rounded-2xl border p-6 space-y-4 ${
                      isBattle
                        ? 'border-[var(--gj-gold)]/60 bg-[var(--gj-surface)]'
                        : 'border-[var(--gj-border)] bg-[var(--gj-surface)]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--gj-text-muted)]">
                      <span>
                        Chapter {q.chapterNumber} · {modeLabels[q.mode] || 'Chapter Recap'} ·{' '}
                        {bundle.quizAttempts.some((a) => a.quizId === q.id)
                          ? dueForReview
                            ? 'Due for Spaced Review'
                            : 'Reviewed'
                          : 'New Challenge'}
                      </span>
                      <span className="font-mono-num">Challenge #{q.id}</span>
                    </div>

                    <h3 className="font-display text-xl font-semibold text-[var(--gj-text)]">
                      {q.prompt}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, idx) => {
                        const isSelected = chosen === idx;
                        const showCorrect = fb && fb.correctIndex === idx;
                        const showWrong = fb && isSelected && !fb.isCorrect;

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={Boolean(fb)}
                            onClick={() => void handleAnswer(q.id, idx)}
                            className={`text-left rounded-xl border p-3.5 text-sm transition-colors min-h-[44px] flex items-center justify-between gap-2 ${
                              showCorrect
                                ? 'border-[var(--gj-success)] bg-[var(--gj-success-bg)] text-[var(--gj-success)]'
                                : showWrong
                                  ? 'border-[var(--gj-danger)] bg-[var(--gj-danger-bg)] text-[var(--gj-danger)]'
                                  : isSelected
                                    ? 'border-[var(--gj-accent)] bg-[var(--gj-accent-soft)]'
                                    : 'border-[var(--gj-border)] bg-[var(--gj-bg)] hover:border-[var(--gj-accent)]'
                            }`}
                          >
                            <span>{opt}</span>
                            {showCorrect && (
                              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                            )}
                            {showWrong && <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />}
                          </button>
                        );
                      })}
                    </div>

                    {fb && (
                      <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <strong
                            className={
                              fb.isCorrect ? 'text-[var(--gj-success)]' : 'text-[var(--gj-danger)]'
                            }
                          >
                            {fb.isCorrect
                              ? `Accurate!${fb.xpAwarded > 0 ? ` (+${fb.xpAwarded} XP)` : ''}`
                              : 'Not quite — review the source below'}
                          </strong>
                          <button
                            type="button"
                            onClick={() => retryQuestion(q.id)}
                            className="inline-flex items-center gap-1 text-[var(--gj-accent)] hover:underline"
                          >
                            <RefreshCw className="w-3 h-3" aria-hidden="true" />
                            <span>Try again</span>
                          </button>
                        </div>
                        <p className="text-[var(--gj-text)] leading-relaxed">{fb.explanation}</p>
                        <p className="text-[var(--gj-text-muted)] flex items-center gap-1">
                          <span>Source: {fb.sourceReference}</span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
