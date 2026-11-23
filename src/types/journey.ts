import type {
  EvaluatedQuest,
  EvaluatedSkillNode,
  LevelInfo,
  MissionMode,
  ReaderMode,
  ThemeId,
} from '../shared/progression.ts';
import type { PrabhupadaLectureEntry } from '../shared/prabhupadaAudioCatalog.ts';

export type NavSection =
  | 'home'
  | 'map'
  | 'reading'
  | 'quests'
  | 'play'
  | 'skills'
  | 'achievements'
  | 'garden'
  | 'progress'
  | 'settings'
  | 'admin';

export interface UserPreferencesState {
  theme: ThemeId;
  language: string;
  dailyVerseTarget: number;
  missionMode: MissionMode;
  missionCustomRules: {
    requirePurport?: boolean;
    requireQuiz?: boolean;
    requireReflection?: boolean;
    requireAudio?: boolean;
  };
  missionPaused: boolean;
  readerMode: ReaderMode;
  fontSize: number;
  versesPerView: number;
  showSanskrit: boolean;
  showTransliteration: boolean;
  showTranslation: boolean;
  showPurport: boolean;
  lastChapter: number;
  lastVerse: number;
  selectedEnvironment?: 'yamuna_sanctuary' | 'vrindavan_grove' | 'temple_courtyard' | 'navadvipa_dawn';
}

export interface LicensedContentEntry {
  id: number;
  verseCode: string;
  language: string;
  edition: string;
  sourceAttribution: string;
  licenseStatus: 'source_linked' | 'authorized_public_excerpt' | 'licensed_full';
  licenseReference: string | null;
  editorialVerified: boolean;
  devanagari: string | null;
  transliteration: string | null;
  synonyms: string | null;
  translation: string | null;
  purport: string | null;
  editorialNote: string | null;
}

export interface VerseRecord {
  id: number;
  chapterNumber: number;
  verseNumber: number;
  verseCode: string;
  vedabaseUrl: string;
  speaker: string | null;
  topicSummary: string;
  keySanskritTerms: string[];
  hasAuthorizedAudio: boolean;
  audioUrl: string | null;
  authorizedLectures?: PrabhupadaLectureEntry[];
  shloka?: { devanagari: string; transliteration: string } | null;
  licensedContent: LicensedContentEntry | null;
}

export interface QuizQuestion {
  id: number;
  chapterNumber: number;
  mode: string;
  prompt: string;
  options: string[];
  sourceReference: string;
  reviewed: boolean;
}

export interface NotificationPrefs {
  inAppEnabled: boolean;
  browserPushEnabled: boolean;
  emailEnabled: boolean;
  frequency: 'daily' | 'weekdays' | 'weekly' | 'paused';
  morningTime: string;
  eveningTime: string | null;
  timezone: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  consentRecordedAt: string | null;
}

export interface NotificationLogItem {
  id: number;
  channel: string;
  category: string;
  title: string;
  body: string;
  status: string;
  readAt: string | null;
  createdAt: string;
}

export interface JourneyBundle {
  user: {
    id: number;
    uid: string;
    email: string;
    displayName: string;
    role: 'reader' | 'content_editor' | 'system_admin';
    authProvider: string;
    createdAt: string;
  } | null;
  isGuest?: boolean;
  preferences: UserPreferencesState;
  stats: {
    totalXp: number;
    level: LevelInfo;
    completedVersesCount: number;
    totalVerses: number;
    completedChaptersCount: number;
    activeDaysCount: number;
    currentStreakDays: number;
  };
  welcomeBackGapDays?: number;
  completedVerses: string[];
  readingHistory: Array<{
    verseCode: string;
    chapterNumber: number;
    verseNumber: number;
    completedAt: string;
    evidenceType: string;
    purportRead: boolean;
  }>;
  chapterStates: Array<{
    chapterNumber: number;
    verseCount: number;
    completedCount: number;
    status: 'locked' | 'available' | 'in_progress' | 'completed';
    progressPercent: number;
  }>;
  todayMission: {
    id?: number;
    missionDate: string;
    targetVerses: number;
    completedVerses: number;
    requirements: {
      mode: string;
      requirePurport: boolean;
      requireQuiz: boolean;
      requireReflection: boolean;
      requireAudio: boolean;
    };
    status: 'active' | 'completed' | 'paused' | 'skipped';
    assignedRange: string;
  };
  schedule: {
    remainingVerses: number;
    estimatedDaysRemaining: number;
    nextAssignedRange: string;
    nextVerseCode: string;
    previewDays: Array<{ dayOffset: number; rangeLabel: string; verseCodes: string[] }>;
  };
  quests: EvaluatedQuest[];
  skillTree: EvaluatedSkillNode[];
  completedChallenges: string[];
  xpTransactions: Array<{
    id: number;
    amount: number;
    reason: string;
    eventKey: string;
    createdAt: string;
  }>;
  xpRules: Array<{
    code: string;
    label: string;
    xpAmount: number;
    description: string;
    active: boolean;
  }>;
  achievements: Array<{
    code: string;
    title: string;
    description: string;
    category: string;
    xpReward: number;
    gardenRewardCode: string | null;
    unlockEnvironmentCode: string | null;
    targetCount: number;
  }>;
  earnedAchievements: Array<{
    achievementCode: string;
    earnedAt: string;
  }>;
  gardenItems: Array<{
    itemCode: string;
    unlockedVia: string;
    placed: boolean;
    posX: number;
    posY: number;
    unlockedAt: string;
  }>;
  bookmarks: Array<{
    verseCode: string;
    folder: string;
    createdAt: string;
  }>;
  highlights: Array<{
    id: number;
    verseCode: string;
    color: string;
    excerpt: string;
    createdAt: string;
  }>;
  reflections: Array<{
    id: number;
    verseCode: string;
    note: string;
    createdAt: string;
  }>;
  quizAttempts: Array<{
    id: number;
    quizId: number;
    selectedIndex: number;
    isCorrect: boolean;
    nextReviewAt: string;
    attemptCount: number;
    createdAt: string;
  }>;
  notificationPreferences: NotificationPrefs;
  notifications: NotificationLogItem[];
}
