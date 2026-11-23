import React, { useEffect, useState } from 'react';
import { Bell, Download, LogOut, Shield, Trash2 } from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';
import { THEME_SPECS } from '../lib/themes.ts';
import type { MissionMode, ThemeId } from '../shared/progression.ts';
import { ThemeLivePreview } from '../components/ThemeLivePreview.tsx';

export const SettingsPage: React.FC = () => {
  const { bundle, updatePreferences, logout, openAuthModal, openReaderAt, refreshState } =
    useJourney();

  const [displayName, setDisplayName] = useState(bundle?.user?.displayName || 'Explorer');
  const [notifForm, setNotifForm] = useState(bundle?.notificationPreferences);
  const [sessions, setSessions] = useState<
    Array<{ id: string; userAgent: string; ipAddress: string; createdAt: string; revokedAt: string | null }>
  >([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    if (bundle?.user) {
      setDisplayName(bundle.user.displayName);
      fetch('/api/auth/sessions', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d) {
            setSessions(d.sessions || []);
            setCurrentSessionId(d.currentSessionId || null);
          }
        })
        .catch(() => {});
    }
    if (bundle?.notificationPreferences) {
      setNotifForm(bundle.notificationPreferences);
    }
  }, [bundle]);

  if (!bundle) return null;

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    await updatePreferences({ displayName: displayName.trim() });
    setStatusMsg('Profile display name updated.');
  };

  const saveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bundle.isGuest) {
      setStatusMsg('Create an account to schedule server-persisted reminders.');
      return;
    }
    const res = await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...notifForm,
        consentGranted: true,
      }),
    });
    if (res.ok) {
      await refreshState();
      setStatusMsg('Reminder preferences and consent saved.');
    }
  };

  const testBrowserPushPermission = async () => {
    if (!('Notification' in window)) {
      setStatusMsg('This browser does not support Web Notifications.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotifForm((prev) => (prev ? { ...prev, browserPushEnabled: true } : prev));
      new Notification('Gītā Journey', {
        body: 'Browser reminders enabled. Respects your quiet hours.',
      });
      setStatusMsg('Browser notification permission granted.');
    } else {
      setStatusMsg(`Browser notification permission is "${perm}".`);
    }
  };

  const runReminderCheck = async () => {
    if (bundle.isGuest) {
      setStatusMsg('Sign in to test reminder dispatch logging.');
      return;
    }
    const res = await fetch('/api/notifications/dispatch-check', {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    await refreshState();
    setStatusMsg(`Reminder check logged: ${data.outcome?.status || 'processed'}`);
  };

  const revokeSession = async (id: string) => {
    await fetch(`/api/auth/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const res = await fetch('/api/auth/sessions', { credentials: 'include' });
    if (res.ok) {
      const d = await res.json();
      setSessions(d.sessions || []);
    }
    setStatusMsg('Session updated.');
  };

  const handleExport = () => {
    if (bundle.isGuest) {
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gita-journey-guest-export.json';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    window.location.href = '/api/auth/export';
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ confirmEmail: deleteConfirmEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatusMsg(data.error || 'Could not delete account');
      return;
    }
    await logout();
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[var(--gj-text-muted)]">
          Personalization · Reminders · Privacy & Data Controls
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
          Profile & Settings
        </h1>
      </div>

      {statusMsg && (
        <div role="status" className="rounded-xl border border-[var(--gj-accent)]/40 bg-[var(--gj-accent-soft)] px-4 py-3 text-sm">
          {statusMsg}
        </div>
      )}

      {/* Account & Theme */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-5">
          <h2 className="font-display text-2xl font-semibold">Account & Profile</h2>

          {bundle.isGuest ? (
            <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-4 space-y-3">
              <p className="text-sm font-medium">Currently Exploring as Guest</p>
              <p className="text-xs text-[var(--gj-text-muted)]">
                Create an account or sign in to sync your {bundle.stats.completedVersesCount}{' '}
                {bundle.stats.completedVersesCount === 1 ? 'completed verse' : 'completed verses'},
                bookmarks, and reflections to PostgreSQL across devices.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="rounded-lg bg-[var(--gj-accent)] px-4 py-2 text-xs font-medium text-[var(--gj-accent-text)]"
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="rounded-lg border border-[var(--gj-border)] px-4 py-2 text-xs font-medium"
                >
                  Sign In
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void saveName(e)} className="space-y-4">
              <div>
                <label htmlFor="settings-display-name" className="block text-xs font-medium mb-1">
                  Display Name
                </label>
                <div className="flex gap-2">
                  <input
                    id="settings-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[var(--gj-accent)] px-4 py-2 text-xs font-medium text-[var(--gj-accent-text)]"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="text-xs text-[var(--gj-text-muted)] space-y-1">
                <p>Email: {bundle.user?.email}</p>
                <p>Role: {bundle.user?.role} · Sign-in provider: {bundle.user?.authProvider}</p>
              </div>
            </form>
          )}

          {/* Theme Selection */}
          <div className="pt-4 border-t border-[var(--gj-border)]">
            <span className="block text-xs font-medium mb-2">Devotional Theme</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {THEME_SPECS.map((t) => {
                const active = bundle.preferences.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => void updatePreferences({ theme: t.id as ThemeId })}
                    aria-pressed={active}
                    className={`rounded-xl border p-2.5 text-left transition-colors space-y-2 ${
                      active
                        ? 'border-[var(--gj-accent)] bg-[var(--gj-accent-soft)]'
                        : 'border-[var(--gj-border)] bg-[var(--gj-bg)]'
                    }`}
                  >
                    <ThemeLivePreview spec={t} compact />
                    <div>
                      <p className="text-xs font-semibold">{t.name}</p>
                      <p className="text-[11px] text-[var(--gj-text-muted)]">{t.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Daily Mission Customization */}
        <section className="lg:col-span-6 rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-4">
          <h2 className="font-display text-2xl font-semibold">Daily Mission Preferences</h2>
          <div>
            <label htmlFor="settings-daily-target" className="block text-xs font-medium mb-1">
              Daily Verse Target: <span className="font-mono-num">{bundle.preferences.dailyVerseTarget} verses/day</span>
            </label>
            <input
              id="settings-daily-target"
              type="range"
              min={1}
              max={25}
              value={bundle.preferences.dailyVerseTarget}
              onChange={(e) => void updatePreferences({ dailyVerseTarget: Number(e.target.value) })}
              className="w-full accent-[var(--gj-accent)]"
            />
          </div>

          <div>
            <label htmlFor="settings-mission-mode" className="block text-xs font-medium mb-1">
              Mission Requirements
            </label>
            <select
              id="settings-mission-mode"
              value={bundle.preferences.missionMode}
              onChange={(e) =>
                void updatePreferences({ missionMode: e.target.value as MissionMode })
              }
              className="w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2 text-sm"
            >
              <option value="reading_only">Reading Only</option>
              <option value="reading_purport">Reading + Purport</option>
              <option value="reading_quiz">Reading + Play & Learn Quiz</option>
              <option value="reading_reflection">Reading + Reflection Note</option>
              <option value="reading_audio">Reading + Authorized Audio (when available)</option>
              <option value="custom">Custom Combination</option>
            </select>
          </div>

          {bundle.preferences.missionMode === 'custom' && (
            <div className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-bg)] p-3.5 space-y-2 text-xs">
              <p className="font-medium text-[var(--gj-text)]">Custom Mission Requirements</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['requirePurport', 'Include Purport'],
                    ['requireQuiz', 'Include Quiz'],
                    ['requireReflection', 'Include Reflection'],
                    ['requireAudio', 'Include Audio (when available)'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="inline-flex items-center gap-2 cursor-pointer text-[var(--gj-text-muted)]">
                    <input
                      type="checkbox"
                      checked={Boolean(bundle.preferences.missionCustomRules?.[key])}
                      onChange={(e) =>
                        void updatePreferences({
                          missionCustomRules: {
                            ...(bundle.preferences.missionCustomRules || {}),
                            [key]: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <h3 className="text-xs font-medium text-[var(--gj-text-muted)] mb-2">
              7-Day Suggested Schedule
            </h3>
            <div className="space-y-1.5 text-xs">
              {bundle.schedule.previewDays.slice(0, 4).map((d) => (
                <div
                  key={d.dayOffset}
                  className="flex items-center justify-between rounded-lg bg-[var(--gj-bg)] border border-[var(--gj-border)] px-3 py-2"
                >
                  <span>{d.dayOffset === 0 ? 'Today' : `Day +${d.dayOffset}`}</span>
                  <span className="font-mono-num">{d.rangeLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Reminders & Notification Consent */}
      {notifForm && (
        <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5 text-[var(--gj-accent)]" aria-hidden="true" />
                <span>Reminders & Quiet Hours</span>
              </h2>
              <p className="text-xs text-[var(--gj-text-muted)] mt-1">
                In-app reminders work immediately. Browser notifications require browser permission;
                email reminders require SMTP/Resend configuration on the server.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void runReminderCheck()}
              className="rounded-lg border border-[var(--gj-border)] px-3.5 py-2 text-xs font-medium hover:bg-[var(--gj-surface-subtle)]"
            >
              Test Reminder Dispatch
            </button>
          </div>

          <form onSubmit={(e) => void saveNotifications(e)} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-2">
              <p className="font-semibold text-[var(--gj-text)]">Channels</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifForm.inAppEnabled}
                  onChange={(e) => setNotifForm({ ...notifForm, inAppEnabled: e.target.checked })}
                />
                <span>In-app notification center</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifForm.browserPushEnabled}
                  onChange={(e) =>
                    setNotifForm({ ...notifForm, browserPushEnabled: e.target.checked })
                  }
                />
                <span>Browser notifications</span>
              </label>
              <button
                type="button"
                onClick={() => void testBrowserPushPermission()}
                className="text-[var(--gj-accent)] hover:underline block"
              >
                Request browser permission
              </button>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifForm.emailEnabled}
                  onChange={(e) => setNotifForm({ ...notifForm, emailEnabled: e.target.checked })}
                />
                <span>Email reminders (requires SMTP/Resend env)</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-[var(--gj-text)]">
                Frequency & Timezone
              </label>
              <select
                aria-label="Reminder frequency"
                value={notifForm.frequency}
                onChange={(e) =>
                  setNotifForm({
                    ...notifForm,
                    frequency: e.target.value as typeof notifForm.frequency,
                  })
                }
                className="w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-2.5 py-2"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays only</option>
                <option value="weekly">Weekly summary</option>
                <option value="paused">Paused (opt-out)</option>
              </select>
              <input
                type="text"
                aria-label="Timezone"
                value={notifForm.timezone}
                onChange={(e) => setNotifForm({ ...notifForm, timezone: e.target.value })}
                placeholder="America/Los_Angeles"
                className="w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-2.5 py-2"
              />
            </div>

            <div className="space-y-2">
              <span className="block font-semibold text-[var(--gj-text)]">
                Preferred Times & Quiet Hours
              </span>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  Morning
                  <input
                    type="time"
                    value={notifForm.morningTime}
                    onChange={(e) => setNotifForm({ ...notifForm, morningTime: e.target.value })}
                    className="mt-1 w-full rounded border border-[var(--gj-border)] bg-[var(--gj-bg)] px-2 py-1"
                  />
                </label>
                <label className="block">
                  Evening
                  <input
                    type="time"
                    value={notifForm.eveningTime || ''}
                    onChange={(e) =>
                      setNotifForm({ ...notifForm, eveningTime: e.target.value || null })
                    }
                    className="mt-1 w-full rounded border border-[var(--gj-border)] bg-[var(--gj-bg)] px-2 py-1"
                  />
                </label>
                <label className="block">
                  Quiet Start
                  <input
                    type="time"
                    value={notifForm.quietHoursStart}
                    onChange={(e) =>
                      setNotifForm({ ...notifForm, quietHoursStart: e.target.value })
                    }
                    className="mt-1 w-full rounded border border-[var(--gj-border)] bg-[var(--gj-bg)] px-2 py-1"
                  />
                </label>
                <label className="block">
                  Quiet End
                  <input
                    type="time"
                    value={notifForm.quietHoursEnd}
                    onChange={(e) => setNotifForm({ ...notifForm, quietHoursEnd: e.target.value })}
                    className="mt-1 w-full rounded border border-[var(--gj-border)] bg-[var(--gj-bg)] px-2 py-1"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-lg bg-[var(--gj-accent)] px-4 py-2 text-xs font-medium text-[var(--gj-accent-text)]"
              >
                Save Reminder Settings
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Bookmarks & Reflections Archive */}
      <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-4">
        <h2 className="font-display text-2xl font-semibold">Saved Bookmarks & Reflections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <h3 className="font-semibold mb-2">Bookmarks ({bundle.bookmarks.length})</h3>
            {bundle.bookmarks.length === 0 ? (
              <p className="text-[var(--gj-text-muted)]">No bookmarks saved yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {bundle.bookmarks.map((bm) => {
                  const [ch, v] = bm.verseCode.split('.').map(Number);
                  return (
                    <li key={bm.verseCode} className="flex items-center justify-between border-b border-[var(--gj-border)] pb-1.5">
                      <span className="font-mono-num">Bg. {bm.verseCode}</span>
                      <button
                        type="button"
                        onClick={() => openReaderAt(ch, v)}
                        className="text-[var(--gj-accent)] hover:underline"
                      >
                        Open verse
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div>
            <h3 className="font-semibold mb-2">Reflections ({bundle.reflections.length})</h3>
            {bundle.reflections.length === 0 ? (
              <p className="text-[var(--gj-text-muted)]">No personal reflections written yet.</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {bundle.reflections.map((r) => (
                  <li key={r.id} className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] p-2.5">
                    <span className="font-mono-num font-semibold">Bg. {r.verseCode}</span>
                    <p className="mt-1 text-[var(--gj-text-muted)] whitespace-pre-line">{r.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Security, Sessions, Export & Deletion */}
      <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-5">
        <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--gj-accent)]" aria-hidden="true" />
          <span>Data Export, Sessions & Privacy</span>
        </h2>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--gj-border)] px-4 py-2 text-xs font-medium hover:bg-[var(--gj-surface-subtle)]"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export My Data (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setLegalModal('privacy')}
            className="rounded-lg border border-[var(--gj-border)] px-4 py-2 text-xs font-medium hover:bg-[var(--gj-surface-subtle)]"
          >
            Privacy Policy
          </button>

          <button
            type="button"
            onClick={() => setLegalModal('terms')}
            className="rounded-lg border border-[var(--gj-border)] px-4 py-2 text-xs font-medium hover:bg-[var(--gj-surface-subtle)]"
          >
            Terms & Attribution
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--gj-border)] px-4 py-2 text-xs font-medium hover:bg-[var(--gj-surface-subtle)]"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>{bundle.isGuest ? 'Exit Guest Mode' : 'Sign Out'}</span>
          </button>
        </div>

        {!bundle.isGuest && sessions.length > 0 && (
          <div className="pt-4 border-t border-[var(--gj-border)] space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold">Active Sessions</h3>
              <button
                type="button"
                onClick={() => void revokeSession('others')}
                className="text-xs text-[var(--gj-accent)] hover:underline"
              >
                Sign out other devices
              </button>
            </div>
            <div className="space-y-1.5 text-xs">
              {sessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
                >
                  <div className="truncate">
                    <span className="font-medium">
                      {s.id === currentSessionId ? 'Current Session' : 'Session'}
                    </span>
                    <span className="text-[var(--gj-text-muted)] ml-2 truncate">
                      {s.userAgent} · {s.revokedAt ? 'Revoked' : 'Active'}
                    </span>
                  </div>
                  {!s.revokedAt && s.id !== currentSessionId && (
                    <button
                      type="button"
                      onClick={() => void revokeSession(s.id)}
                      className="text-[var(--gj-danger)] hover:underline shrink-0"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!bundle.isGuest && (
          <form
            onSubmit={(e) => void handleDeleteAccount(e)}
            className="pt-4 border-t border-[var(--gj-border)] space-y-2"
          >
            <h3 className="text-xs font-semibold text-[var(--gj-danger)] flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Delete Account Permanently</span>
            </h3>
            <p className="text-xs text-[var(--gj-text-muted)]">
              Type your account email (<strong>{bundle.user?.email}</strong>) to permanently erase
              your account, reading history, reflections, and preferences.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md">
              <input
                type="email"
                required
                aria-label="Confirm email for account deletion"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                placeholder={bundle.user?.email}
                className="flex-1 rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="rounded-lg bg-[var(--gj-danger)] px-4 py-2 text-xs font-medium text-white"
              >
                Delete Account
              </button>
            </div>
          </form>
        )}
      </section>

      {legalModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setLegalModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-2xl font-semibold">
              {legalModal === 'privacy' ? 'Privacy Policy' : 'Terms & Scripture Attribution'}
            </h3>
            <p className="text-xs text-[var(--gj-text-muted)] leading-relaxed">
              {legalModal === 'privacy'
                ? 'Gītā Journey stores only the minimal data required to save your reading progress, bookmarks, reflections, and reminder preferences. Passwords are salted and hashed with scrypt, sessions use HttpOnly cookies, and you may export or permanently delete all personal records at any time.'
                : 'Bhagavad-gītā As It Is is authored by His Divine Grace A.C. Bhaktivedanta Swami Śrīla Prabhupāda and published by the Bhaktivedanta Book Trust International. Without an imported content license, this application links directly to verified Vedabase.io pages and never fabricates scripture.'}
            </p>
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              className="rounded-lg bg-[var(--gj-accent)] px-4 py-2 text-xs font-medium text-[var(--gj-accent-text)]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
