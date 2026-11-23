import React, { useEffect } from 'react';
import { JourneyProvider, useJourney } from './context/JourneyContext.tsx';
import { AppShell } from './components/AppShell.tsx';
import { AuthOnboardingModal } from './components/AuthOnboardingModal.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { HomeDashboard } from './pages/HomeDashboard.tsx';
import { AdventureMapPage } from './pages/AdventureMapPage.tsx';
import { ReadingRoomPage } from './pages/ReadingRoomPage.tsx';
import { QuestsPage } from './pages/QuestsPage.tsx';
import { PlayLearnPage } from './pages/PlayLearnPage.tsx';
import { SkillTreePage } from './pages/SkillTreePage.tsx';
import { GardenPage } from './pages/GardenPage.tsx';
import { AchievementsPage, ProgressPage } from './pages/AchievementsProgressPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--gj-bg)] text-[var(--gj-text)]">
          <div className="max-w-md rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-3">
            <h1 className="font-display text-2xl font-semibold">Something interrupted rendering</h1>
            <p className="text-sm text-[var(--gj-text-muted)]">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[var(--gj-accent)] px-4 py-2 text-xs font-medium text-[var(--gj-accent-text)]"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const WorkspaceRouter: React.FC = () => {
  const { bundle, loading, error, activeNav } = useJourney();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeNav]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--gj-bg)] text-[var(--gj-text)]">
        <div className="text-center space-y-2">
          <p className="font-display text-3xl font-semibold">GĪTĀ JOURNEY</p>
          <p className="text-xs text-[var(--gj-text-muted)]">Preparing your reading sanctuary...</p>
        </div>
      </div>
    );
  }

  if (error && !bundle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--gj-bg)]">
        <div className="max-w-md rounded-2xl border border-[var(--gj-border)] bg-[var(--gj-surface)] p-6 space-y-3 text-center">
          <p className="text-sm text-[var(--gj-danger)]">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[var(--gj-accent)] px-4 py-2 text-xs font-medium text-[var(--gj-accent-text)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <>
        <LandingPage />
        <AuthOnboardingModal />
      </>
    );
  }

  const renderSection = () => {
    switch (activeNav) {
      case 'home':
        return <HomeDashboard />;
      case 'map':
        return <AdventureMapPage />;
      case 'reading':
        return <ReadingRoomPage />;
      case 'quests':
        return <QuestsPage />;
      case 'play':
        return <PlayLearnPage />;
      case 'skills':
        return <SkillTreePage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'garden':
        return <GardenPage />;
      case 'progress':
        return <ProgressPage />;
      case 'settings':
        return <SettingsPage />;
      case 'admin':
        return <AdminDashboardPage />;
      default:
        return <HomeDashboard />;
    }
  };

  return (
    <>
      <AppShell>{renderSection()}</AppShell>
      <AuthOnboardingModal />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <JourneyProvider>
        <WorkspaceRouter />
      </JourneyProvider>
    </ErrorBoundary>
  );
}
