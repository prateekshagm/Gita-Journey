import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';
import { THEME_SPECS } from '../lib/themes.ts';
import type { ThemeId } from '../shared/progression.ts';
import { ThemeLivePreview } from './ThemeLivePreview.tsx';

export const AuthOnboardingModal: React.FC = () => {
  const {
    showAuthModal,
    authModalMode,
    closeAuthModal,
    startGuestExploration,
    registerAccount,
    loginAccount,
    loginWithGoogle,
  } = useJourney();

  const [tab, setTab] = useState<'login' | 'register'>(
    authModalMode === 'login' ? 'login' : 'register'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [theme, setTheme] = useState<ThemeId>('krishna');
  const [dailyTarget, setDailyTarget] = useState(3);
  const [notifConsent, setNotifConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setTab(authModalMode === 'login' ? 'login' : 'register');
    setErrMsg(null);
  }, [authModalMode, showAuthModal]);

  if (!showAuthModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setSubmitting(true);
    try {
      if (tab === 'login') {
        await loginAccount(email, password);
      } else {
        await registerAccount({
          email,
          password,
          displayName,
          theme,
          dailyVerseTarget: dailyTarget,
          notificationConsent: notifConsent,
        });
      }
    } catch (err) {
      setErrMsg((err as Error).message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setErrMsg(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setErrMsg((err as Error).message || 'Google sign-in did not complete.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] shadow-2xl overflow-hidden my-8">
        <div className="px-6 py-5 border-b border-[var(--gj-border)] flex items-center justify-between gap-4">
          <div>
            <h2 id="auth-modal-title" className="font-display text-2xl font-semibold text-[var(--gj-text)]">
              {tab === 'login' ? 'Welcome Back' : 'Begin Your Gītā Journey'}
            </h2>
            <p className="text-xs text-[var(--gj-text-muted)] mt-0.5">
              {tab === 'login'
                ? 'Sign in to resume your reading across devices.'
                : 'Personalize your theme and daily target. Any guest progress migrates automatically.'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close sign in dialog"
            onClick={closeAuthModal}
            className="p-2 rounded-lg text-[var(--gj-text-muted)] hover:bg-[var(--gj-surface-subtle)] min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Segmented Tab */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[var(--gj-surface-subtle)] border border-[var(--gj-border)]">
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setErrMsg(null);
              }}
              className={`py-2 text-xs font-medium rounded-md transition-colors ${
                tab === 'register'
                  ? 'bg-[var(--gj-surface)] text-[var(--gj-text)] shadow-sm'
                  : 'text-[var(--gj-text-muted)] hover:text-[var(--gj-text)]'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrMsg(null);
              }}
              className={`py-2 text-xs font-medium rounded-md transition-colors ${
                tab === 'login'
                  ? 'bg-[var(--gj-surface)] text-[var(--gj-text)] shadow-sm'
                  : 'text-[var(--gj-text-muted)] hover:text-[var(--gj-text)]'
              }`}
            >
              Sign In
            </button>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleGoogle()}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-[var(--gj-border)] bg-[var(--gj-surface)] px-4 py-2.5 text-sm font-medium text-[var(--gj-text)] hover:bg-[var(--gj-surface-subtle)] transition-colors min-h-[44px]"
          >
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-[var(--gj-border)]" />
            <span className="shrink mx-3 text-xs text-[var(--gj-text-muted)]">or with email</span>
            <div className="flex-grow border-t border-[var(--gj-border)]" />
          </div>

          {errMsg && (
            <div
              role="alert"
              className="rounded-lg border border-[var(--gj-danger)]/30 bg-[var(--gj-danger-bg)] px-3.5 py-2.5 text-xs text-[var(--gj-danger)]"
            >
              {errMsg}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label htmlFor="auth-display-name" className="block text-xs font-medium text-[var(--gj-text)] mb-1">
                  Display Name
                </label>
                <input
                  id="auth-display-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should we greet you?"
                  className="w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3.5 py-2.5 text-sm text-[var(--gj-text)] focus:outline-none focus:ring-2 focus:ring-[var(--gj-accent)]"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-[var(--gj-text)] mb-1">
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3.5 py-2.5 text-sm text-[var(--gj-text)] focus:outline-none focus:ring-2 focus:ring-[var(--gj-accent)]"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-medium text-[var(--gj-text)] mb-1">
                Password {tab === 'register' && <span className="text-[var(--gj-text-muted)]">(minimum 8 characters)</span>}
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={tab === 'register' ? 8 : 1}
                autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3.5 py-2.5 text-sm text-[var(--gj-text)] focus:outline-none focus:ring-2 focus:ring-[var(--gj-accent)]"
              />
            </div>

            {tab === 'register' && (
              <>
                <div>
                  <span className="block text-xs font-medium text-[var(--gj-text)] mb-1.5">
                    Select Theme
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {THEME_SPECS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTheme(t.id);
                          document.documentElement.setAttribute('data-theme', t.id);
                        }}
                        className={`rounded-xl border p-2.5 text-left transition-colors space-y-2 ${
                          theme === t.id
                            ? 'border-[var(--gj-accent)] bg-[var(--gj-accent-soft)]'
                            : 'border-[var(--gj-border)] bg-[var(--gj-bg)]'
                        }`}
                      >
                        <ThemeLivePreview spec={t} compact />
                        <span className="text-xs font-semibold block truncate">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-daily-target" className="block text-xs font-medium text-[var(--gj-text)] mb-1">
                    Daily Verse Target: <span className="font-mono-num">{dailyTarget} verses/day</span>
                  </label>
                  <input
                    id="auth-daily-target"
                    type="range"
                    min={1}
                    max={15}
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(Number(e.target.value))}
                    className="w-full accent-[var(--gj-accent)]"
                  />
                </div>

                <label className="flex items-start gap-2.5 text-xs text-[var(--gj-text-muted)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifConsent}
                    onChange={(e) => setNotifConsent(e.target.checked)}
                    className="mt-0.5 rounded border-[var(--gj-border)]"
                  />
                  <span>
                    Allow gentle in-app reading reminders and milestone updates (customizable anytime in Settings).
                  </span>
                </label>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[var(--gj-accent)] px-4 py-2.5 text-sm font-medium text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)] transition-colors disabled:opacity-60 min-h-[44px]"
            >
              {submitting
                ? 'Please wait...'
                : tab === 'login'
                  ? 'Sign In'
                  : 'Create Account & Start'}
            </button>
          </form>

          <div className="pt-2 border-t border-[var(--gj-border)] text-center">
            <button
              type="button"
              onClick={() => startGuestExploration({ theme, dailyVerseTarget: dailyTarget })}
              className="text-xs font-medium text-[var(--gj-accent)] hover:underline py-1"
            >
              Or explore as a Guest without an account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
