import React, { useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Compass,
  Flower2,
  Gamepad2,
  GitBranch,
  Home,
  Menu,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WifiOff,
  X,
} from 'lucide-react';
import { useJourney } from '../context/JourneyContext.tsx';
import { useOnlineStatus } from '../hooks/usePWAInstall.ts';
import type { NavSection } from '../types/journey.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';

const PRIMARY_NAV: Array<{ id: NavSection; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'map', label: 'Adventure Map', icon: Compass },
  { id: 'reading', label: 'My Reading', icon: BookOpen },
  { id: 'quests', label: 'Quests', icon: ScrollText },
  { id: 'play', label: 'Play & Learn', icon: Gamepad2 },
  { id: 'skills', label: 'Skill Tree', icon: GitBranch },
  { id: 'garden', label: 'My Garden', icon: Flower2 },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'progress', label: 'My Progress', icon: TrendingUp },
  { id: 'settings', label: 'Profile & Settings', icon: Settings },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    bundle,
    activeNav,
    setActiveNav,
    openAuthModal,
    refreshState,
    toast,
    clearToast,
    celebration,
    clearCelebration,
  } = useJourney();
  const isOnline = useOnlineStatus();
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminOrEditor =
    bundle?.user?.role === 'content_editor' || bundle?.user?.role === 'system_admin';

  const unreadCount = (bundle?.notifications || []).filter((n) => n.status === 'delivered').length;
  const readyQuestCount = (bundle?.quests || []).filter((q) => q.status === 'ready_to_claim').length;
  const readySkillCount = (bundle?.skillTree || []).filter((s) => s.status === 'ready').length;

  const markAllRead = async () => {
    if (bundle?.isGuest) {
      setNotifOpen(false);
      return;
    }
    await fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' });
    await refreshState();
  };

  const navItems = isAdminOrEditor
    ? [...PRIMARY_NAV, { id: 'admin' as NavSection, label: 'Admin Console', icon: ShieldCheck }]
    : PRIMARY_NAV;

  const mobileTabs = PRIMARY_NAV.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--gj-bg)] text-[var(--gj-text)]">
      {/* Desktop Sidebar */}
      <aside
        aria-label="Primary navigation"
        className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-[var(--gj-border)] bg-[var(--gj-surface)]"
      >
        <div className="px-6 py-6 border-b border-[var(--gj-border)]">
          <button
            type="button"
            onClick={() => setActiveNav('home')}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gj-accent)] rounded"
          >
            <span className="font-display text-2xl font-semibold tracking-tight text-[var(--gj-text)] block whitespace-nowrap">
              GĪTĀ JOURNEY
            </span>
            <span className="text-xs text-[var(--gj-text-muted)] block mt-0.5">
              The Path of 700 Verses
            </span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            const badgeCount =
              item.id === 'quests' ? readyQuestCount : item.id === 'skills' ? readySkillCount : 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap min-h-[42px] ${
                  active
                    ? 'bg-[var(--gj-accent)] text-[var(--gj-accent-text)]'
                    : 'text-[var(--gj-text-muted)] hover:bg-[var(--gj-surface-subtle)] hover:text-[var(--gj-text)]'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {badgeCount > 0 && (
                  <span
                    className={`font-mono-num text-[11px] shrink-0 ${
                      active ? 'text-[var(--gj-accent-text)]' : 'text-[var(--gj-accent)]'
                    }`}
                  >
                    {badgeCount} ready
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--gj-border)] space-y-3">
          {bundle?.isGuest ? (
            <div className="rounded-lg bg-[var(--gj-surface-subtle)] p-3 border border-[var(--gj-border)]">
              <p className="text-xs font-medium text-[var(--gj-text)]">Guest Mode</p>
              <p className="text-xs text-[var(--gj-text-muted)] mt-1">
                Save your {bundle.stats.completedVersesCount}{' '}
                {bundle.stats.completedVersesCount === 1 ? 'verse' : 'verses'} permanently by creating an account.
              </p>
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="mt-2.5 w-full rounded-lg bg-[var(--gj-accent)] px-3 py-2 text-xs font-medium text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)] transition-colors"
              >
                Save Progress & Sign Up
              </button>
            </div>
          ) : (
            <div className="text-xs text-[var(--gj-text-muted)] px-1">
              <p className="font-medium text-[var(--gj-text)] truncate">{bundle?.user?.displayName}</p>
              <p className="truncate mt-0.5">
                {bundle?.stats.level.name} · <span className="font-mono-num">{bundle?.stats.totalXp} XP</span>
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pb-16 lg:pb-0">
        {/* Top Utility Header */}
        <header className="sticky top-0 z-30 h-14 border-b border-[var(--gj-border)] bg-[var(--gj-surface)]/95 backdrop-blur-sm px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="lg:hidden font-display text-xl font-semibold tracking-tight text-[var(--gj-text)] whitespace-nowrap">
              GĪTĀ JOURNEY
            </span>
            <span className="hidden lg:inline text-sm text-[var(--gj-text-muted)] truncate">
              {navItems.find((i) => i.id === activeNav)?.label}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isOnline && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--gj-warning)] px-2 py-1">
                <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Offline</span>
              </span>
            )}

            <PWAInstallButton compact />

            <div className="relative">
              <button
                type="button"
                aria-label={`Notifications (${unreadCount} unread)`}
                aria-expanded={notifOpen}
                onClick={() => setNotifOpen((o) => !o)}
                className="relative inline-flex items-center justify-center rounded-lg border border-[var(--gj-border)] bg-[var(--gj-surface)] w-10 h-10 text-[var(--gj-text)] hover:bg-[var(--gj-surface-subtle)] transition-colors"
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--gj-accent)] text-[var(--gj-accent-text)] text-[10px] font-mono-num flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  role="dialog"
                  aria-label="Notification center"
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[var(--gj-border)] bg-[var(--gj-surface)] shadow-xl z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gj-border)]">
                    <h2 className="text-sm font-semibold text-[var(--gj-text)]">Notifications</h2>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && !bundle?.isGuest && (
                        <button
                          type="button"
                          onClick={() => void markAllRead()}
                          className="text-xs font-medium text-[var(--gj-accent)] hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label="Close notifications"
                        onClick={() => setNotifOpen(false)}
                        className="p-1 text-[var(--gj-text-muted)] hover:text-[var(--gj-text)]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[var(--gj-border)]">
                    {(bundle?.notifications || []).length === 0 ? (
                      <p className="p-4 text-sm text-[var(--gj-text-muted)]">No notifications yet.</p>
                    ) : (
                      bundle?.notifications.map((n) => (
                        <div key={n.id} className="p-3.5 text-sm">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="font-medium text-[var(--gj-text)]">{n.title}</p>
                            <span className="text-[11px] text-[var(--gj-text-muted)] whitespace-nowrap">
                              {n.channel} · {n.status}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--gj-text-muted)] mt-1">{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {bundle?.isGuest && (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="inline-flex items-center rounded-lg bg-[var(--gj-accent)] px-3.5 py-2 text-xs font-medium text-[var(--gj-accent-text)] hover:bg-[var(--gj-accent-hover)] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {celebration && (
            <div
              role="status"
              aria-live="polite"
              className="gj-enter rounded-xl border border-[var(--gj-gold)]/50 bg-[var(--gj-surface)] px-5 py-4 flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[var(--gj-gold)] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-display text-lg font-semibold text-[var(--gj-text)]">
                    {celebration.title}
                    {celebration.xp ? (
                      <span className="ml-2 font-mono-num text-xs text-[var(--gj-accent)]">
                        +{celebration.xp} XP
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-[var(--gj-text-muted)]">{celebration.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss celebration banner"
                onClick={clearCelebration}
                className="p-1.5 rounded-lg text-[var(--gj-text-muted)] hover:bg-[var(--gj-surface-subtle)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (height 60px <= 15% cap on 844px) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-[60px] border-t border-[var(--gj-border)] bg-[var(--gj-surface)]/95 backdrop-blur-md grid grid-cols-5 items-center"
      >
        {mobileTabs.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveNav(item.id);
                setMobileMenuOpen(false);
              }}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center h-full min-w-[44px] ${
                active ? 'text-[var(--gj-accent)] font-semibold' : 'text-[var(--gj-text-muted)]'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] mt-0.5 truncate max-w-[64px]">
                {item.label.replace('My ', '').replace('Adventure ', '')}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-expanded={mobileMenuOpen}
          aria-label="Open all sections menu"
          className="flex flex-col items-center justify-center h-full min-w-[44px] text-[var(--gj-text-muted)]"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>

      {/* Mobile More Sheet */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="All navigation sections"
          className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-end"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-[var(--gj-surface)] border-t border-[var(--gj-border)] p-5 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[var(--gj-border)]">
              <span className="font-display text-lg font-semibold">All Sections</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveNav(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-left text-sm min-h-[44px] ${
                      active
                        ? 'bg-[var(--gj-accent)] text-[var(--gj-accent-text)] border-[var(--gj-accent)]'
                        : 'border-[var(--gj-border)] text-[var(--gj-text)]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 max-w-sm rounded-xl border border-[var(--gj-border)] bg-[var(--gj-surface)] px-4 py-3 shadow-lg flex items-center justify-between gap-3"
        >
          <p className="text-sm text-[var(--gj-text)]">{toast}</p>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={clearToast}
            className="text-[var(--gj-text-muted)] hover:text-[var(--gj-text)] p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
