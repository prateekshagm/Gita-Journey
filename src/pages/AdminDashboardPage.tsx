import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';
import { SUPPORTED_LANGUAGES } from '../shared/languages.ts';

export const AdminDashboardPage: React.FC = () => {
  const { bundle } = useJourney();
  const [overview, setOverview] = useState<{
    metrics: Record<string, number>;
    xpRules: Array<{ code: string; label: string; xpAmount: number; active: boolean }>;
    notificationTemplates: Array<{ code: string; category: string; titleTemplate: string; bodyTemplate: string }>;
    auditLogs: Array<{ id: number; actorEmail: string; action: string; targetType: string; targetId: string; createdAt: string }>;
  } | null>(null);
  const [users, setUsers] = useState<
    Array<{ id: number; email: string; displayName: string; role: string; authProvider: string }>
  >([]);
  const [importForm, setImportForm] = useState({
    verseCode: '1.1',
    language: 'en',
    edition: 'Bhagavad-gītā As It Is (Authorized Import)',
    sourceAttribution: 'Bhaktivedanta Book Trust International',
    licenseStatus: 'source_linked' as 'source_linked' | 'authorized_public_excerpt' | 'licensed_full',
    licenseReference: '',
    editorialVerified: false,
    devanagari: '',
    transliteration: '',
    translation: '',
    purport: '',
    editorialNote: '',
  });
  const [quizForm, setQuizForm] = useState({
    chapterNumber: 1,
    mode: 'comprehension',
    prompt: '',
    option0: '',
    option1: '',
    option2: '',
    option3: '',
    correctIndex: 0,
    explanation: '',
    sourceReference: 'Bg. 1.1 · https://vedabase.io/en/library/bg/1/1/',
  });
  const [msg, setMsg] = useState<string | null>(null);

  const loadAdmin = async () => {
    const res = await fetch('/api/admin/overview', { credentials: 'include' });
    if (res.ok) {
      setOverview(await res.json());
    }
    if (bundle?.user?.role === 'system_admin') {
      const uRes = await fetch('/api/admin/users', { credentials: 'include' });
      if (uRes.ok) {
        const d = await uRes.json();
        setUsers(d.users || []);
      }
    }
  };

  useEffect(() => {
    if (bundle?.user?.role === 'content_editor' || bundle?.user?.role === 'system_admin') {
      void loadAdmin();
    }
  }, [bundle?.user?.role]);

  if (!bundle?.user || (bundle.user.role !== 'content_editor' && bundle.user.role !== 'system_admin')) {
    return (
      <div className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-8 text-center space-y-3">
        <ShieldAlert className="w-8 h-8 mx-auto text-[var(--gj-warning)]" aria-hidden="true" />
        <h1 className="font-display text-2xl font-semibold">Restricted Access</h1>
        <p className="text-sm text-[var(--gj-text-muted)] max-w-md mx-auto">
          The Admin Console requires a Content Editor or System Administrator role. Admins cannot
          silently alter user reading histories, and all privileged actions are logged.
        </p>
      </div>
    );
  }

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/admin/content/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(importForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Import failed');
      return;
    }
    setMsg(`Saved licensed content entry for Bg. ${importForm.verseCode}.`);
    await loadAdmin();
  };

  const handleQuizCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/admin/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        chapterNumber: quizForm.chapterNumber,
        mode: quizForm.mode,
        prompt: quizForm.prompt,
        options: [quizForm.option0, quizForm.option1, quizForm.option2, quizForm.option3].filter(
          Boolean
        ),
        correctIndex: quizForm.correctIndex,
        explanation: quizForm.explanation,
        sourceReference: quizForm.sourceReference,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Quiz creation failed');
      return;
    }
    setMsg(`Created reviewed quiz question #${data.quiz.id}.`);
    await loadAdmin();
  };

  const handleRoleChange = async (userId: number, role: string) => {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setMsg('Updated user role and recorded audit log.');
      await loadAdmin();
    }
  };

  const handleXpRuleUpdate = async (code: string, xpAmount: number) => {
    const res = await fetch(`/api/admin/xp-rules/${encodeURIComponent(code)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ xpAmount }),
    });
    if (res.ok) {
      setMsg(`Updated XP rule ${code} to ${xpAmount} XP.`);
      await loadAdmin();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-[var(--gj-text-muted)] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--gj-accent)]" aria-hidden="true" />
          <span>Role: {bundle.user.role} · Audited Administration</span>
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold mt-1">
          Admin & Content Governance
        </h1>
      </div>

      {msg && (
        <div role="status" className="rounded-xl border border-[var(--gj-accent)]/40 bg-[var(--gj-accent-soft)] px-4 py-3 text-sm">
          {msg}
        </div>
      )}

      {overview && (
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(overview.metrics).map(([k, val]) => (
            <div key={k} className="rounded-xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-4">
              <p className="text-[11px] text-[var(--gj-text-muted)] capitalize">
                {k.replace(/([A-Z])/g, ' $1')}
              </p>
              <p className="font-mono-num text-2xl font-semibold mt-1">{val}</p>
            </div>
          ))}
        </section>
      )}

      {/* Authorized Content Import Pipeline */}
      <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          Authorized Scripture Content Import Pipeline
        </h2>
        <p className="text-xs text-[var(--gj-text-muted)]">
          Import verified scripture text only when you hold BBT or rights-holder permission.
          Unlicensed entries must remain <code>source_linked</code>.
        </p>

        <form onSubmit={(e) => void handleImportSubmit(e)} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <label className="block">
            Verse Code (e.g. 1.1)
            <input
              type="text"
              required
              value={importForm.verseCode}
              onChange={(e) => setImportForm({ ...importForm, verseCode: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
            />
          </label>
          <label className="block">
            Language
            <select
              value={importForm.language}
              onChange={(e) => setImportForm({ ...importForm, language: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
            >
              {SUPPORTED_LANGUAGES.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label} ({opt.nativeLabel})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            License Status
            <select
              value={importForm.licenseStatus}
              onChange={(e) =>
                setImportForm({
                  ...importForm,
                  licenseStatus: e.target.value as typeof importForm.licenseStatus,
                })
              }
              className="mt-1 w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
            >
              <option value="source_linked">Source Linked (Vedabase URL)</option>
              <option value="authorized_public_excerpt">Authorized Excerpt</option>
              <option value="licensed_full">Licensed Full Text</option>
            </select>
          </label>
          <label className="block">
            Edition
            <input
              type="text"
              required
              value={importForm.edition}
              onChange={(e) => setImportForm({ ...importForm, edition: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
            />
          </label>
          <label className="block md:col-span-2">
            Source Attribution / License Ref
            <input
              type="text"
              required
              value={importForm.sourceAttribution}
              onChange={(e) => setImportForm({ ...importForm, sourceAttribution: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
            />
          </label>
          <label className="block md:col-span-2">
            Translation (optional unless licensed)
            <textarea
              rows={2}
              value={importForm.translation}
              onChange={(e) => setImportForm({ ...importForm, translation: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
            />
          </label>
          <label className="block md:col-span-2">
            Full Purport (optional unless licensed)
            <textarea
              rows={3}
              value={importForm.purport}
              onChange={(e) => setImportForm({ ...importForm, purport: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 md:col-span-2 cursor-pointer">
            <input
              type="checkbox"
              checked={importForm.editorialVerified}
              onChange={(e) =>
                setImportForm({ ...importForm, editorialVerified: e.target.checked })
              }
            />
            <span>Mark as editorially verified against canonical print edition</span>
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--gj-accent)] px-5 py-2.5 text-xs font-medium text-[var(--gj-accent-text)]"
            >
              Save Content Record
            </button>
          </div>
        </form>
      </section>

      {/* Quiz Authoring */}
      <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-4">
        <h2 className="font-display text-2xl font-semibold">Add Reviewed Quiz Question</h2>
        <form onSubmit={(e) => void handleQuizCreate(e)} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <label className="block">
            Chapter (1–18)
            <input
              type="number"
              min={1}
              max={18}
              value={quizForm.chapterNumber}
              onChange={(e) => setQuizForm({ ...quizForm, chapterNumber: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
            />
          </label>
          <label className="block">
            Mode
            <select
              value={quizForm.mode}
              onChange={(e) => setQuizForm({ ...quizForm, mode: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
            >
              <option value="comprehension">Comprehension</option>
              <option value="vocabulary">Sanskrit Vocabulary</option>
              <option value="missing_word">Missing Word</option>
              <option value="chapter_recap">Chapter Recap</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            Prompt
            <input
              type="text"
              required
              value={quizForm.prompt}
              onChange={(e) => setQuizForm({ ...quizForm, prompt: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
            />
          </label>
          <input
            type="text"
            required
            placeholder="Option 1"
            value={quizForm.option0}
            onChange={(e) => setQuizForm({ ...quizForm, option0: e.target.value })}
            className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
          />
          <input
            type="text"
            required
            placeholder="Option 2"
            value={quizForm.option1}
            onChange={(e) => setQuizForm({ ...quizForm, option1: e.target.value })}
            className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
          />
          <input
            type="text"
            placeholder="Option 3"
            value={quizForm.option2}
            onChange={(e) => setQuizForm({ ...quizForm, option2: e.target.value })}
            className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
          />
          <input
            type="text"
            placeholder="Option 4"
            value={quizForm.option3}
            onChange={(e) => setQuizForm({ ...quizForm, option3: e.target.value })}
            className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
          />
          <label className="block">
            Source Reference (Vedabase)
            <input
              type="text"
              required
              value={quizForm.sourceReference}
              onChange={(e) => setQuizForm({ ...quizForm, sourceReference: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
            />
          </label>
          <label className="block">
            Explanation
            <input
              type="text"
              required
              value={quizForm.explanation}
              onChange={(e) => setQuizForm({ ...quizForm, explanation: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] px-3 py-2"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-[var(--gj-accent)] px-5 py-2 text-xs font-medium text-[var(--gj-accent-text)]"
            >
              Publish Reviewed Quiz
            </button>
          </div>
        </form>
      </section>

      {/* System Admin Sections */}
      {bundle.user.role === 'system_admin' && overview && (
        <>
          <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold">XP Reward Configuration</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {overview.xpRules.map((r) => (
                <div key={r.code} className="rounded-lg border border-[var(--gj-border)] bg-[var(--gj-bg)] p-3 flex items-center justify-between gap-2">
                  <span>{r.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    defaultValue={r.xpAmount}
                    onBlur={(e) => void handleXpRuleUpdate(r.code, Number(e.target.value))}
                    className="w-20 rounded border border-[var(--gj-border)] bg-[var(--gj-surface)] px-2 py-1 font-mono-num text-right"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-4">
            <h2 className="font-display text-2xl font-semibold">User Role Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--gj-border)] text-[var(--gj-text-muted)]">
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--gj-border)]">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 pr-4 font-medium">{u.displayName}</td>
                      <td className="py-2.5 pr-4">{u.email}</td>
                      <td className="py-2.5 pr-4">
                        <select
                          aria-label={`Role for ${u.email}`}
                          value={u.role}
                          onChange={(e) => void handleRoleChange(u.id, e.target.value)}
                          className="rounded border border-[var(--gj-border)] bg-[var(--gj-bg)] px-2 py-1"
                        >
                          <option value="reader">reader</option>
                          <option value="content_editor">content_editor</option>
                          <option value="system_admin">system_admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Audit Logs */}
      {overview && (
        <section className="rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-3">
          <h2 className="font-display text-2xl font-semibold">Admin Audit Logs</h2>
          {overview.auditLogs.length === 0 ? (
            <p className="text-xs text-[var(--gj-text-muted)]">No admin audit events recorded yet.</p>
          ) : (
            <div className="space-y-1.5 text-xs max-h-64 overflow-y-auto">
              {overview.auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b border-[var(--gj-border)] pb-1.5">
                  <span>
                    <strong>{log.actorEmail}</strong> · {log.action} ({log.targetType}: {log.targetId})
                  </span>
                  <span className="text-[var(--gj-text-muted)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
