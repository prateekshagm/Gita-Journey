import React from 'react';
import type { ThemeSpec } from '../lib/themes.ts';

interface ThemeLivePreviewProps {
  spec: ThemeSpec;
  compact?: boolean;
}

/**
 * Pure color-token miniature UI preview for theme selection.
 * Uses actual surface, border, typography, progress, and accent tokens — no images.
 */
export const ThemeLivePreview: React.FC<ThemeLivePreviewProps> = ({ spec, compact = false }) => {
  const { tokens } = spec;

  return (
    <div
      aria-hidden="true"
      className="rounded-lg border overflow-hidden select-none"
      style={{
        backgroundColor: tokens.bg,
        borderColor: tokens.border,
        color: tokens.text,
      }}
    >
      {/* Mini Top Bar */}
      <div
        className="px-2.5 py-2 flex items-center justify-between gap-2 border-b"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-2 h-2 rounded-sm shrink-0"
            style={{ backgroundColor: tokens.accent }}
          />
          <span className="font-display text-[11px] font-semibold tracking-tight truncate">
            {compact ? 'Bg. 1.1' : 'Bg. 1.1 · Adventure Path'}
          </span>
        </div>
        <span
          className="font-mono-num text-[10px] whitespace-nowrap shrink-0"
          style={{ color: tokens.gold }}
        >
          120 XP
        </span>
      </div>

      {/* Mini Workspace Preview */}
      <div className={compact ? 'p-2.5 space-y-2' : 'p-3.5 space-y-2.5'}>
        <div
          className="rounded-md border p-2 space-y-1.5"
          style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
        >
          <div className="flex items-center justify-between gap-2 text-[10px]" style={{ color: tokens.textMuted }}>
            <span className="truncate">{compact ? 'Ch. 1 · Arjuna' : 'Chapter 1 · Arjuna-viṣāda-yoga'}</span>
            <span className="font-mono-num whitespace-nowrap shrink-0">12/46</span>
          </div>
          <div
            className="h-1.5 w-full rounded-full overflow-hidden"
            style={{ backgroundColor: tokens.surfaceSubtle }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: '48%', backgroundColor: tokens.accent }}
            />
          </div>
          {!compact && (
            <p className="font-sanskrit text-[11px] pt-1" style={{ color: tokens.text }}>
              धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap shrink-0"
            style={{ backgroundColor: tokens.accent, color: tokens.accentText }}
          >
            {compact ? 'Read' : 'Continue Reading'}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {spec.swatches.map((hex) => (
              <span
                key={hex}
                className={`${compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} rounded-full border border-black/15`}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
