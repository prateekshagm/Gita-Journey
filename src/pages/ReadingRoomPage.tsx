import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Highlighter,
  Lock,
  MessageSquarePlus,
  Plus,
  Search,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';
import { GITA_CHAPTERS } from '../shared/gitaData.ts';
import {
  getLanguageOption,
  renderShlokaInLanguageScript,
  SUPPORTED_LANGUAGES,
} from '../shared/languages.ts';
import type { ReaderMode } from '../shared/progression.ts';
import { parseReflectionLines } from '../shared/reflectionHelpers.ts';
import type { VerseRecord } from '../types/journey.ts';

type HighlightColor = 'gold' | 'sky' | 'saffron' | 'rose';

const HIGHLIGHT_COLOR_CLASSES: Record<string, string> = {
  gold: 'bg-amber-500/10 border-l-2 border-amber-500/60',
  sky: 'bg-sky-500/10 border-l-2 border-sky-500/60',
  saffron: 'bg-orange-500/10 border-l-2 border-orange-500/60',
  rose: 'bg-rose-500/10 border-l-2 border-rose-500/60',
};

export const ReadingRoomPage: React.FC = () => {
  const {
    bundle,
    readingTarget,
    openReaderAt,
    updatePreferences,
    completeVerse,
    toggleBookmark,
    addHighlight,
    deleteHighlight,
    saveReflection,
    addReflectionPoint,
  } = useJourney();

  const [verses, setVerses] = useState<VerseRecord[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VerseRecord[]>([]);
  const [searching, setSearching] = useState(false);

  const [reflectionDrafts, setReflectionDrafts] = useState<Record<string, string>>({});
  const [purportChecked, setPurportChecked] = useState<Record<string, boolean>>({});
  const [selectedLectureIdx, setSelectedLectureIdx] = useState<Record<string, number>>({});

  const [highlightComposerOpen, setHighlightComposerOpen] = useState<Record<string, boolean>>({});
  const [highlightExcerpts, setHighlightExcerpts] = useState<Record<string, string>>({});
  const [highlightColors, setHighlightColors] = useState<Record<string, HighlightColor>>({});
  const [highlightPoints, setHighlightPoints] = useState<Record<string, string>>({});

  const [pointComposerOpen, setPointComposerOpen] = useState<Record<number, boolean>>({});
  const [pointDrafts, setPointDrafts] = useState<Record<number, string>>({});

  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [submittingCode, setSubmittingCode] = useState<string | null>(null);

  const chapterNumber = readingTarget.chapter || 1;
  const verseStart = readingTarget.verse || 1;
  const chapterSpec = GITA_CHAPTERS.find((c) => c.chapterNumber === chapterNumber) ?? GITA_CHAPTERS[0];

  const language = bundle?.preferences.language || 'en';
  const languageOpt = getLanguageOption(language);
  const versesPerView = bundle?.preferences.versesPerView || 1;
  const readerMode = bundle?.preferences.readerMode || 'light';
  const fontSize = bundle?.preferences.fontSize || 18;

  useEffect(() => {
    let active = true;
    setLoadingVerses(true);
    setLoadError(null);
    fetch(`/api/chapters/${chapterNumber}/verses?language=${encodeURIComponent(language)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load chapter verses');
        return res.json();
      })
      .then((data) => {
        if (active) setVerses(data.verses || []);
      })
      .catch((err) => {
        if (active) setLoadError((err as Error).message);
      })
      .finally(() => {
        if (active) setLoadingVerses(false);
      });
    return () => {
      active = false;
    };
  }, [chapterNumber, language]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/verses/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } finally {
      setSearching(false);
    }
  };

  if (!bundle) return null;

  const completedSet = new Set(bundle.completedVerses);
  const bookmarkSet = new Set(bundle.bookmarks.map((b) => b.verseCode));
  const chapterState = bundle.chapterStates.find((s) => s.chapterNumber === chapterNumber);
  const isChapterLocked = chapterState?.status === 'locked';

  const startIndex = Math.max(0, Math.min(verses.length - 1, verseStart - 1));
  const visibleVerses = verses.slice(startIndex, startIndex + versesPerView);

  const readerSurfaceClass =
    readerMode === 'dark'
      ? 'bg-[#121923] text-[#E6EDF5] border-[#293548]'
      : readerMode === 'sepia'
        ? 'bg-[#F5EBD8] text-[#2F2416] border-[#DFCFAF]'
        : 'bg-[var(--gj-surface)] text-[var(--gj-text)] border-[var(--gj-border)]';

  const readerMutedClass =
    readerMode === 'dark'
      ? 'text-[#9FB0C4]'
      : readerMode === 'sepia'
        ? 'text-[#6A5740]'
        : 'text-[var(--gj-text-muted)]';

  const handleMarkComplete = async (verseCode: string) => {
    setSubmittingCode(verseCode);
    setActionMsg(null);
    try {
      const res = await completeVerse(verseCode, {
        purportRead: Boolean(purportChecked[verseCode]),
        evidenceType: 'manual',
      });
      const notes = [`Marked Bg. ${verseCode} complete`];
      if (res.xpAwarded > 0) notes.push(`+${res.xpAwarded} XP`);
      if (res.unlockedNextChapter) notes.push(`Chapter ${res.unlockedNextChapter} unlocked!`);
      if (res.newlyEarnedAchievements.length > 0) {
        notes.push(`Milestone: ${res.newlyEarnedAchievements.join(', ')}`);
      }
      setActionMsg(notes.join(' · '));
    } catch (err) {
      setActionMsg((err as Error).message);
    } finally {
      setSubmittingCode(null);
    }
  };

  const handleSaveReflection = async (verseCode: string) => {
    const note = (reflectionDrafts[verseCode] || '').trim();
    if (note.length < 2) return;
    await saveReflection(verseCode, note);
    setReflectionDrafts((prev) => ({ ...prev, [verseCode]: '' }));
    setActionMsg(`Saved personal reflection for Bg. ${verseCode}.`);
  };

  const handleHighlightButtonClick = async (v: VerseRecord) => {
    const selectedText = window.getSelection()?.toString().trim() || '';
    if (selectedText.length >= 2) {
      await addHighlight(v.verseCode, selectedText.slice(0, 600), 'gold');
      setActionMsg(`Highlighted selection and automatically saved to Reflections for Bg. ${v.verseCode}.`);
      return;
    }

    setHighlightComposerOpen((prev) => {
      const nextOpen = !prev[v.verseCode];
      if (nextOpen && !highlightExcerpts[v.verseCode]) {
        setHighlightExcerpts((ex) => ({
          ...ex,
          [v.verseCode]: v.topicSummary,
        }));
      }
      return { ...prev, [v.verseCode]: nextOpen };
    });
  };

  const handleSubmitHighlightComposer = async (verseCode: string) => {
    const excerpt = (highlightExcerpts[verseCode] || '').trim();
    if (excerpt.length < 2) return;
    const color = highlightColors[verseCode] || 'gold';
    const point = (highlightPoints[verseCode] || '').trim();
    await addHighlight(verseCode, excerpt.slice(0, 600), color, point || undefined);
    setHighlightComposerOpen((prev) => ({ ...prev, [verseCode]: false }));
    setHighlightPoints((prev) => ({ ...prev, [verseCode]: '' }));
    setActionMsg(`Saved highlight and added it automatically to Reflections for Bg. ${verseCode}.`);
  };

  const handleSavePoint = async (reflectionId: number, verseCode: string) => {
    const draft = (pointDrafts[reflectionId] || '').trim();
    if (draft.length < 2) return;
    await addReflectionPoint(reflectionId, draft);
    setPointDrafts((prev) => ({ ...prev, [reflectionId]: '' }));
    setPointComposerOpen((prev) => ({ ...prev, [reflectionId]: false }));
    setActionMsg(`Added point to reflection for Bg. ${verseCode}.`);
  };

  const goPrev = () => {
    if (verseStart > 1) {
      openReaderAt(chapterNumber, Math.max(1, verseStart - versesPerView));
    } else if (chapterNumber > 1) {
      const prevCh = GITA_CHAPTERS.find((c) => c.chapterNumber === chapterNumber - 1)!;
      openReaderAt(prevCh.chapterNumber, prevCh.verseCount);
    }
  };

  const goNext = () => {
    if (verseStart + versesPerView <= chapterSpec.verseCount) {
      openReaderAt(chapterNumber, verseStart + versesPerView);
    } else if (chapterNumber < 18) {
      openReaderAt(chapterNumber + 1, 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 gj-enter">
      {/* Compact Chapter Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--gj-text-muted)]">
            Reading Sanctuary · Chapter {chapterNumber} of 18 ({chapterSpec.transliterationTitle})
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--gj-text)]">
            {chapterSpec.englishTitle}
          </h1>
        </div>
        <div className="text-right">
          <span className="font-mono-num text-xs text-[var(--gj-text-muted)]">
            {chapterState?.completedCount ?? 0} / {chapterSpec.verseCount} verses completed
          </span>
        </div>
      </div>

      {/* Reader Controls Toolbar */}
      <section
        aria-label="Reading room controls"
        className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="reader-chapter-select" className="text-xs font-medium text-[var(--gj-text-muted)]">
              Chapter
            </label>
            <select
              id="reader-chapter-select"
              value={chapterNumber}
              onChange={(e) => openReaderAt(Number(e.target.value), 1)}
              className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2 text-xs font-medium text-[var(--gj-text)] max-w-[260px]"
            >
              {GITA_CHAPTERS.map((c) => (
                <option key={c.chapterNumber} value={c.chapterNumber}>
                  Ch. {c.chapterNumber}: {c.englishTitle}
                </option>
              ))}
            </select>

            <label htmlFor="reader-verse-select" className="text-xs font-medium text-[var(--gj-text-muted)]">
              Verse
            </label>
            <select
              id="reader-verse-select"
              value={verseStart}
              onChange={(e) => openReaderAt(chapterNumber, Number(e.target.value))}
              className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2 text-xs font-mono-num text-[var(--gj-text)]"
            >
              {Array.from({ length: chapterSpec.verseCount }, (_, i) => i + 1).map((v) => (
                <option key={v} value={v}>
                  {v} {completedSet.has(`${chapterNumber}.${v}`) ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={(e) => void handleSearch(e)} className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gj-text-muted)]" aria-hidden="true" />
              <input
                type="search"
                aria-label="Search verses by number or topic"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search (e.g. 2.13, Arjuna)..."
                className="w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] pl-8 pr-3 py-2 text-xs text-[var(--gj-text)]"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2 text-xs font-medium hover:bg-[var(--gj-surface-subtle)] min-h-[36px]"
            >
              Search
            </button>
          </form>
        </div>

        {/* Display Preferences Row */}
        <div className="pt-3 border-t border-[var(--gj-border)] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Reader color mode" className="inline-flex rounded-lg border border-[var(--gj-border)] p-0.5 bg-[var(--gj-bg)]">
              {(['light', 'sepia', 'dark'] as ReaderMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => void updatePreferences({ readerMode: m })}
                  aria-pressed={readerMode === m}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium ${
                    readerMode === m
                      ? 'bg-[var(--gj-accent)] text-[var(--gj-accent-text)]'
                      : 'text-[var(--gj-text-muted)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="reader-font-size" className="text-[var(--gj-text-muted)]">
                Font {fontSize}px
              </label>
              <input
                id="reader-font-size"
                type="range"
                min={14}
                max={26}
                value={fontSize}
                onChange={(e) => void updatePreferences({ fontSize: Number(e.target.value) })}
                className="w-20 accent-[var(--gj-accent)]"
              />
            </div>

            <label className="flex items-center gap-1.5 text-[var(--gj-text-muted)]">
              <span>Per view:</span>
              <select
                aria-label="Verses per view"
                value={versesPerView}
                onChange={(e) => void updatePreferences({ versesPerView: Number(e.target.value) })}
                className="rounded border border-[var(--gj-border)] bg-[var(--gj-bg)] px-2 py-1 text-[var(--gj-text)]"
              >
                <option value={1}>1 verse</option>
                <option value={3}>3 verses</option>
                <option value={5}>5 verses</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-[var(--gj-text-muted)]">
              <span>Language:</span>
              <select
                aria-label="Edition language"
                value={language}
                onChange={(e) => void updatePreferences({ language: e.target.value })}
                className="rounded border border-[var(--gj-border)] bg-[var(--gj-bg)] px-2 py-1 text-[var(--gj-text)]"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label === l.nativeLabel ? l.label : `${l.label} (${l.nativeLabel})`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(
              [
                ['showSanskrit', 'Sanskrit'],
                ['showTransliteration', 'Transliteration'],
                ['showTranslation', 'Translation'],
                ['showPurport', 'Purport'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-1.5 cursor-pointer text-[var(--gj-text-muted)]">
                <input
                  type="checkbox"
                  checked={bundle.preferences[key]}
                  onChange={(e) => void updatePreferences({ [key]: e.target.checked })}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <section className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--gj-text-muted)]">
              Search Results ({searchResults.length})
            </h2>
            <button
              type="button"
              onClick={() => setSearchResults([])}
              className="text-xs text-[var(--gj-accent)] hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {searchResults.map((r) => (
              <button
                key={r.verseCode}
                type="button"
                onClick={() => {
                  openReaderAt(r.chapterNumber, r.verseNumber);
                  setSearchResults([]);
                }}
                className="text-left rounded-lg border border-[var(--gj-border)] p-2.5 hover:bg-[var(--gj-surface-subtle)]"
              >
                <span className="text-xs font-mono-num font-semibold">Bg. {r.verseCode}</span>
                <span className="text-xs text-[var(--gj-text-muted)] ml-2">{r.speaker}</span>
                <p className="text-xs text-[var(--gj-text-muted)] truncate mt-0.5">{r.topicSummary}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {actionMsg && (
        <div
          role="status"
          className="rounded-xl border border-[var(--gj-accent)]/40 bg-[var(--gj-accent-soft)] px-4 py-3 text-sm text-[var(--gj-text)]"
        >
          {actionMsg}
        </div>
      )}

      {isChapterLocked && (
        <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-warning-bg)] p-4 text-sm text-[var(--gj-warning)] flex items-center gap-3">
          <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            Chapter {chapterNumber} is locked for completion tracking until all verses of Chapter{' '}
            {chapterNumber - 1} are completed. You may still preview its metadata and open Vedabase.
          </span>
        </div>
      )}

      {/* Main Verse Cards */}
      {loadingVerses ? (
        <div className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-12 text-center text-sm text-[var(--gj-text-muted)]">
          Loading Chapter {chapterNumber} verses...
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-[var(--gj-danger)]/30 bg-[var(--gj-danger-bg)] p-6 text-sm text-[var(--gj-danger)]">
          {loadError}
        </div>
      ) : (
        <div className="space-y-6">
          {visibleVerses.map((v) => {
            const isCompleted = completedSet.has(v.verseCode);
            const isBookmarked = bookmarkSet.has(v.verseCode);
            const lc = v.licensedContent;
            const hasLicensedBody = Boolean(
              lc && (lc.licenseStatus === 'licensed_full' || lc.licenseStatus === 'authorized_public_excerpt')
            );
            const devanagariText = (lc && lc.devanagari) || v.shloka?.devanagari || '';
            const translitText = (lc && lc.transliteration) || v.shloka?.transliteration || '';
            const regionalScript = renderShlokaInLanguageScript(devanagariText, language);

            const lectures = v.authorizedLectures && v.authorizedLectures.length > 0 ? v.authorizedLectures : [];
            const activeLectureIdx = Math.min(selectedLectureIdx[v.verseCode] ?? 0, Math.max(0, lectures.length - 1));
            const activeLecture = lectures[activeLectureIdx];
            const activeAudioSrc = activeLecture?.audioUrl || v.audioUrl || null;

            const verseReflections = bundle.reflections.filter((r) => r.verseCode === v.verseCode);
            const verseHighlights = bundle.highlights.filter((h) => h.verseCode === v.verseCode);
            const composerOpen = Boolean(highlightComposerOpen[v.verseCode]);

            return (
              <article
                key={v.verseCode}
                className={`rounded-2xl border p-6 sm:p-8 transition-colors ${readerSurfaceClass}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-current/10">
                  <div>
                    <p className={`text-xs ${readerMutedClass}`}>
                      Chapter {v.chapterNumber} · {chapterSpec.transliterationTitle} · Speaker:{' '}
                      {v.speaker || 'Śrī Kṛṣṇa'}
                    </p>
                    <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-1">
                      Bhagavad-gītā {v.verseCode}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleBookmark(v.verseCode)}
                      aria-pressed={isBookmarked}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-3 py-2 text-xs font-medium hover:bg-current/5 min-h-[38px]"
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`}
                        aria-hidden="true"
                      />
                      <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleHighlightButtonClick(v)}
                      aria-expanded={composerOpen}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-current/20 px-3 py-2 text-xs font-medium hover:bg-current/5 min-h-[38px]"
                    >
                      <Highlighter className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Highlight Note</span>
                    </button>
                  </div>
                </div>

                {/* Inline Highlight Composer (saves highlight & auto-saves to Reflections) */}
                {composerOpen && (
                  <div className="mt-4 rounded-xl border border-current/20 bg-current/[0.03] p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">
                        Highlight Excerpt (Auto-saves to Reflections)
                      </span>
                      {(devanagariText || translitText) && (
                        <button
                          type="button"
                          onClick={() =>
                            setHighlightExcerpts((prev) => ({
                              ...prev,
                              [v.verseCode]: regionalScript?.text || devanagariText || translitText,
                            }))
                          }
                          className="underline opacity-80 hover:opacity-100"
                        >
                          Use Śloka Text
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      aria-label={`Highlight excerpt for Bg. ${v.verseCode}`}
                      value={highlightExcerpts[v.verseCode] || ''}
                      onChange={(e) =>
                        setHighlightExcerpts((prev) => ({ ...prev, [v.verseCode]: e.target.value }))
                      }
                      placeholder="Select text on the verse or enter the line you want to highlight..."
                      className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--gj-accent)]"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={readerMutedClass}>Color:</span>
                      {(['gold', 'sky', 'saffron', 'rose'] as HighlightColor[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setHighlightColors((prev) => ({ ...prev, [v.verseCode]: c }))}
                          aria-pressed={(highlightColors[v.verseCode] || 'gold') === c}
                          className={`px-2.5 py-1 rounded border capitalize ${
                            (highlightColors[v.verseCode] || 'gold') === c
                              ? 'border-[var(--gj-accent)] bg-[var(--gj-accent)] text-[var(--gj-accent-text)] font-medium'
                              : 'border-current/20'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      aria-label={`Optional initial reflection point for Bg. ${v.verseCode}`}
                      value={highlightPoints[v.verseCode] || ''}
                      onChange={(e) =>
                        setHighlightPoints((prev) => ({ ...prev, [v.verseCode]: e.target.value }))
                      }
                      placeholder="Optional bullet point to attach immediately..."
                      className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--gj-accent)]"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSubmitHighlightComposer(v.verseCode)}
                        className="rounded-lg bg-[var(--gj-accent)] px-3.5 py-2 text-xs font-medium text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)]"
                      >
                        Save Highlight to Reflections
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setHighlightComposerOpen((prev) => ({ ...prev, [v.verseCode]: false }))
                        }
                        className="rounded-lg border border-current/20 px-3 py-2 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Scripture Content Layer (Authentic Full Shlokas + Script Conversion + Licensing Attribution) */}
                <div className="mt-6 space-y-5 w-full" style={{ fontSize: `${fontSize}px` }}>
                  {bundle.preferences.showSanskrit && devanagariText && (
                    <div className="space-y-1.5">
                      <span className={`text-[11px] uppercase tracking-wider block ${readerMutedClass}`}>
                        Original Sanskrit Śloka (Devanāgarī)
                      </span>
                      <p className="font-sanskrit leading-loose whitespace-pre-line">{devanagariText}</p>
                    </div>
                  )}

                  {bundle.preferences.showSanskrit && regionalScript && (
                    <div className="space-y-1.5 pt-1">
                      <span className={`text-[11px] uppercase tracking-wider block ${readerMutedClass}`}>
                        {regionalScript.scriptTitle}
                      </span>
                      <p className="leading-loose whitespace-pre-line">{regionalScript.text}</p>
                    </div>
                  )}

                  {bundle.preferences.showTransliteration && translitText && (
                    <div className="space-y-1.5">
                      <span className={`text-[11px] uppercase tracking-wider block ${readerMutedClass}`}>
                        IAST Transliteration
                      </span>
                      <p className="italic leading-relaxed whitespace-pre-line">{translitText}</p>
                    </div>
                  )}

                  {hasLicensedBody && lc ? (
                    <div className="space-y-4 pt-2 border-t border-current/10">
                      <p className={`text-xs ${readerMutedClass}`}>
                        Authorized Text · {lc.edition} ({languageOpt.label}) · {lc.sourceAttribution}
                        {lc.editorialVerified ? ' · Editorially Verified' : ''}
                      </p>
                      {lc.synonyms && (
                        <div className="space-y-1">
                          <span className={`text-[11px] uppercase tracking-wider block ${readerMutedClass}`}>
                            Word-for-Word Synonyms
                          </span>
                          <p className="text-[0.88em] leading-relaxed whitespace-pre-line">{lc.synonyms}</p>
                        </div>
                      )}
                      {bundle.preferences.showTranslation && lc.translation && (
                        <div className="space-y-1">
                          <span className={`text-[11px] uppercase tracking-wider block ${readerMutedClass}`}>
                            Translation
                          </span>
                          <p className="font-medium leading-relaxed whitespace-pre-line">{lc.translation}</p>
                        </div>
                      )}
                      {bundle.preferences.showPurport && lc.purport && (
                        <div className="space-y-1 pt-2 border-t border-current/10">
                          <span className={`text-[11px] uppercase tracking-wider block ${readerMutedClass}`}>
                            Purport
                          </span>
                          <p className="text-[0.9em] leading-relaxed whitespace-pre-line">{lc.purport}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-current/15 bg-current/[0.03] p-5 space-y-4">
                      <div>
                        <p className={`text-xs uppercase tracking-wider ${readerMutedClass}`}>
                          Source-Linked Translation & Purport (
                          {languageOpt.label === languageOpt.nativeLabel
                            ? languageOpt.label
                            : `${languageOpt.label} · ${languageOpt.nativeLabel}`}
                          )
                        </p>
                        <p className="text-sm mt-2 leading-relaxed">
                          To honor Bhaktivedanta Book Trust International copyright until an authorized{' '}
                          {languageOpt.label} book license is imported via Admin Content Pipeline, Śrīla
                          Prabhupāda’s full BBT translation and purport for <strong>Bg. {v.verseCode}</strong>{' '}
                          open directly on the verified Vedabase library page.
                        </p>
                      </div>

                      <div>
                        <p className={`text-xs uppercase tracking-wider ${readerMutedClass}`}>
                          Editorial Index Summary (Non-Scriptural Study Guide)
                        </p>
                        <p className="mt-1.5 leading-relaxed">{v.topicSummary}</p>
                        {v.keySanskritTerms.length > 0 && (
                          <p className={`text-xs mt-2 ${readerMutedClass}`}>
                            Key terms: {v.keySanskritTerms.join(' · ')}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <a
                          href={v.vedabaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-[var(--gj-accent)] px-4 py-2.5 text-xs font-medium text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)] transition-colors min-h-[40px]"
                        >
                          <span>Read Full Translation & Purport on Vedabase.io</span>
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                        <a
                          href={chapterSpec.vedabaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline opacity-80 hover:opacity-100"
                        >
                          Open Chapter {v.chapterNumber} Index ↗
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Verified Śrīla Prabhupāda Lecture Audio (Prabhupadavani Archive) */}
                  <div className="rounded-xl border border-current/15 bg-current/[0.02] p-4 space-y-2.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 font-semibold">
                        <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>
                          Śrīla Prabhupāda Lecture Audio · Prabhupadavani Archive (Bg. {v.verseCode})
                        </span>
                      </span>
                      {lectures.length > 1 && (
                        <span className={readerMutedClass}>
                          {lectures.length} verified recordings
                        </span>
                      )}
                    </div>

                    {activeAudioSrc ? (
                      <>
                        {lectures.length > 1 && (
                          <select
                            aria-label={`Select Śrīla Prabhupāda lecture for Bg. ${v.verseCode}`}
                            value={activeLectureIdx}
                            onChange={(e) =>
                              setSelectedLectureIdx((prev) => ({
                                ...prev,
                                [v.verseCode]: Number(e.target.value),
                              }))
                            }
                            className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-1.5 text-xs"
                          >
                            {lectures.map((lec, idx) => {
                              const hasLoc =
                                lec.location &&
                                !lec.title.toLowerCase().includes(lec.location.toLowerCase());
                              return (
                                <option key={`${lec.id}-${idx}`} value={idx} className="text-black">
                                  {lec.title}
                                  {hasLoc ? ` · ${lec.location}` : ''}
                                  {lec.dateIso ? ` (${lec.dateIso})` : ''}
                                </option>
                              );
                            })}
                          </select>
                        )}

                        {activeLecture && (
                          <p className={readerMutedClass}>
                            {activeLecture.title}
                            {activeLecture.location &&
                            !activeLecture.title.toLowerCase().includes(activeLecture.location.toLowerCase())
                              ? ` · ${activeLecture.location}`
                              : ''}
                            {activeLecture.dateIso ? ` · ${activeLecture.dateIso}` : ''}
                          </p>
                        )}

                        <audio
                          key={activeAudioSrc}
                          controls
                          preload="none"
                          src={activeAudioSrc}
                          className="w-full h-9"
                        />

                        <div className="flex flex-wrap items-center gap-4 pt-0.5">
                          {activeLecture?.transcriptUrl && (
                            <a
                              href={activeLecture.transcriptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 underline opacity-85 hover:opacity-100"
                            >
                              <span>Read Lecture Transcript</span>
                              <ExternalLink className="w-3 h-3" aria-hidden="true" />
                            </a>
                          )}
                          <a
                            href="https://prabhupadavani.org/transcriptions/type/bhagavad-gita/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 underline opacity-85 hover:opacity-100"
                          >
                            <span>Prabhupadavani BG Archive</span>
                            <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className={`flex flex-wrap items-center justify-between gap-2 ${readerMutedClass}`}>
                        <span>
                          No verse-specific Śrīla Prabhupāda BG lecture recording is archived for Bg.{' '}
                          {v.verseCode}.
                        </span>
                        <a
                          href="https://prabhupadavani.org/transcriptions/type/bhagavad-gita/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 underline opacity-85 hover:opacity-100"
                        >
                          <span>Prabhupadavani BG Archive</span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Completion Action & Optional Purport Checkbox */}
                <div className="mt-6 pt-5 border-t border-current/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label className={`inline-flex items-center gap-2 text-xs cursor-pointer ${readerMutedClass}`}>
                    <input
                      type="checkbox"
                      checked={Boolean(purportChecked[v.verseCode])}
                      onChange={(e) =>
                        setPurportChecked((p) => ({ ...p, [v.verseCode]: e.target.checked }))
                      }
                    />
                    <span>I also read the purport (+5 XP)</span>
                  </label>

                  <button
                    type="button"
                    disabled={isChapterLocked || submittingCode === v.verseCode}
                    onClick={() => void handleMarkComplete(v.verseCode)}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-xs font-medium transition-colors min-h-[42px] ${
                      isCompleted
                        ? 'bg-[var(--gj-success-bg)] text-[var(--gj-success)] border border-[var(--gj-success)]/30'
                        : 'bg-[var(--gj-accent)] text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)] disabled:opacity-50'
                    }`}
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {submittingCode === v.verseCode
                        ? 'Saving...'
                        : isCompleted
                          ? `Completed (Bg. ${v.verseCode})`
                          : `Mark Verse ${v.verseCode} Complete`}
                    </span>
                  </button>
                </div>

                {/* Personal Highlights & Reflections */}
                <div className="mt-6 pt-5 border-t border-current/10 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider opacity-75">
                    Personal Reflection & Highlights
                  </h3>

                  {verseHighlights.map((h) => (
                    <div
                      key={h.id}
                      className={`flex items-center justify-between gap-2 text-xs italic px-3 py-2 rounded ${
                        HIGHLIGHT_COLOR_CLASSES[h.color] || HIGHLIGHT_COLOR_CLASSES.gold
                      }`}
                    >
                      <span>Highlight: “{h.excerpt}”</span>
                      <button
                        type="button"
                        aria-label={`Remove highlight for Bg. ${v.verseCode}`}
                        onClick={() => void deleteHighlight(h.id)}
                        className="p-1 opacity-70 hover:opacity-100 not-italic shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}

                  {verseReflections.map((r) => {
                    const parsed = parseReflectionLines(r.note);
                    const isPointOpen = Boolean(pointComposerOpen[r.id]);
                    return (
                      <div key={r.id} className="text-xs rounded-lg border border-current/15 p-3 space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-1 flex-1 min-w-[200px]">
                            {parsed.isHighlight && (
                              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10">
                                Highlighted Note
                              </span>
                            )}
                            <p className="leading-relaxed">{parsed.mainText}</p>
                            {parsed.points.length > 0 && (
                              <ul className="mt-1.5 list-disc pl-5 space-y-1">
                                {parsed.points.map((pt, idx) => (
                                  <li key={idx}>{pt}</li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setPointComposerOpen((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                            }
                            aria-expanded={isPointOpen}
                            className="inline-flex items-center gap-1 rounded border border-current/20 px-2.5 py-1 text-[11px] font-medium hover:bg-current/5 shrink-0"
                          >
                            <Plus className="w-3 h-3" aria-hidden="true" />
                            <span>Add Point</span>
                          </button>
                        </div>

                        {isPointOpen && (
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <input
                              type="text"
                              aria-label={`Add bullet point to reflection ${r.id}`}
                              value={pointDrafts[r.id] || ''}
                              onChange={(e) =>
                                setPointDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))
                              }
                              placeholder="Add a key point or realization..."
                              className="flex-1 rounded-lg border border-current/20 bg-transparent px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--gj-accent)]"
                            />
                            <button
                              type="button"
                              onClick={() => void handleSavePoint(r.id, v.verseCode)}
                              className="rounded-lg bg-[var(--gj-accent)] px-3 py-1.5 text-xs font-medium text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)]"
                            >
                              Save Point
                            </button>
                          </div>
                        )}

                        <span className={`block text-[11px] ${readerMutedClass}`}>
                          Saved {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      aria-label={`Add personal reflection for Bg. ${v.verseCode}`}
                      value={reflectionDrafts[v.verseCode] || ''}
                      onChange={(e) =>
                        setReflectionDrafts((d) => ({ ...d, [v.verseCode]: e.target.value }))
                      }
                      placeholder="Write a personal reflection or takeaway from this verse..."
                      className="flex-1 rounded-lg border border-current/20 bg-transparent px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--gj-accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveReflection(v.verseCode)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-current/25 px-3.5 py-2 text-xs font-medium hover:bg-current/5 min-h-[38px]"
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Save Reflection</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Prev / Next Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={chapterNumber === 1 && verseStart === 1}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--gj-border)] bg-[var(--gj-surface)] px-4 py-2.5 text-xs font-medium hover:bg-[var(--gj-surface-subtle)] disabled:opacity-40 min-h-[42px]"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <span>Previous</span>
        </button>

        <span className="text-xs font-mono-num text-[var(--gj-text-muted)]">
          Ch. {chapterNumber} · Showing {verseStart}–{Math.min(chapterSpec.verseCount, verseStart + versesPerView - 1)} of {chapterSpec.verseCount}
        </span>

        <button
          type="button"
          onClick={goNext}
          disabled={chapterNumber === 18 && verseStart + versesPerView > chapterSpec.verseCount}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--gj-border)] bg-[var(--gj-surface)] px-4 py-2.5 text-xs font-medium hover:bg-[var(--gj-surface-subtle)] disabled:opacity-40 min-h-[42px]"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
