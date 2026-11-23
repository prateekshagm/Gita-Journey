import React, { useState } from 'react';
import { Eye, EyeOff, Flower2, Lock } from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';
import { getThemeSpec } from '../lib/themes.ts';
import { GARDEN_CATALOG, GARDEN_ENVIRONMENTS, GardenEnvironmentSpec } from '../shared/gitaData.ts';

function GardenItemSvg({ code }: { code: string }) {
  switch (code) {
    case 'lotus_blue':
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" aria-hidden="true">
          <circle cx="24" cy="34" r="10" fill="#2D6A4F" opacity="0.6" />
          <path d="M24 10 C20 18 16 24 24 32 C32 24 28 18 24 10Z" fill="#4A89B8" />
          <path d="M14 22 C16 27 20 31 24 32 C20 26 18 23 14 22Z" fill="#7FB3D5" />
          <path d="M34 22 C32 27 28 31 24 32 C28 26 30 23 34 22Z" fill="#7FB3D5" />
        </svg>
      );
    case 'kadamba_tree':
      return (
        <svg viewBox="0 0 48 48" className="w-12 h-12" aria-hidden="true">
          <rect x="21" y="26" width="6" height="16" rx="2" fill="#6D4C3D" />
          <circle cx="24" cy="20" r="13" fill="#2D6A4F" />
          <circle cx="18" cy="18" r="3" fill="#EAB308" />
          <circle cx="29" cy="16" r="3" fill="#EAB308" />
          <circle cx="24" cy="24" r="2.5" fill="#EAB308" />
        </svg>
      );
    case 'brass_diya':
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" aria-hidden="true">
          <path d="M24 12 C21 17 21 21 24 23 C27 21 27 17 24 12Z" fill="#F59E0B" />
          <path d="M12 26 H36 L31 35 H17 Z" fill="#B45309" />
          <rect x="19" y="35" width="10" height="4" rx="1" fill="#92400E" />
        </svg>
      );
    case 'tulasi_grove':
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" aria-hidden="true">
          <rect x="16" y="27" width="16" height="13" rx="2" fill="#B45309" />
          <path d="M24 11 V27" stroke="#2D6A4F" strokeWidth="2.5" />
          <circle cx="20" cy="18" r="4" fill="#40916C" />
          <circle cx="28" cy="18" r="4" fill="#40916C" />
          <circle cx="24" cy="13" r="4" fill="#52B788" />
        </svg>
      );
    case 'yamuna_pond':
      return (
        <svg viewBox="0 0 48 48" className="w-12 h-10" aria-hidden="true">
          <ellipse cx="24" cy="28" rx="19" ry="10" fill="#4A89B8" opacity="0.85" />
          <ellipse cx="24" cy="27" rx="12" ry="5" fill="#93C5FD" opacity="0.55" />
        </svg>
      );
    case 'peacock':
      return (
        <svg viewBox="0 0 48 48" className="w-12 h-12" aria-hidden="true">
          <circle cx="24" cy="20" r="14" fill="#1E3A8A" opacity="0.25" />
          <ellipse cx="24" cy="28" rx="6" ry="9" fill="#1D4ED8" />
          <circle cx="24" cy="16" r="4" fill="#1D4ED8" />
          <circle cx="17" cy="14" r="2" fill="#10B981" />
          <circle cx="31" cy="14" r="2" fill="#10B981" />
          <circle cx="24" cy="9" r="2" fill="#10B981" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 48 48" className="w-10 h-10" aria-hidden="true">
          <rect x="10" y="28" width="28" height="8" rx="3" fill="#A8A29E" />
          <circle cx="18" cy="22" r="4" fill="#D97706" />
          <circle cx="30" cy="22" r="4" fill="#D97706" />
        </svg>
      );
  }
}

function GardenBackdropSvg({ env }: { env: GardenEnvironmentSpec }) {
  return (
    <svg
      viewBox="0 0 1000 420"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    >
      {/* Sky Horizon Band */}
      <rect x="0" y="0" width="1000" height="240" fill={env.skyTop} />
      <rect x="0" y="130" width="1000" height="120" fill={env.skyBottom} opacity="0.85" />

      {/* Calm Solar / Lunar Disc */}
      <circle cx="800" cy="96" r="42" fill="#FFFDF7" opacity="0.8" />

      {/* Distant Grove Silhouette */}
      <path
        d="M0 220 Q120 175 260 205 T560 200 T840 190 L1000 210 L1000 260 L0 260 Z"
        fill={env.meadowColor}
        opacity="0.45"
      />

      {/* Sandstone / Courtyard Pavilion Silhouette for Temple or Navadvipa */}
      {(env.code === 'temple_courtyard' || env.code === 'navadvipa_dawn') && (
        <g fill={env.accentStroke} opacity="0.18">
          <rect x="110" y="165" width="12" height="75" />
          <rect x="155" y="165" width="12" height="75" />
          <rect x="200" y="165" width="12" height="75" />
          <polygon points="96,165 161,132 226,165" />
        </g>
      )}

      {/* Meadow Ground */}
      <rect x="0" y="220" width="1000" height="200" fill={env.meadowColor} />

      {/* Winding Sacred River */}
      <path
        d="M0 315 Q260 265 520 315 T1000 295 L1000 390 Q720 410 480 370 T0 390 Z"
        fill={env.waterColor}
        opacity="0.85"
      />
      <path
        d="M120 335 Q280 315 440 340"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeOpacity="0.35"
        fill="none"
      />
      <path
        d="M620 330 Q780 315 900 332"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeOpacity="0.35"
        fill="none"
      />
    </svg>
  );
}

export const GardenPage: React.FC = () => {
  const { bundle, updateGardenItem, updatePreferences } = useJourney();
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null);

  if (!bundle) return null;

  const themeSpec = getThemeSpec(bundle.preferences.theme);
  const ownedMap = new Map(bundle.gardenItems.map((g) => [g.itemCode, g]));
  const activeEnvCode = bundle.preferences.selectedEnvironment || 'yamuna_sanctuary';
  const activeEnv =
    GARDEN_ENVIRONMENTS.find((e) => e.code === activeEnvCode) ?? GARDEN_ENVIRONMENTS[0];

  const handleCanvasClick = async (e: React.MouseEvent<HTMLElement>) => {
    if (!selectedItemCode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const posX = Math.max(8, Math.min(92, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const posY = Math.max(15, Math.min(88, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    await updateGardenItem(selectedItemCode, { posX, posY, placed: true });
    setSelectedItemCode(null);
  };

  return (
    <div className="space-y-6 gj-enter">
      <div>
        <p className="text-xs text-[var(--gj-text-muted)]">
          Cosmetic Study Sanctuary · {activeEnv.name} · {themeSpec.name}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
          My Devotional Garden
        </h1>
        <p className="text-sm text-[var(--gj-text-muted)] mt-1 max-w-2xl">
          Garden environments and flora unlock naturally from reading milestones. They are peaceful
          visual keepsakes and never imply personal spiritual standing.
        </p>
      </div>

      {/* Unlockable Garden Environments Bar */}
      <section aria-label="Garden environments" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {GARDEN_ENVIRONMENTS.map((env) => {
          const unlocked = bundle.stats.completedVersesCount >= env.requiredVerses;
          const active = activeEnv.code === env.code;
          return (
            <button
              key={env.code}
              type="button"
              disabled={!unlocked}
              onClick={() => void updatePreferences({ selectedEnvironment: env.code })}
              className={`text-left rounded-xl border p-3.5 transition-colors flex flex-col justify-between gap-2 ${
                active
                  ? 'border-[var(--gj-accent)] bg-[var(--gj-surface)] ring-2 ring-[var(--gj-accent)]/20'
                  : unlocked
                    ? 'border-[var(--gj-border)] bg-[var(--gj-surface)] hover:border-[var(--gj-accent)]'
                    : 'border-[var(--gj-border)] bg-[var(--gj-bg)] opacity-70 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--gj-text)]">{env.name}</span>
                {!unlocked ? (
                  <Lock className="w-3.5 h-3.5 text-[var(--gj-text-muted)] shrink-0" aria-hidden="true" />
                ) : active ? (
                  <span className="text-[11px] font-medium text-[var(--gj-accent)]">Active</span>
                ) : null}
              </div>
              <p className="text-[11px] text-[var(--gj-text-muted)]">
                {unlocked ? env.description : `Unlocks at ${env.requiredVerses} completed verses`}
              </p>
            </button>
          );
        })}
      </section>

      {/* Pure-SVG Interactive Garden Canvas (Zero Photos) */}
      <section
        aria-label="Interactive devotional garden canvas"
        onClick={(e) => void handleCanvasClick(e)}
        className={`relative rounded-2xl border border-[var(--gj-border)] overflow-hidden min-h-[340px] sm:min-h-[400px] ${
          selectedItemCode ? 'cursor-crosshair ring-2 ring-[var(--gj-accent)]' : ''
        }`}
      >
        <GardenBackdropSvg env={activeEnv} />

        {selectedItemCode && (
          <div className="relative z-20 m-4 inline-block rounded-lg bg-[var(--gj-surface)] px-3 py-1.5 text-xs font-medium shadow">
            Click anywhere in the garden to place{' '}
            {GARDEN_CATALOG.find((c) => c.code === selectedItemCode)?.name}
          </div>
        )}

        {bundle.gardenItems
          .filter((g) => g.placed)
          .map((item) => {
            const cat = GARDEN_CATALOG.find((c) => c.code === item.itemCode);
            return (
              <button
                key={item.itemCode}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemCode(item.itemCode);
                }}
                title={`${cat?.name ?? item.itemCode} — click to move`}
                style={{ left: `${item.posX}%`, top: `${item.posY}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/90 shadow-md hover:scale-110 transition-transform"
              >
                <GardenItemSvg code={item.itemCode} />
              </button>
            );
          })}

        {bundle.gardenItems.length === 0 && (
          <div className="relative z-10 flex flex-col items-center justify-center h-[340px] text-center p-6">
            <div className="rounded-2xl bg-[var(--gj-surface)]/92 border border-[var(--gj-border)] px-6 py-5 max-w-sm shadow-sm">
              <Flower2 className="w-7 h-7 mx-auto mb-2 text-[var(--gj-accent)]" aria-hidden="true" />
              <p className="font-display text-2xl font-semibold text-[var(--gj-text)]">
                Your Garden Awaits Its First Lotus
              </p>
              <p className="text-xs mt-1.5 text-[var(--gj-text-muted)]">
                Complete your first verse in the Reading Room to unlock the Blue Yamuna Lotus.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Catalog of Collectible Garden Items */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GARDEN_CATALOG.map((item) => {
          const owned = ownedMap.get(item.code);
          return (
            <div
              key={item.code}
              className={`rounded-xl border p-4 flex flex-col justify-between ${
                owned
                  ? 'border-[var(--gj-border)] bg-[var(--gj-surface)]'
                  : 'border-[var(--gj-border)] bg-[var(--gj-bg)] opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <GardenItemSvg code={item.code} />
                  {owned ? (
                    <span className="text-xs font-medium text-[var(--gj-success)]">Unlocked</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--gj-text-muted)]">
                      <Lock className="w-3 h-3" aria-hidden="true" /> Locked
                    </span>
                  )}
                </div>
                <h2 className="font-display text-lg font-semibold mt-3">{item.name}</h2>
                <p className="text-xs text-[var(--gj-text-muted)] mt-1">{item.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--gj-border)]">
                {owned ? (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void updateGardenItem(item.code, { placed: !owned.placed })}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--gj-accent)] hover:underline"
                    >
                      {owned.placed ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Place</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedItemCode(item.code)}
                      className="text-xs text-[var(--gj-text-muted)] hover:text-[var(--gj-text)]"
                    >
                      Reposition
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--gj-text-muted)]">
                    Unlock: {item.unlockHint}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
