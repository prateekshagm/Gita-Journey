import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--gj-border)] bg-[var(--gj-surface)] px-3 py-2 text-xs font-medium text-[var(--gj-text)] hover:bg-[var(--gj-surface-subtle)] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{compact ? 'Install' : 'Install App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--gj-border)] bg-[var(--gj-surface)] px-3 py-2 text-xs font-medium text-[var(--gj-text)] hover:bg-[var(--gj-surface-subtle)] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Install on iOS</span>
        </button>
        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-pwa-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <div className="w-full max-w-sm rounded-xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 shadow-xl">
              <h3 id="ios-pwa-title" className="font-display text-xl font-semibold text-[var(--gj-text)]">
                Install on iPhone or iPad
              </h3>
              <p className="mt-2 text-sm text-[var(--gj-text-muted)]">
                1. Tap the <strong>Share</strong> button in your Safari toolbar.
                <br />
                2. Scroll down and select <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[var(--gj-accent)] px-4 py-2.5 text-sm font-medium text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
