import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import {
  ACHIEVEMENT_SEEDS,
  GARDEN_CATALOG,
  GARDEN_ENVIRONMENTS,
  GITA_CHAPTERS,
  QUEST_CATALOG,
  SANSKRIT_MATCH_SETS,
  SKILL_TREE_NODES,
  TOTAL_GITA_VERSES,
  VERIFIED_QUIZ_SEEDS,
  VERSE_ORDER_CHALLENGES,
  XP_RULE_SEEDS,
} from '../shared/gitaData.ts';
import {
  calculateConsistencyStats,
  calculateLevel,
  computeChapterStates,
  detectWelcomeBackGapDays,
  evaluateQuestStates,
  evaluateSkillTreeStates,
  generateReadingSchedule,
  isChapterUnlockedForUser,
  MissionMode,
  resolveMissionRequirements,
  ThemeId,
  validateVerseCode,
} from '../shared/progression.ts';
import {
  appendPointToReflectionNote,
  formatHighlightReflectionNote,
} from '../shared/reflectionHelpers.ts';
import type { JourneyBundle, NavSection, UserPreferencesState } from '../types/journey.ts';

const GUEST_STORAGE_KEY = 'gj_guest_state_v1';

interface GuestStoredData {
  active: boolean;
  displayName: string;
  preferences: UserPreferencesState;
  completedVerses: Array<{
    verseCode: string;
    chapterNumber: number;
    verseNumber: number;
    completedAt: string;
    evidenceType: string;
    purportRead: boolean;
  }>;
  xpTransactions: Array<{
    id: number;
    amount: number;
    reason: string;
    eventKey: string;
    createdAt: string;
  }>;
  bookmarks: Array<{ verseCode: string; folder: string; createdAt: string }>;
  highlights: Array<{ id: number; verseCode: string; color: string; excerpt: string; createdAt: string }>;
  reflections: Array<{ id: number; verseCode: string; note: string; createdAt: string }>;
  gardenItems: Array<{ itemCode: string; unlockedVia: string; placed: boolean; posX: number; posY: number; unlockedAt: string }>;
  earnedAchievements: Array<{ achievementCode: string; earnedAt: string }>;
  quizAttempts: Array<{ id: number; quizId: number; selectedIndex: number; isCorrect: boolean; nextReviewAt: string; attemptCount: number; createdAt: string }>;
  missionStatusToday: { date: string; status: 'active' | 'completed' | 'paused' | 'skipped' } | null;
  acceptedQuests?: string[];
  claimedQuests?: string[];
  unlockedSkills?: string[];
  completedChallenges?: string[];
}

function defaultPreferences(): UserPreferencesState {
  return {
    theme: 'krishna',
    language: 'en',
    dailyVerseTarget: 3,
    missionMode: 'reading_only',
    missionCustomRules: {},
    missionPaused: false,
    readerMode: 'light',
    fontSize: 18,
    versesPerView: 1,
    showSanskrit: true,
    showTransliteration: true,
    showTranslation: true,
    showPurport: true,
    lastChapter: 1,
    lastVerse: 1,
    selectedEnvironment: 'yamuna_sanctuary',
  };
}

function loadGuestData(): GuestStoredData | null {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestStoredData;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveGuestData(data: GuestStoredData | null) {
  if (!data) {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    return;
  }
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
}

function buildGuestBundle(guest: GuestStoredData): JourneyBundle {
  const todayIso = new Date().toISOString().slice(0, 10);
  const completedCodes = guest.completedVerses.map((v) => v.verseCode);
  const completedDates = guest.completedVerses.map((v) => v.completedAt.slice(0, 10));
  const totalXp = guest.xpTransactions.reduce((s, t) => s + t.amount, 0);
  const level = calculateLevel(totalXp, completedCodes.length);
  const chapterStates = computeChapterStates(completedCodes);
  const consistency = calculateConsistencyStats(completedDates, todayIso);
  const welcomeBackGapDays = detectWelcomeBackGapDays(completedDates, todayIso);
  const schedule = generateReadingSchedule(completedCodes, guest.preferences.dailyVerseTarget, 7);
  const todayCount = guest.completedVerses.filter((v) => v.completedAt.slice(0, 10) === todayIso).length;
  const reqs = resolveMissionRequirements(
    guest.preferences.missionMode,
    guest.preferences.missionCustomRules
  );

  const missionStatus =
    guest.missionStatusToday?.date === todayIso
      ? guest.missionStatusToday.status
      : guest.preferences.missionPaused
        ? 'paused'
        : todayCount >= guest.preferences.dailyVerseTarget
          ? 'completed'
          : 'active';

  const correctQuizIds = new Set<number>();
  const correctSanskritQuizIds = new Set<number>();
  for (const att of guest.quizAttempts) {
    if (att.isCorrect) {
      correctQuizIds.add(att.quizId);
      const seed = VERIFIED_QUIZ_SEEDS[(att.quizId - 1) % VERIFIED_QUIZ_SEEDS.length];
      if (seed && (seed.mode === 'vocabulary' || seed.mode === 'missing_word' || seed.mode === 'transliteration_order')) {
        correctSanskritQuizIds.add(att.quizId);
      }
    }
  }
  const completedChallenges = guest.completedChallenges || [];
  const purportCount = guest.completedVerses.filter((v) => v.purportRead).length;
  const activeChapter =
    chapterStates.find((c) => c.status === 'in_progress') ||
    chapterStates.find((c) => c.status === 'available') ||
    chapterStates[chapterStates.length - 1];

  const quests = evaluateQuestStates({
    todayVersesCompleted: todayCount,
    dailyVerseTarget: guest.preferences.dailyVerseTarget,
    purportReadCount: purportCount,
    bookmarksCount: guest.bookmarks.length,
    reflectionsCount: guest.reflections.length,
    sanskritCorrectCount: correctSanskritQuizIds.size + completedChallenges.length,
    wisdomCorrectCount: correctQuizIds.size + completedChallenges.length,
    activeChapterCompletedCount: activeChapter?.completedCount ?? 0,
    activeChapterVerseCount: activeChapter?.verseCount ?? 46,
    activeChapterNumber: activeChapter?.chapterNumber ?? 1,
    activeDaysCount: consistency.activeDaysCount,
    acceptedCodes: guest.acceptedQuests || [],
    claimedKeys: guest.claimedQuests || [],
    todayIso,
  });

  const completedChaptersCount = chapterStates.filter((c) => c.status === 'completed').length;
  const skillTree = evaluateSkillTreeStates({
    activeDays: consistency.activeDaysCount,
    memoryItems: guest.bookmarks.length + guest.reflections.length,
    sanskritCompleted: correctSanskritQuizIds.size + completedChallenges.length,
    understandingActions: purportCount + correctQuizIds.size,
    completedChapters: completedChaptersCount,
    unlockedCodes: guest.unlockedSkills || [],
  });

  return {
    user: null,
    isGuest: true,
    preferences: {
      selectedEnvironment: 'yamuna_sanctuary',
      ...guest.preferences,
    },
    stats: {
      totalXp,
      level,
      completedVersesCount: completedCodes.length,
      totalVerses: TOTAL_GITA_VERSES,
      completedChaptersCount,
      activeDaysCount: consistency.activeDaysCount,
      currentStreakDays: consistency.currentStreakDays,
    },
    welcomeBackGapDays,
    completedVerses: completedCodes,
    readingHistory: [...guest.completedVerses].reverse(),
    chapterStates,
    todayMission: {
      missionDate: todayIso,
      targetVerses: guest.preferences.dailyVerseTarget,
      completedVerses: todayCount,
      requirements: reqs,
      status: missionStatus,
      assignedRange: schedule.nextAssignedRange,
    },
    schedule,
    quests,
    skillTree,
    completedChallenges,
    xpTransactions: [...guest.xpTransactions].reverse(),
    xpRules: XP_RULE_SEEDS.map((r) => ({ ...r, active: true })),
    achievements: ACHIEVEMENT_SEEDS,
    earnedAchievements: guest.earnedAchievements,
    gardenItems: guest.gardenItems,
    bookmarks: guest.bookmarks,
    highlights: guest.highlights,
    reflections: guest.reflections,
    quizAttempts: guest.quizAttempts,
    notificationPreferences: {
      inAppEnabled: true,
      browserPushEnabled: false,
      emailEnabled: false,
      frequency: 'daily',
      morningTime: '07:00',
      eveningTime: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00',
      consentRecordedAt: null,
    },
    notifications: [
      {
        id: 1,
        channel: 'in_app',
        category: 'welcome_back',
        title: 'Guest Exploration Active',
        body: 'Your progress is saved locally in this browser. Create an account anytime to sync across devices.',
        status: 'delivered',
        readAt: null,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

interface JourneyContextValue {
  bundle: JourneyBundle | null;
  loading: boolean;
  error: string | null;
  toast: string | null;
  clearToast: () => void;
  celebration: { title: string; subtitle: string; xp?: number } | null;
  clearCelebration: () => void;
  activeNav: NavSection;
  setActiveNav: (nav: NavSection) => void;
  readingTarget: { chapter: number; verse: number };
  openReaderAt: (chapter: number, verse: number) => void;
  challengeFilterChapter: number | null;
  setChallengeFilterChapter: (chapter: number | null) => void;
  openChapterChallenge: (chapter: number) => void;
  showAuthModal: boolean;
  authModalMode: 'login' | 'register' | 'onboarding';
  openAuthModal: (mode: 'login' | 'register' | 'onboarding') => void;
  closeAuthModal: () => void;
  startGuestExploration: (prefs?: Partial<UserPreferencesState>) => void;
  registerAccount: (payload: {
    email: string;
    password: string;
    displayName: string;
    theme?: ThemeId;
    dailyVerseTarget?: number;
    notificationConsent?: boolean;
  }) => Promise<void>;
  loginAccount: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferencesState> & { displayName?: string }) => Promise<void>;
  completeVerse: (verseCode: string, options?: { purportRead?: boolean; evidenceType?: 'manual' | 'reflection' | 'quiz' }) => Promise<{
    unlockedNextChapter: number | null;
    xpAwarded: number;
    newlyEarnedAchievements: string[];
  }>;
  updateTodayMission: (action: 'pause' | 'resume' | 'skip' | 'update_target', targetVerses?: number) => Promise<void>;
  toggleBookmark: (verseCode: string) => Promise<void>;
  addHighlight: (
    verseCode: string,
    excerpt: string,
    color?: 'gold' | 'sky' | 'saffron' | 'rose',
    point?: string
  ) => Promise<void>;
  deleteHighlight: (id: number) => Promise<void>;
  saveReflection: (verseCode: string, note: string) => Promise<void>;
  addReflectionPoint: (reflectionId: number, point: string) => Promise<void>;
  submitQuizAttempt: (quizId: number, selectedIndex: number) => Promise<{
    isCorrect: boolean;
    correctIndex: number;
    explanation: string;
    sourceReference: string;
    xpAwarded: number;
  }>;
  acceptQuest: (questCode: string) => Promise<void>;
  claimQuestReward: (questCode: string) => Promise<{ xpAwarded: number }>;
  unlockSkillNode: (skillCode: string) => Promise<{ xpAwarded: number }>;
  completeInteractiveChallenge: (
    challengeType: 'sanskrit_match' | 'verse_order',
    challengeId: string,
    chapterNumber: number
  ) => Promise<{ xpAwarded: number }>;
  updateGardenItem: (itemCode: string, updates: { placed?: boolean; posX?: number; posY?: number }) => Promise<void>;
  refreshState: () => Promise<void>;
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bundle, setBundle] = useState<JourneyBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ title: string; subtitle: string; xp?: number } | null>(null);
  const [activeNav, setActiveNav] = useState<NavSection>('home');
  const [readingTarget, setReadingTarget] = useState<{ chapter: number; verse: number }>({
    chapter: 1,
    verse: 1,
  });
  const [challengeFilterChapter, setChallengeFilterChapter] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'onboarding'>('onboarding');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // Apply active theme to <html> data-theme attribute
  useEffect(() => {
    const theme = bundle?.preferences?.theme || 'krishna';
    document.documentElement.setAttribute('data-theme', theme);
  }, [bundle?.preferences?.theme]);

  const getGuestMigrationPayload = useCallback(() => {
    const guest = loadGuestData();
    if (!guest) return undefined;
    return {
      theme: guest.preferences.theme,
      language: guest.preferences.language,
      dailyVerseTarget: guest.preferences.dailyVerseTarget,
      missionMode: guest.preferences.missionMode,
      readerMode: guest.preferences.readerMode,
      fontSize: guest.preferences.fontSize,
      selectedEnvironment: guest.preferences.selectedEnvironment,
      completedVerses: guest.completedVerses.map((v) => v.verseCode),
      bookmarks: guest.bookmarks.map((b) => b.verseCode),
      reflections: guest.reflections.map((r) => ({ verseCode: r.verseCode, note: r.note })),
      acceptedQuests: guest.acceptedQuests || [],
      completedChallenges: guest.completedChallenges || [],
    };
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setBundle(data);
          setReadingTarget({
            chapter: data.preferences?.lastChapter || 1,
            verse: data.preferences?.lastVerse || 1,
          });
          setLoading(false);
          return;
        }
      }
      // Check local guest session or ?autostart=1
      const guest = loadGuestData();
      const params = new URLSearchParams(window.location.search);
      if (guest && guest.active) {
        const built = buildGuestBundle(guest);
        setBundle(built);
        setReadingTarget({
          chapter: built.preferences.lastChapter || 1,
          verse: built.preferences.lastVerse || 1,
        });
      } else if (params.get('autostart') === '1') {
        const initialGuest: GuestStoredData = {
          active: true,
          displayName: 'Guest Explorer',
          preferences: defaultPreferences(),
          completedVerses: [],
          xpTransactions: [],
          bookmarks: [],
          highlights: [],
          reflections: [],
          gardenItems: [],
          earnedAchievements: [],
          quizAttempts: [],
          missionStatusToday: null,
        };
        saveGuestData(initialGuest);
        setBundle(buildGuestBundle(initialGuest));
      } else {
        setBundle(null);
      }
    } catch (err) {
      console.error('State load error:', err);
      const guest = loadGuestData();
      if (guest && guest.active) {
        setBundle(buildGuestBundle(guest));
      } else {
        setError('Unable to reach server. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const startGuestExploration = useCallback((prefs?: Partial<UserPreferencesState>) => {
    const existing = loadGuestData();
    const guest: GuestStoredData = existing
      ? {
          ...existing,
          active: true,
          preferences: { ...existing.preferences, ...(prefs || {}) },
        }
      : {
          active: true,
          displayName: 'Guest Explorer',
          preferences: { ...defaultPreferences(), ...(prefs || {}) },
          completedVerses: [],
          xpTransactions: [],
          bookmarks: [],
          highlights: [],
          reflections: [],
          gardenItems: [],
          earnedAchievements: [],
          quizAttempts: [],
          missionStatusToday: null,
        };
    saveGuestData(guest);
    setBundle(buildGuestBundle(guest));
    setShowAuthModal(false);
    setActiveNav('home');
    showToast('Exploring as guest. Your progress is saved locally in this browser.');
  }, [showToast]);

  const registerAccount = useCallback(
    async (payload: {
      email: string;
      password: string;
      displayName: string;
      theme?: ThemeId;
      dailyVerseTarget?: number;
      notificationConsent?: boolean;
    }) => {
      const guestState = getGuestMigrationPayload();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...payload,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          guestState,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      saveGuestData(null);
      setBundle(data);
      setShowAuthModal(false);
      setActiveNav('home');
      showToast('Account created and progress synchronized.');
    },
    [getGuestMigrationPayload, showToast]
  );

  const loginAccount = useCallback(
    async (email: string, password: string) => {
      const guestState = getGuestMigrationPayload();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, guestState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sign-in failed');
      saveGuestData(null);
      setBundle(data);
      setShowAuthModal(false);
      setActiveNav('home');
      showToast('Signed in successfully.');
    },
    [getGuestMigrationPayload, showToast]
  );

  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    const idToken = await cred.user.getIdToken();
    const guestState = getGuestMigrationPayload();
    const res = await fetch('/api/auth/firebase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ idToken, guestState }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google sign-in failed');
    saveGuestData(null);
    setBundle(data);
    setShowAuthModal(false);
    setActiveNav('home');
    showToast('Signed in with Google.');
  }, [getGuestMigrationPayload, showToast]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      await firebaseSignOut(auth).catch(() => {});
    } finally {
      saveGuestData(null);
      setBundle(null);
      setActiveNav('home');
      showToast('Signed out.');
    }
  }, [showToast]);

  const updatePreferences = useCallback(
    async (updates: Partial<UserPreferencesState> & { displayName?: string }) => {
      if (!bundle) return;
      if (bundle.isGuest) {
        const guest = loadGuestData();
        if (!guest) return;
        if (updates.selectedEnvironment) {
          const envSpec = GARDEN_ENVIRONMENTS.find((e) => e.code === updates.selectedEnvironment);
          if (envSpec && guest.completedVerses.length < envSpec.requiredVerses) {
            throw new Error(`${envSpec.name} unlocks at ${envSpec.requiredVerses} completed verses.`);
          }
        }
        const { displayName, ...prefRest } = updates;
        if (displayName) guest.displayName = displayName;
        guest.preferences = { ...guest.preferences, ...prefRest };
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        return;
      }

      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update preferences');
      setBundle(data);
    },
    [bundle]
  );

  const completeVerse = useCallback(
    async (
      verseCode: string,
      options?: { purportRead?: boolean; evidenceType?: 'manual' | 'reflection' | 'quiz' }
    ) => {
      if (!bundle) throw new Error('Start reading first');
      const localDate = new Date().toISOString().slice(0, 10);

      if (bundle.isGuest) {
        const parsed = validateVerseCode(verseCode);
        if (!parsed) throw new Error('Invalid verse code');
        const guest = loadGuestData();
        if (!guest) throw new Error('Guest session missing');
        const existingSet = new Set(guest.completedVerses.map((v) => v.verseCode));
        if (!isChapterUnlockedForUser(parsed.chapterNumber, existingSet)) {
          throw new Error(`Complete Chapter ${parsed.chapterNumber - 1} first to unlock Chapter ${parsed.chapterNumber}.`);
        }
        let xpAwarded = 0;
        if (!existingSet.has(verseCode)) {
          guest.completedVerses.push({
            verseCode,
            chapterNumber: parsed.chapterNumber,
            verseNumber: parsed.verseNumber,
            completedAt: new Date().toISOString(),
            evidenceType: options?.evidenceType || 'manual',
            purportRead: Boolean(options?.purportRead),
          });
          guest.xpTransactions.push({
            id: Date.now(),
            amount: 10,
            reason: `Completed Bg. ${verseCode}`,
            eventKey: `verse_complete:${verseCode}`,
            createdAt: new Date().toISOString(),
          });
          xpAwarded += 10;
          existingSet.add(verseCode);
        }
        if (options?.purportRead && !guest.xpTransactions.some((t) => t.eventKey === `purport_bonus:${verseCode}`)) {
          guest.xpTransactions.push({
            id: Date.now() + 1,
            amount: 5,
            reason: `Studied purport for Bg. ${verseCode}`,
            eventKey: `purport_bonus:${verseCode}`,
            createdAt: new Date().toISOString(),
          });
          xpAwarded += 5;
        }

        // Check chapter completion & achievements for guest
        const chSpec = GITA_CHAPTERS.find((c) => c.chapterNumber === parsed.chapterNumber)!;
        const chCompleted = Array.from(existingSet).filter((c) => c.startsWith(`${parsed.chapterNumber}.`)).length;
        let unlockedNextChapter: number | null = null;
        if (chCompleted >= chSpec.verseCount && parsed.chapterNumber < 18) {
          unlockedNextChapter = parsed.chapterNumber + 1;
          if (!guest.xpTransactions.some((t) => t.eventKey === `chapter_complete:${parsed.chapterNumber}`)) {
            guest.xpTransactions.push({
              id: Date.now() + 2,
              amount: 100,
              reason: `Completed Chapter ${parsed.chapterNumber}`,
              eventKey: `chapter_complete:${parsed.chapterNumber}`,
              createdAt: new Date().toISOString(),
            });
            xpAwarded += 100;
          }
        }

        const newlyEarnedAchievements: string[] = [];
        const chStates = computeChapterStates(existingSet);
        const completedChapters = chStates.filter((c) => c.status === 'completed').length;

        for (const ach of ACHIEVEMENT_SEEDS) {
          const already = guest.earnedAchievements.some((e) => e.achievementCode === ach.code);
          if (already) continue;
          const ok =
            (ach.category === 'verse_milestone' && existingSet.size >= ach.targetCount) ||
            (ach.code === 'chapter_1_complete' && chStates[0]?.status === 'completed') ||
            (ach.code === 'chapters_6_complete' && completedChapters >= 6);
          if (ok) {
            guest.earnedAchievements.push({ achievementCode: ach.code, earnedAt: new Date().toISOString() });
            newlyEarnedAchievements.push(ach.title);
            guest.xpTransactions.push({
              id: Date.now() + Math.floor(Math.random() * 1000),
              amount: ach.xpReward,
              reason: `Milestone: ${ach.title}`,
              eventKey: `achievement:${ach.code}`,
              createdAt: new Date().toISOString(),
            });
            xpAwarded += ach.xpReward;
            if (ach.gardenRewardCode && !guest.gardenItems.some((g) => g.itemCode === ach.gardenRewardCode)) {
              const cat = GARDEN_CATALOG.find((g) => g.code === ach.gardenRewardCode);
              guest.gardenItems.push({
                itemCode: ach.gardenRewardCode,
                unlockedVia: ach.title,
                placed: true,
                posX: cat?.defaultX ?? 50,
                posY: cat?.defaultY ?? 50,
                unlockedAt: new Date().toISOString(),
              });
            }
          }
        }

        guest.preferences.lastChapter = parsed.chapterNumber;
        guest.preferences.lastVerse = parsed.verseNumber;
        saveGuestData(guest);
        const nextBundle = buildGuestBundle(guest);
        setBundle(nextBundle);
        if (unlockedNextChapter) {
          setCelebration({
            title: `Chapter ${unlockedNextChapter} Unlocked`,
            subtitle: `You completed all verses of Chapter ${parsed.chapterNumber}.`,
            xp: xpAwarded,
          });
        } else if (newlyEarnedAchievements.length > 0) {
          setCelebration({
            title: newlyEarnedAchievements[0],
            subtitle: 'New milestone & garden reward unlocked.',
            xp: xpAwarded,
          });
        }
        return { unlockedNextChapter, xpAwarded, newlyEarnedAchievements };
      }

      const res = await fetch('/api/progress/verse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          verseCode,
          purportRead: options?.purportRead,
          evidenceType: options?.evidenceType || 'manual',
          localDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not record verse');
      setBundle(data.state);
      if (data.result.unlockedNextChapter) {
        setCelebration({
          title: `Chapter ${data.result.unlockedNextChapter} Unlocked`,
          subtitle: `You completed Chapter ${data.result.unlockedNextChapter - 1}.`,
          xp: data.result.xpAwarded,
        });
      } else if ((data.result.newlyEarnedAchievements || []).length > 0) {
        setCelebration({
          title: data.result.newlyEarnedAchievements[0],
          subtitle: 'Milestone reached & garden item unlocked.',
          xp: data.result.xpAwarded,
        });
      }
      return {
        unlockedNextChapter: data.result.unlockedNextChapter,
        xpAwarded: data.result.xpAwarded,
        newlyEarnedAchievements: data.result.newlyEarnedAchievements || [],
      };
    },
    [bundle]
  );

  const updateTodayMission = useCallback(
    async (action: 'pause' | 'resume' | 'skip' | 'update_target', targetVerses?: number) => {
      if (!bundle) return;
      const localDate = new Date().toISOString().slice(0, 10);
      if (bundle.isGuest) {
        const guest = loadGuestData();
        if (!guest) return;
        if (action === 'pause') {
          guest.preferences.missionPaused = true;
          guest.missionStatusToday = { date: localDate, status: 'paused' };
        } else if (action === 'resume') {
          guest.preferences.missionPaused = false;
          guest.missionStatusToday = { date: localDate, status: 'active' };
        } else if (action === 'skip') {
          guest.missionStatusToday = { date: localDate, status: 'skipped' };
        } else if (action === 'update_target' && targetVerses) {
          guest.preferences.dailyVerseTarget = targetVerses;
        }
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        return;
      }

      const res = await fetch('/api/missions/today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, targetVerses, localDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update mission');
      setBundle(data);
    },
    [bundle]
  );

  const toggleBookmark = useCallback(
    async (verseCode: string) => {
      if (!bundle) return;
      const exists = bundle.bookmarks.some((b) => b.verseCode === verseCode);
      if (bundle.isGuest) {
        const guest = loadGuestData();
        if (!guest) return;
        guest.bookmarks = exists
          ? guest.bookmarks.filter((b) => b.verseCode !== verseCode)
          : [{ verseCode, folder: 'Saved', createdAt: new Date().toISOString() }, ...guest.bookmarks];
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        return;
      }

      const res = await fetch(
        exists ? `/api/bookmarks/${encodeURIComponent(verseCode)}` : '/api/bookmarks',
        {
          method: exists ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: exists ? undefined : JSON.stringify({ verseCode }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bookmark failed');
      setBundle(data);
    },
    [bundle]
  );

  const addHighlight = useCallback(
    async (
      verseCode: string,
      excerpt: string,
      color: 'gold' | 'sky' | 'saffron' | 'rose' = 'gold',
      point?: string
    ) => {
      if (!bundle) return;
      if (bundle.isGuest) {
        const guest = loadGuestData();
        if (!guest) return;
        const now = Date.now();
        guest.highlights.unshift({
          id: now,
          verseCode,
          color,
          excerpt,
          createdAt: new Date().toISOString(),
        });
        // Automatically save every highlight into Reflections
        guest.reflections.unshift({
          id: now + 1,
          verseCode,
          note: formatHighlightReflectionNote(excerpt, point),
          createdAt: new Date().toISOString(),
        });
        if (!guest.xpTransactions.some((t) => t.eventKey === `reflection:${verseCode}`)) {
          guest.xpTransactions.push({
            id: now + 2,
            amount: 5,
            reason: `Personal reflection on Bg. ${verseCode}`,
            eventKey: `reflection:${verseCode}`,
            createdAt: new Date().toISOString(),
          });
        }
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        return;
      }
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verseCode, excerpt, color, point }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Highlight failed');
      setBundle(data);
    },
    [bundle]
  );

  const deleteHighlight = useCallback(
    async (id: number) => {
      if (!bundle) return;
      if (bundle.isGuest) {
        const guest = loadGuestData();
        if (!guest) return;
        guest.highlights = guest.highlights.filter((h) => h.id !== id);
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        return;
      }
      const res = await fetch(`/api/highlights/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setBundle(data);
    },
    [bundle]
  );

  const saveReflection = useCallback(
    async (verseCode: string, note: string) => {
      if (!bundle) return;
      if (bundle.isGuest) {
        const guest = loadGuestData();
        if (!guest) return;
        guest.reflections.unshift({
          id: Date.now(),
          verseCode,
          note,
          createdAt: new Date().toISOString(),
        });
        if (!guest.xpTransactions.some((t) => t.eventKey === `reflection:${verseCode}`)) {
          guest.xpTransactions.push({
            id: Date.now() + 1,
            amount: 5,
            reason: `Personal reflection on Bg. ${verseCode}`,
            eventKey: `reflection:${verseCode}`,
            createdAt: new Date().toISOString(),
          });
        }
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        return;
      }
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ verseCode, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save reflection');
      setBundle(data);
    },
    [bundle]
  );

  const addReflectionPoint = useCallback(
    async (reflectionId: number, point: string) => {
      if (!bundle) return;
      const trimmed = point.trim();
      if (trimmed.length < 2) return;
      if (bundle.isGuest) {
        const guest = loadGuestData();
        if (!guest) return;
        guest.reflections = guest.reflections.map((r) =>
          r.id === reflectionId
            ? { ...r, note: appendPointToReflectionNote(r.note, trimmed) }
            : r
        );
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        return;
      }
      const res = await fetch(`/api/reflections/${reflectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ point: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add point to reflection');
      setBundle(data);
    },
    [bundle]
  );

  const submitQuizAttempt = useCallback(
    async (quizId: number, selectedIndex: number) => {
      if (!bundle) throw new Error('Start reading first');
      if (bundle.isGuest) {
        // Guest quiz check calls public /api/quizzes? No — for authenticated users server checks answer; for guest we verify via server endpoint? Wait: let's allow /api/quizzes/:id/attempt or check locally! Better yet: let's check via server or keep guest preview transparent! Actually, let's compute via server endpoint if authenticated, and for guest show clear prompt or verify against VERIFIED_QUIZ_SEEDS!
        const { VERIFIED_QUIZ_SEEDS } = await import('../shared/gitaData.ts');
        const guest = loadGuestData();
        if (!guest) throw new Error('Guest session missing');
        const seed = VERIFIED_QUIZ_SEEDS[(quizId - 1) % VERIFIED_QUIZ_SEEDS.length];
        const isCorrect = selectedIndex === seed.correctIndex;
        let xpAwarded = 0;
        if (isCorrect && !guest.xpTransactions.some((t) => t.eventKey === `quiz_correct:${quizId}`)) {
          guest.xpTransactions.push({
            id: Date.now(),
            amount: 15,
            reason: `Answered Chapter ${seed.chapterNumber} quiz`,
            eventKey: `quiz_correct:${quizId}`,
            createdAt: new Date().toISOString(),
          });
          xpAwarded = 15;
        }
        guest.quizAttempts.unshift({
          id: Date.now(),
          quizId,
          selectedIndex,
          isCorrect,
          nextReviewAt: new Date(Date.now() + (isCorrect ? 3 * 86400000 : 12 * 3600000)).toISOString(),
          attemptCount: 1,
          createdAt: new Date().toISOString(),
        });
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        return {
          isCorrect,
          correctIndex: seed.correctIndex,
          explanation: seed.explanation,
          sourceReference: seed.sourceReference,
          xpAwarded,
        };
      }

      const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ selectedIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit answer');
      setBundle(data.state);
      return {
        isCorrect: data.isCorrect,
        correctIndex: data.correctIndex,
        explanation: data.explanation,
        sourceReference: data.sourceReference,
        xpAwarded: data.xpAwarded,
      };
    },
    [bundle]
  );

  const updateGardenItem = useCallback(
    async (itemCode: string, updates: { placed?: boolean; posX?: number; posY?: number }) => {
      if (!bundle) return;
      if (bundle.isGuest) {
        const guest = loadGuestData();
        if (!guest) return;
        guest.gardenItems = guest.gardenItems.map((g) =>
          g.itemCode === itemCode ? { ...g, ...updates } : g
        );
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        return;
      }
      const res = await fetch(`/api/garden/${encodeURIComponent(itemCode)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update garden item');
      setBundle(data);
    },
    [bundle]
  );

  const acceptQuest = useCallback(
    async (questCode: string) => {
      if (!bundle) return;
      if (bundle.isGuest) {
        const guest = loadGuestData();
        if (!guest) return;
        const set = new Set(guest.acceptedQuests || []);
        set.add(questCode);
        guest.acceptedQuests = Array.from(set);
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        showToast('Quest accepted.');
        return;
      }
      const res = await fetch(`/api/quests/${encodeURIComponent(questCode)}/accept`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not accept quest');
      setBundle(data.state);
      showToast('Quest accepted.');
    },
    [bundle, showToast]
  );

  const claimQuestReward = useCallback(
    async (questCode: string) => {
      if (!bundle) throw new Error('Start reading first');
      if (bundle.isGuest) {
        const guest = loadGuestData();
        if (!guest) throw new Error('Guest session missing');
        const current = buildGuestBundle(guest);
        const quest = current.quests.find((q) => q.code === questCode);
        if (!quest || quest.status !== 'ready_to_claim') {
          throw new Error('Quest objective is not ready to claim yet.');
        }
        const claimKey = `${quest.code}:${quest.periodKey}`;
        guest.claimedQuests = Array.from(new Set([...(guest.claimedQuests || []), claimKey]));
        guest.xpTransactions.push({
          id: Date.now(),
          amount: quest.xpReward,
          reason: `Completed Quest: ${quest.title}`,
          eventKey: `quest_claim:${claimKey}`,
          createdAt: new Date().toISOString(),
        });
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        setCelebration({
          title: `Quest Completed: ${quest.title}`,
          subtitle: quest.objectiveLabel,
          xp: quest.xpReward,
        });
        return { xpAwarded: quest.xpReward };
      }

      const res = await fetch(`/api/quests/${encodeURIComponent(questCode)}/claim`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not claim reward');
      setBundle(data.state);
      setCelebration({
        title: `Quest Completed: ${data.result.quest.title}`,
        subtitle: data.result.quest.objectiveLabel,
        xp: data.result.xpAwarded,
      });
      return { xpAwarded: data.result.xpAwarded };
    },
    [bundle]
  );

  const unlockSkillNode = useCallback(
    async (skillCode: string) => {
      if (!bundle) throw new Error('Start reading first');
      if (bundle.isGuest) {
        const guest = loadGuestData();
        if (!guest) throw new Error('Guest session missing');
        const current = buildGuestBundle(guest);
        const node = current.skillTree.find((n) => n.code === skillCode);
        if (!node || node.status !== 'ready') {
          throw new Error('Skill node is not ready to unlock yet.');
        }
        guest.unlockedSkills = Array.from(new Set([...(guest.unlockedSkills || []), skillCode]));
        const spec = SKILL_TREE_NODES.find((s) => s.code === skillCode);
        const xp = spec?.xpReward ?? 20;
        guest.xpTransactions.push({
          id: Date.now(),
          amount: xp,
          reason: `Unlocked Skill: ${node.title}`,
          eventKey: `skill_unlock:${skillCode}`,
          createdAt: new Date().toISOString(),
        });
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        setCelebration({
          title: `Skill Unlocked: ${node.title}`,
          subtitle: `${node.branch} · Tier ${node.tier}`,
          xp,
        });
        return { xpAwarded: xp };
      }

      const res = await fetch(`/api/skills/${encodeURIComponent(skillCode)}/unlock`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not unlock skill');
      setBundle(data.state);
      setCelebration({
        title: `Skill Unlocked: ${data.result.skill.title}`,
        subtitle: `${data.result.skill.branch} · Tier ${data.result.skill.tier}`,
        xp: data.result.xpAwarded,
      });
      return { xpAwarded: data.result.xpAwarded };
    },
    [bundle]
  );

  const completeInteractiveChallenge = useCallback(
    async (
      challengeType: 'sanskrit_match' | 'verse_order',
      challengeId: string,
      chapterNumber: number
    ) => {
      if (!bundle) throw new Error('Start reading first');
      if (bundle.isGuest) {
        const guest = loadGuestData();
        if (!guest) throw new Error('Guest session missing');
        const key = `${challengeType}:${challengeId}`;
        const already = (guest.completedChallenges || []).includes(key);
        let xpAwarded = 0;
        if (!already) {
          guest.completedChallenges = [...(guest.completedChallenges || []), key];
          const title =
            challengeType === 'sanskrit_match'
              ? SANSKRIT_MATCH_SETS.find((s) => s.id === challengeId)?.title || challengeId
              : VERSE_ORDER_CHALLENGES.find((s) => s.id === challengeId)?.title || challengeId;
          xpAwarded = 20;
          guest.xpTransactions.push({
            id: Date.now(),
            amount: xpAwarded,
            reason: `Completed ${challengeType === 'sanskrit_match' ? 'Sanskrit Matching' : 'Verse Ordering'}: ${title}`,
            eventKey: `challenge:${key}`,
            createdAt: new Date().toISOString(),
          });
        }
        saveGuestData(guest);
        setBundle(buildGuestBundle(guest));
        return { xpAwarded };
      }

      const res = await fetch('/api/challenges/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ challengeType, challengeId, chapterNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not record challenge');
      setBundle(data.state);
      return { xpAwarded: data.result.xpAwarded };
    },
    [bundle]
  );

  const openReaderAt = useCallback((chapter: number, verse: number) => {
    setReadingTarget({ chapter, verse });
    setActiveNav('reading');
  }, []);

  const openChapterChallenge = useCallback((chapter: number) => {
    setChallengeFilterChapter(chapter);
    setActiveNav('play');
  }, []);

  const openAuthModal = useCallback((mode: 'login' | 'register' | 'onboarding') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return (
    <JourneyContext.Provider
      value={{
        bundle,
        loading,
        error,
        toast,
        clearToast: () => setToast(null),
        celebration,
        clearCelebration: () => setCelebration(null),
        activeNav,
        setActiveNav,
        readingTarget,
        openReaderAt,
        challengeFilterChapter,
        setChallengeFilterChapter,
        openChapterChallenge,
        showAuthModal,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        startGuestExploration,
        registerAccount,
        loginAccount,
        loginWithGoogle,
        logout,
        updatePreferences,
        completeVerse,
        updateTodayMission,
        toggleBookmark,
        addHighlight,
        deleteHighlight,
        saveReflection,
        addReflectionPoint,
        submitQuizAttempt,
        acceptQuest,
        claimQuestReward,
        unlockSkillNode,
        completeInteractiveChallenge,
        updateGardenItem,
        refreshState,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
};

export function useJourney(): JourneyContextValue {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney must be used within JourneyProvider');
  return ctx;
}
