import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Compass,
  List,
  Lock,
  PlayCircle,
  Swords,
  X,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';
import { GITA_CHAPTERS, ChapterSpec } from '../shared/gitaData.ts';

interface MapCoord {
  x: number; // 0..1000 SVG viewBox X
  y: number; // 0..640 SVG viewBox Y
}

// Serpentine world path across 3 regions (1000 x 670 canvas)
const CHAPTER_COORDS: Record<number, MapCoord> = {
  // Region I: Karma-yoga (Top winding path inside y=20..210)
  1: { x: 95, y: 118 },
  2: { x: 245, y: 98 },
  3: { x: 395, y: 132 },
  4: { x: 545, y: 100 },
  5: { x: 700, y: 130 },
  6: { x: 865, y: 102 },
  // Region II: Bhakti-yoga (Right-to-left middle terrace inside y=232..422)
  7: { x: 875, y: 312 },
  8: { x: 725, y: 344 },
  9: { x: 575, y: 310 },
  10: { x: 425, y: 346 },
  11: { x: 270, y: 310 },
  12: { x: 115, y: 344 },
  // Region III: Jñāna-yoga & Synthesis (Left-to-right summit ridge inside y=444..650)
  13: { x: 120, y: 526 },
  14: { x: 275, y: 556 },
  15: { x: 430, y: 522 },
  16: { x: 585, y: 556 },
  17: { x: 740, y: 522 },
  18: { x: 890, y: 540 },
};

export const AdventureMapPage: React.FC = () => {
  const { bundle, openReaderAt, openChapterChallenge } = useJourney();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedChapter, setSelectedChapter] = useState<ChapterSpec | null>(null);
  const [hoveredChapter, setHoveredChapter] = useState<number | null>(null);

  if (!bundle) return null;

  const completedSet = new Set(bundle.completedVerses);

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return 'Completed';
    if (status === 'in_progress') return 'In Progress';
    if (status === 'available') return 'Available';
    return 'Locked';
  };

  // Build smooth SVG polyline connecting Ch. 1 -> Ch. 18
  const pathPoints = GITA_CHAPTERS.map((ch) => {
    const pt = CHAPTER_COORDS[ch.chapterNumber];
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const activeHoverSpec = hoveredChapter
    ? GITA_CHAPTERS.find((c) => c.chapterNumber === hoveredChapter)
    : GITA_CHAPTERS.find((c) => {
        const st = bundle.chapterStates.find((s) => s.chapterNumber === c.chapterNumber);
        return st?.status === 'in_progress' || st?.status === 'available';
      }) ?? GITA_CHAPTERS[0];
  const activeHoverState = activeHoverSpec
    ? bundle.chapterStates.find((s) => s.chapterNumber === activeHoverSpec.chapterNumber)
    : null;

  return (
    <div className="space-y-6 gj-enter">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--gj-text-muted)]">
            18 Destinations · 3 Yogic Regions · Sequential Scripture Path
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--gj-text)] mt-1">
            Adventure World Map
          </h1>
          <p className="text-sm text-[var(--gj-text-muted)] mt-1 max-w-2xl">
            Travel from Kurukṣetra through Karma, Bhakti, and Jñāna regions. Complete all verses in
            your current destination to unlock the next chapter.
          </p>
        </div>

        <div
          role="group"
          aria-label="Map display mode"
          className="inline-flex items-center gap-1 p-1 rounded-lg bg-[var(--gj-surface-subtle)] border border-[var(--gj-border)] self-start shrink-0"
        >
          <button
            type="button"
            onClick={() => setViewMode('map')}
            aria-pressed={viewMode === 'map'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap min-h-[36px] ${
              viewMode === 'map'
                ? 'bg-[var(--gj-surface)] text-[var(--gj-text)] shadow-sm'
                : 'text-[var(--gj-text-muted)]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            <span>World Map</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap min-h-[36px] ${
              viewMode === 'list'
                ? 'bg-[var(--gj-surface)] text-[var(--gj-text)] shadow-sm'
                : 'text-[var(--gj-text-muted)]'
            }`}
          >
            <List className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Accessible List</span>
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] overflow-hidden">
          {/* Interactive Info Strip Above Map */}
          {activeHoverSpec && activeHoverState && (
            <div className="px-5 py-3.5 border-b border-[var(--gj-border)] bg-[var(--gj-bg)] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono-num font-semibold text-[var(--gj-accent)]">
                  Chapter {activeHoverSpec.chapterNumber}
                </span>
                <span className="font-medium text-[var(--gj-text)]">
                  {activeHoverSpec.englishTitle}
                </span>
                <span className="text-[var(--gj-text-muted)] hidden sm:inline">
                  ({activeHoverSpec.transliterationTitle})
                </span>
              </div>
              <div className="flex items-center gap-4 text-[var(--gj-text-muted)]">
                <span className="font-mono-num">
                  {activeHoverState.completedCount} / {activeHoverState.verseCount} verses (
                  {activeHoverState.progressPercent}%)
                </span>
                <span className="font-medium text-[var(--gj-text)]">
                  {getStatusLabel(activeHoverState.status)}
                </span>
              </div>
            </div>
          )}

          {/* Custom SVG 18-Chapter World Canvas */}
          <div className="p-4 sm:p-6 overflow-x-auto">
            <div className="min-w-[680px]">
              <svg
                viewBox="0 0 1000 670"
                className="w-full h-auto select-none"
                role="img"
                aria-label="Interactive Bhagavad-gītā 18-chapter adventure world map"
              >
                {/* Three Region Subtle Terrain Bands */}
                <rect
                  x="20"
                  y="20"
                  width="960"
                  height="190"
                  rx="16"
                  fill="var(--gj-bg)"
                  stroke="var(--gj-border)"
                  strokeWidth="1"
                />
                <rect
                  x="20"
                  y="232"
                  width="960"
                  height="190"
                  rx="16"
                  fill="var(--gj-surface-subtle)"
                  stroke="var(--gj-border)"
                  strokeWidth="1"
                />
                <rect
                  x="20"
                  y="444"
                  width="960"
                  height="206"
                  rx="16"
                  fill="var(--gj-bg)"
                  stroke="var(--gj-border)"
                  strokeWidth="1"
                />

                {/* Base Connecting Trail */}
                <polyline
                  points={pathPoints}
                  fill="none"
                  stroke="var(--gj-border)"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Highlight Completed Segments */}
                {GITA_CHAPTERS.slice(0, -1).map((ch) => {
                  const st = bundle.chapterStates.find((s) => s.chapterNumber === ch.chapterNumber)!;
                  if (st.status !== 'completed') return null;
                  const a = CHAPTER_COORDS[ch.chapterNumber];
                  const b = CHAPTER_COORDS[ch.chapterNumber + 1];
                  return (
                    <line
                      key={`seg-${ch.chapterNumber}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="var(--gj-gold)"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Region Header Plates (drawn over connector trail so text never collides) */}
                <g>
                  <rect x="34" y="30" width="250" height="24" rx="6" fill="var(--gj-bg)" />
                  <text
                    x="42"
                    y="46"
                    fill="var(--gj-text-muted)"
                    fontSize="12"
                    fontWeight="600"
                    letterSpacing="1.2"
                  >
                    REGION I · KARMA-YOGA (CH. 1–6)
                  </text>
                </g>
                <g>
                  <rect x="34" y="242" width="262" height="24" rx="6" fill="var(--gj-surface-subtle)" />
                  <text
                    x="42"
                    y="258"
                    fill="var(--gj-text-muted)"
                    fontSize="12"
                    fontWeight="600"
                    letterSpacing="1.2"
                  >
                    REGION II · BHAKTI-YOGA (CH. 7–12)
                  </text>
                </g>
                <g>
                  <rect x="34" y="454" width="356" height="24" rx="6" fill="var(--gj-bg)" />
                  <text
                    x="42"
                    y="470"
                    fill="var(--gj-text-muted)"
                    fontSize="12"
                    fontWeight="600"
                    letterSpacing="1.2"
                  >
                    REGION III · JÑĀNA-YOGA & CONCLUSION (CH. 13–18)
                  </text>
                </g>

                {/* 18 Destination Nodes */}
                {GITA_CHAPTERS.map((ch) => {
                  const pt = CHAPTER_COORDS[ch.chapterNumber];
                  const st = bundle.chapterStates.find((s) => s.chapterNumber === ch.chapterNumber)!;
                  const isLocked = st.status === 'locked';
                  const isCompleted = st.status === 'completed';
                  const isActive = st.status === 'in_progress' || st.status === 'available';

                  const radius = 26;
                  const circumference = 2 * Math.PI * (radius + 5);
                  const dashOffset = circumference * (1 - st.progressPercent / 100);

                  return (
                    <g
                      key={ch.chapterNumber}
                      role="button"
                      tabIndex={0}
                      aria-label={`Chapter ${ch.chapterNumber}: ${ch.englishTitle}, ${getStatusLabel(st.status)}, ${st.completedCount} of ${st.verseCount} verses`}
                      onClick={() => setSelectedChapter(ch)}
                      onMouseEnter={() => setHoveredChapter(ch.chapterNumber)}
                      onFocus={() => setHoveredChapter(ch.chapterNumber)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedChapter(ch);
                        }
                      }}
                      className="cursor-pointer focus:outline-none"
                    >
                      {/* Progress Arc */}
                      {!isLocked && st.progressPercent > 0 && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={radius + 5}
                          fill="none"
                          stroke={isCompleted ? 'var(--gj-gold)' : 'var(--gj-accent)'}
                          strokeWidth="3"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          transform={`rotate(-90 ${pt.x} ${pt.y})`}
                        />
                      )}

                      {/* Node Circle */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={radius}
                        fill={
                          isCompleted
                            ? 'var(--gj-success-bg)'
                            : isActive
                              ? 'var(--gj-accent)'
                              : 'var(--gj-surface)'
                        }
                        stroke={
                          isCompleted
                            ? 'var(--gj-success)'
                            : isActive
                              ? 'var(--gj-accent)'
                              : 'var(--gj-border)'
                        }
                        strokeWidth={isActive || isCompleted ? '2.5' : '1.5'}
                      />

                      {/* Chapter Number or Lock Indicator */}
                      <text
                        x={pt.x}
                        y={pt.y + 5}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="700"
                        fill={
                          isActive
                            ? 'var(--gj-accent-text)'
                            : isCompleted
                              ? 'var(--gj-success)'
                              : 'var(--gj-text-muted)'
                        }
                      >
                        {ch.chapterNumber}
                      </text>

                      {/* Label Underneath */}
                      <text
                        x={pt.x}
                        y={pt.y + 46}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight={isActive || isCompleted ? '600' : '500'}
                        fill={isLocked ? 'var(--gj-text-muted)' : 'var(--gj-text)'}
                      >
                        {ch.transliterationTitle.replace('-yoga', '')}
                      </text>
                      <text
                        x={pt.x}
                        y={pt.y + 60}
                        textAnchor="middle"
                        fontSize="10"
                        fill="var(--gj-text-muted)"
                      >
                        {isLocked ? 'Locked' : `${st.completedCount}/${st.verseCount}`}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Legend Footer */}
          <div className="px-5 py-3 border-t border-[var(--gj-border)] bg-[var(--gj-bg)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--gj-text-muted)]">
            <div className="flex flex-wrap items-center gap-5">
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle className="w-3.5 h-3.5 text-[var(--gj-accent)]" aria-hidden="true" />
                <span>Available / Active</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--gj-success)]" aria-hidden="true" />
                <span>Completed</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[var(--gj-text-muted)]" aria-hidden="true" />
                <span>Locked (complete previous chapter)</span>
              </span>
            </div>
            <span>Click any chapter node to inspect verses or launch its Chapter Knowledge Battle</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--gj-border)] text-xs text-[var(--gj-text-muted)] bg-[var(--gj-surface-subtle)]">
                <th className="py-3 px-4 font-medium">Chapter</th>
                <th className="py-3 px-4 font-medium">Title</th>
                <th className="py-3 px-4 font-medium">Progress</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--gj-border)] text-sm">
              {GITA_CHAPTERS.map((ch) => {
                const st = bundle.chapterStates.find((s) => s.chapterNumber === ch.chapterNumber)!;
                const locked = st.status === 'locked';
                return (
                  <tr key={ch.chapterNumber} className="hover:bg-[var(--gj-bg)]">
                    <td className="py-3.5 px-4 font-mono-num">{ch.chapterNumber}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-[var(--gj-text)]">{ch.englishTitle}</p>
                      <p className="text-xs text-[var(--gj-text-muted)]">{ch.transliterationTitle}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-xs">
                      {st.completedCount} / {st.verseCount} ({st.progressPercent}%)
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">{getStatusLabel(st.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedChapter(ch)}
                        className="rounded-lg border border-[var(--gj-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--gj-surface-subtle)]"
                      >
                        {locked ? 'Inspect' : 'Open Chapter'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Chapter Selection & Verse Grid Modal */}
      {selectedChapter && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="chapter-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          onClick={() => setSelectedChapter(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] shadow-2xl p-6 space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-[var(--gj-text-muted)]">
                  Chapter {selectedChapter.chapterNumber} · {selectedChapter.transliterationTitle} ·{' '}
                  {selectedChapter.verseCount} verses
                </p>
                <h2 id="chapter-detail-title" className="font-display text-2xl font-semibold mt-1">
                  {selectedChapter.englishTitle}
                </h2>
                <p className="font-sanskrit text-sm text-[var(--gj-text-muted)] mt-0.5">
                  {selectedChapter.sanskritTitle}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close chapter details"
                onClick={() => setSelectedChapter(null)}
                className="p-2 rounded-lg text-[var(--gj-text-muted)] hover:bg-[var(--gj-surface-subtle)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[var(--gj-text-muted)] leading-relaxed">
              {selectedChapter.summary}
            </p>

            {(() => {
              const st = bundle.chapterStates.find(
                (s) => s.chapterNumber === selectedChapter.chapterNumber
              )!;
              if (st.status === 'locked') {
                return (
                  <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-surface-subtle)] p-4 text-sm text-[var(--gj-text)]">
                    <p className="font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                      Chapter {selectedChapter.chapterNumber} is currently locked
                    </p>
                    <p className="text-xs text-[var(--gj-text-muted)] mt-1">
                      Complete all verses of Chapter {selectedChapter.chapterNumber - 1} to unlock
                      verse tracking here. You can still preview the chapter overview on{' '}
                      <a
                        href={selectedChapter.vedabaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-[var(--gj-accent)]"
                      >
                        Vedabase.io
                      </a>
                      .
                    </p>
                  </div>
                );
              }

              return (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[var(--gj-text)]">
                        Jump to Verse (1–{selectedChapter.verseCount})
                      </span>
                      <span className="text-xs text-[var(--gj-text-muted)]">
                        {st.completedCount} completed
                      </span>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-52 overflow-y-auto p-1">
                      {Array.from({ length: selectedChapter.verseCount }, (_, i) => i + 1).map(
                        (v) => {
                          const code = `${selectedChapter.chapterNumber}.${v}`;
                          const done = completedSet.has(code);
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                setSelectedChapter(null);
                                openReaderAt(selectedChapter.chapterNumber, v);
                              }}
                              className={`h-9 rounded-md text-xs font-mono-num border transition-colors ${
                                done
                                  ? 'bg-[var(--gj-accent)] text-[var(--gj-accent-text)] border-[var(--gj-accent)]'
                                  : 'bg-[var(--gj-bg)] text-[var(--gj-text)] border-[var(--gj-border)] hover:border-[var(--gj-accent)]'
                              }`}
                            >
                              {v}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--gj-border)]">
                    <a
                      href={selectedChapter.vedabaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--gj-accent)] hover:underline"
                    >
                      Open Chapter {selectedChapter.chapterNumber} on Vedabase.io ↗
                    </a>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const chNum = selectedChapter.chapterNumber;
                          setSelectedChapter(null);
                          openChapterChallenge(chNum);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3.5 py-2 text-xs font-medium text-[var(--gj-text)] hover:border-[var(--gj-accent)] whitespace-nowrap"
                      >
                        <Swords className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Knowledge Battle</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChapter(null);
                          openReaderAt(selectedChapter.chapterNumber, 1);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--gj-accent)] px-4 py-2 text-xs font-medium text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)] whitespace-nowrap"
                      >
                        <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Open Reading Room</span>
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
