import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  Flower2,
  GitBranch,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';
import { THEME_SPECS } from '../lib/themes.ts';
import { GITA_CHAPTERS, TOTAL_GITA_VERSES } from '../shared/gitaData.ts';
import type { ThemeId } from '../shared/progression.ts';
import { PWAInstallButton } from '../components/PWAInstallButton.tsx';
import { ThemeLivePreview } from '../components/ThemeLivePreview.tsx';

export const LandingPage: React.FC = () => {
  const { startGuestExploration, openAuthModal } = useJourney();
  const [previewTheme, setPreviewTheme] = useState<ThemeId>('krishna');

  const activeSpec = THEME_SPECS.find((t) => t.id === previewTheme) ?? THEME_SPECS[0];

  const handleThemeSelect = (themeId: ThemeId) => {
    setPreviewTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  return (
    <div className="min-h-screen bg-[var(--gj-bg)] text-[var(--gj-text)] flex flex-col">
      {/* 3-Zone Top Bar */}
      <header className="border-b border-[var(--gj-border)] bg-[var(--gj-surface)]/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-2xl font-semibold tracking-tight text-[var(--gj-text)] whitespace-nowrap shrink-0"
          >
            GĪTĀ JOURNEY
          </a>

          <nav
            aria-label="Landing sections"
            className="hidden md:flex items-center gap-6 text-sm text-[var(--gj-text-muted)]"
          >
            <a href="#loop" className="hover:text-[var(--gj-text)] transition-colors whitespace-nowrap shrink-0">
              Adventure Loop
            </a>
            <a href="#themes" className="hover:text-[var(--gj-text)] transition-colors whitespace-nowrap shrink-0">
              Themes
            </a>
            <a href="#structure" className="hover:text-[var(--gj-text)] transition-colors whitespace-nowrap shrink-0">
              700 Verses
            </a>
            <a href="#source" className="hover:text-[var(--gj-text)] transition-colors whitespace-nowrap shrink-0">
              Source Integrity
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton compact />
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="hidden sm:inline-flex items-center px-3 py-2 text-sm font-medium text-[var(--gj-text)] hover:text-[var(--gj-accent)] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('onboarding')}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--gj-accent)] px-4 py-2 text-sm font-medium text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <span>Begin Adventure</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split — Pure Typography & Interactive Game Preview (Zero Images) */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--gj-text-muted)]">
                Bhagavad-gītā As It Is · 18 Chapters · {TOTAL_GITA_VERSES} Verses
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--gj-text)] mt-4 leading-[1.12] headline-balance">
                An immersive learning adventure across all 700 verses
              </h1>
              <p className="text-base sm:text-lg text-[var(--gj-text-muted)] mt-5 max-w-2xl leading-relaxed">
                Explore a connected 18-chapter world map, accept calm daily reading quests,
                test your Sanskrit and verse comprehension, unlock skill paths, and tend a
                serene devotional garden—always centered on authentic scripture.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openAuthModal('onboarding')}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--gj-accent)] px-6 py-3 text-sm font-medium text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => startGuestExploration({ theme: previewTheme })}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--gj-border)] bg-[var(--gj-surface)] px-6 py-3 text-sm font-medium text-[var(--gj-text)] hover:bg-[var(--gj-surface-subtle)] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
                >
                  <span>Explore as Guest</span>
                </button>
              </div>

              <div className="mt-10 pt-6 border-t border-[var(--gj-border)] grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <p className="font-mono-num text-2xl font-medium text-[var(--gj-text)]">18</p>
                  <p className="text-xs text-[var(--gj-text-muted)] mt-1">Chapters across 3 regions</p>
                </div>
                <div>
                  <p className="font-mono-num text-2xl font-medium text-[var(--gj-text)]">700</p>
                  <p className="text-xs text-[var(--gj-text-muted)] mt-1">Source-linked verses</p>
                </div>
                <div>
                  <p className="font-mono-num text-2xl font-medium text-[var(--gj-text)]">7</p>
                  <p className="text-xs text-[var(--gj-text-muted)] mt-1">Challenge & quest modes</p>
                </div>
              </div>
            </div>

            {/* Right Column: Pure Typographic Scripture & Journey Preview */}
            <div className="lg:col-span-5">
              <div className="h-full rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 sm:p-7 flex flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center justify-between text-xs text-[var(--gj-text-muted)] pb-3 border-b border-[var(--gj-border)]">
                    <span>Chapter 1 Destination · Unlocked</span>
                    <span className="font-mono-num">Bg. 1.1</span>
                  </div>

                  <p className="font-sanskrit text-lg sm:text-[19px] text-[var(--gj-text)] mt-5 leading-relaxed">
                    धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।
                    <br />
                    मामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय{' '}
                    <span className="whitespace-nowrap">॥ १ ॥</span>
                  </p>
                  <p className="text-xs italic text-[var(--gj-text-muted)] mt-3 leading-relaxed">
                    dharma-kṣetre kuru-kṣetre samavetā yuyutsavaḥ / māmakāḥ pāṇḍavāś caiva kim akurvata sañjaya
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-[var(--gj-text)]">
                    Sample Opening Quest: Daily Reading
                  </p>
                  <div className="flex items-center justify-between text-xs text-[var(--gj-text-muted)]">
                    <span>Read 3 verses in Chapter 1</span>
                    <span className="font-mono-num text-[var(--gj-accent)]">+25 XP</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--gj-surface-subtle)] overflow-hidden">
                    <div className="h-full w-1/3 rounded-full bg-[var(--gj-accent)]" />
                  </div>
                  <p className="text-[11px] text-[var(--gj-text-muted)]">
                    Every chapter, reflection, and Sanskrit puzzle traces directly to vedabase.io.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clear Adventure Gameplay Loop */}
        <section id="loop" className="border-t border-[var(--gj-border)] bg-[var(--gj-surface)] py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--gj-text-muted)]">
              Connected Game Architecture
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-2 headline-balance">
              Every reading session moves your journey forward
            </h2>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-5">
                <Compass className="w-5 h-5 text-[var(--gj-accent)]" aria-hidden="true" />
                <p className="font-mono-num text-[11px] text-[var(--gj-text-muted)] mt-3">STEP 01 · EXPLORE</p>
                <h3 className="font-display text-xl font-semibold mt-1">18-Chapter World Map</h3>
                <p className="text-xs text-[var(--gj-text-muted)] mt-2 leading-relaxed">
                  Travel from Kurukṣetra across Karma, Bhakti, and Jñāna regions as chapters unlock sequentially.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-5">
                <ScrollText className="w-5 h-5 text-[var(--gj-accent)]" aria-hidden="true" />
                <p className="font-mono-num text-[11px] text-[var(--gj-text-muted)] mt-3">STEP 02 · ACCEPT QUESTS</p>
                <h3 className="font-display text-xl font-semibold mt-1">Purposeful Study Quests</h3>
                <p className="text-xs text-[var(--gj-text-muted)] mt-2 leading-relaxed">
                  Accept daily reading, purport comprehension, Sanskrit vocabulary, and chapter completion quests.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-5">
                <BookOpen className="w-5 h-5 text-[var(--gj-accent)]" aria-hidden="true" />
                <p className="font-mono-num text-[11px] text-[var(--gj-text-muted)] mt-3">STEP 03 · READ & CHALLENGE</p>
                <h3 className="font-display text-xl font-semibold mt-1">Sanctuary & Boss Battles</h3>
                <p className="text-xs text-[var(--gj-text-muted)] mt-2 leading-relaxed">
                  Read with bookmarks and reflections, then test recall with Sanskrit matching, verse ordering, and chapter challenges.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-5">
                <div className="flex items-center gap-2 text-[var(--gj-accent)]">
                  <GitBranch className="w-5 h-5" aria-hidden="true" />
                  <Flower2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="font-mono-num text-[11px] text-[var(--gj-text-muted)] mt-3">STEP 04 · UNLOCK & GROW</p>
                <h3 className="font-display text-xl font-semibold mt-1">Skill Tree & Garden</h3>
                <p className="text-xs text-[var(--gj-text-muted)] mt-2 leading-relaxed">
                  Unlock skill nodes across five study branches and expand your SVG sanctuary without ever penalizing missed days.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Three Selectable Devotional Themes — Live Interface Token Previews (Zero Images) */}
        <section id="themes" className="border-t border-[var(--gj-border)] py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--gj-text-muted)]">
                  Typographic & Palette System
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-2 headline-balance">
                  Three tranquil atmospheres, previewed live
                </h2>
              </div>
              <p className="text-sm text-[var(--gj-text-muted)] max-w-md">
                Each theme shifts backgrounds, surfaces, ink contrast, borders, and reading accents
                across the entire interface.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {THEME_SPECS.map((t) => {
                const selected = previewTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeSelect(t.id)}
                    aria-pressed={selected}
                    className={`text-left rounded-xl border p-5 transition-all flex flex-col justify-between gap-4 bg-[var(--gj-surface)] ${
                      selected
                        ? 'border-[var(--gj-accent)] ring-2 ring-[var(--gj-accent)]/25'
                        : 'border-[var(--gj-border)] hover:border-[var(--gj-accent)]/60'
                    }`}
                  >
                    <ThemeLivePreview spec={t} />

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-2xl font-semibold text-[var(--gj-text)]">
                          {t.name}
                        </h3>
                        <span className="text-xs font-medium text-[var(--gj-accent)]">
                          {selected ? 'Active preview' : 'Preview theme'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--gj-text-muted)] mt-0.5">{t.subtitle}</p>
                      <p className="text-sm text-[var(--gj-text-muted)] mt-2.5 leading-relaxed">
                        {t.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 18-Chapter Structure Overview */}
        <section id="structure" className="border-t border-[var(--gj-border)] bg-[var(--gj-surface)] py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--gj-text-muted)]">
                  Canonical Structure
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-2">
                  All 18 Chapters · 700 Verses
                </h2>
              </div>
              <p className="text-sm text-[var(--gj-text-muted)]">
                Exact verse counts verified against Vedabase.io
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GITA_CHAPTERS.map((ch) => (
                <div
                  key={ch.chapterNumber}
                  className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-baseline justify-between gap-2 text-xs text-[var(--gj-text-muted)]">
                      <span>
                        Chapter {ch.chapterNumber} · {ch.transliterationTitle}
                      </span>
                      <span className="font-mono-num">{ch.verseCount} verses</span>
                    </div>
                    <h3 className="font-display text-xl font-semibold text-[var(--gj-text)] mt-1">
                      {ch.englishTitle}
                    </h3>
                  </div>
                  <p className="font-sanskrit text-sm text-[var(--gj-text-muted)] mt-2">
                    {ch.sanskritTitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Source Integrity */}
        <section id="source" className="py-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--gj-accent)]">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>Scripture Accuracy & Licensing Integrity</span>
              </div>
              <p className="text-sm text-[var(--gj-text-muted)] mt-2 leading-relaxed">
                Gītā Journey respects Bhaktivedanta Book Trust International copyright. Until a full
                text license is imported by an authorized administrator, every verse entry links
                directly to its verified page on <strong>vedabase.io/en/library/bg/</strong> and never
                fabricates or paraphrases scripture as original text.
              </p>
            </div>
            <button
              type="button"
              onClick={() => startGuestExploration({ theme: previewTheme })}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--gj-accent)] px-5 py-3 text-sm font-medium text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
            >
              <span>Start Reading Chapter 1</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--gj-border)] bg-[var(--gj-surface)] py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--gj-text-muted)]">
          <span>GĪTĀ JOURNEY · Active preview: {activeSpec.name}</span>
          <span>Reference edition: Bhagavad-gītā As It Is · vedabase.io</span>
        </div>
      </footer>
    </div>
  );
};
