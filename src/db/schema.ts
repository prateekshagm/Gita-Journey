import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { PrabhupadaLectureEntry } from '../shared/prabhupadaAudioCatalog.ts';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  displayName: text('display_name').notNull(),
  role: text('role').notNull().default('reader'), // 'reader' | 'content_editor' | 'system_admin'
  authProvider: text('auth_provider').notNull().default('email'), // 'email' | 'google'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastLoginAt: timestamp('last_login_at').notNull().defaultNow(),
});

export const userPreferences = pgTable('user_preferences', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: text('theme').notNull().default('krishna'), // 'krishna' | 'radha_shyamasundara' | 'gauranga'
  language: text('language').notNull().default('en'),
  dailyVerseTarget: integer('daily_verse_target').notNull().default(3),
  missionMode: text('mission_mode').notNull().default('reading_only'),
  missionCustomRules: jsonb('mission_custom_rules').$type<{
    requirePurport?: boolean;
    requireQuiz?: boolean;
    requireReflection?: boolean;
    requireAudio?: boolean;
  }>().notNull().default({}),
  missionPaused: boolean('mission_paused').notNull().default(false),
  readerMode: text('reader_mode').notNull().default('light'), // 'light' | 'dark' | 'sepia'
  fontSize: integer('font_size').notNull().default(18),
  versesPerView: integer('verses_per_view').notNull().default(1),
  showSanskrit: boolean('show_sanskrit').notNull().default(true),
  showTransliteration: boolean('show_transliteration').notNull().default(true),
  showTranslation: boolean('show_translation').notNull().default(true),
  showPurport: boolean('show_purport').notNull().default(true),
  lastChapter: integer('last_chapter').notNull().default(1),
  lastVerse: integer('last_verse').notNull().default(1),
  selectedEnvironment: text('selected_environment').notNull().default('yamuna_sanctuary'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const chapters = pgTable('chapters', {
  chapterNumber: integer('chapter_number').primaryKey(),
  sanskritTitle: text('sanskrit_title').notNull(),
  transliterationTitle: text('transliteration_title').notNull(),
  englishTitle: text('english_title').notNull(),
  verseCount: integer('verse_count').notNull(),
  summary: text('summary').notNull(),
  vedabaseUrl: text('vedabase_url').notNull(),
  yogaTheme: text('yoga_theme').notNull(),
});

export const verseMetadata = pgTable(
  'verse_metadata',
  {
    id: serial('id').primaryKey(),
    chapterNumber: integer('chapter_number')
      .notNull()
      .references(() => chapters.chapterNumber, { onDelete: 'cascade' }),
    verseNumber: integer('verse_number').notNull(),
    verseCode: text('verse_code').notNull().unique(),
    vedabaseUrl: text('vedabase_url').notNull(),
    speaker: text('speaker'),
    topicSummary: text('topic_summary').notNull(),
    keySanskritTerms: jsonb('key_sanskrit_terms').$type<string[]>().notNull().default([]),
    hasAuthorizedAudio: boolean('has_authorized_audio').notNull().default(false),
    audioUrl: text('audio_url'),
    authorizedLectures: jsonb('authorized_lectures')
      .$type<PrabhupadaLectureEntry[]>()
      .notNull()
      .default([]),
  },
  (table) => [
    uniqueIndex('verse_metadata_ch_v_idx').on(table.chapterNumber, table.verseNumber),
  ]
);

export const licensedContent = pgTable(
  'licensed_content',
  {
    id: serial('id').primaryKey(),
    verseCode: text('verse_code')
      .notNull()
      .references(() => verseMetadata.verseCode, { onDelete: 'cascade' }),
    language: text('language').notNull().default('en'),
    edition: text('edition').notNull(),
    sourceAttribution: text('source_attribution').notNull(),
    licenseStatus: text('license_status').notNull().default('source_linked'),
    licenseReference: text('license_reference'),
    editorialVerified: boolean('editorial_verified').notNull().default(false),
    verifiedBy: integer('verified_by').references(() => users.id, { onDelete: 'set null' }),
    devanagari: text('devanagari'),
    transliteration: text('transliteration'),
    synonyms: text('synonyms'),
    translation: text('translation'),
    purport: text('purport'),
    editorialNote: text('editorial_note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('licensed_content_verse_lang_idx').on(table.verseCode, table.language),
  ]
);

export const readingProgress = pgTable(
  'reading_progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chapterNumber: integer('chapter_number')
      .notNull()
      .references(() => chapters.chapterNumber),
    verseNumber: integer('verse_number').notNull(),
    verseCode: text('verse_code')
      .notNull()
      .references(() => verseMetadata.verseCode),
    completedAt: timestamp('completed_at').notNull().defaultNow(),
    evidenceType: text('evidence_type').notNull().default('manual'),
    purportRead: boolean('purport_read').notNull().default(false),
    audioListened: boolean('audio_listened').notNull().default(false),
  },
  (table) => [
    uniqueIndex('reading_progress_user_verse_idx').on(table.userId, table.verseCode),
  ]
);

export const chapterUnlocks = pgTable(
  'chapter_unlocks',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chapterNumber: integer('chapter_number')
      .notNull()
      .references(() => chapters.chapterNumber),
    unlockedAt: timestamp('unlocked_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    uniqueIndex('chapter_unlocks_user_ch_idx').on(table.userId, table.chapterNumber),
  ]
);

export const dailyMissions = pgTable(
  'daily_missions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    missionDate: text('mission_date').notNull(),
    targetVerses: integer('target_verses').notNull(),
    completedVerses: integer('completed_verses').notNull().default(0),
    requirements: jsonb('requirements').$type<{
      mode: string;
      requirePurport: boolean;
      requireQuiz: boolean;
      requireReflection: boolean;
      requireAudio: boolean;
    }>().notNull(),
    status: text('status').notNull().default('active'), // 'active' | 'completed' | 'paused' | 'skipped'
    assignedRange: text('assigned_range').notNull(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('daily_missions_user_date_idx').on(table.userId, table.missionDate),
  ]
);

export const missionActivities = pgTable(
  'mission_activities',
  {
    id: serial('id').primaryKey(),
    missionId: integer('mission_id')
      .notNull()
      .references(() => dailyMissions.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    activityType: text('activity_type').notNull(),
    referenceId: text('reference_id').notNull(),
    completedAt: timestamp('completed_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('mission_activities_unique_idx').on(
      table.missionId,
      table.activityType,
      table.referenceId
    ),
  ]
);

export const xpTransactions = pgTable(
  'xp_transactions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    reason: text('reason').notNull(),
    eventKey: text('event_key').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('xp_transactions_user_event_idx').on(table.userId, table.eventKey),
  ]
);

export const achievements = pgTable('achievements', {
  code: text('code').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  xpReward: integer('xp_reward').notNull(),
  gardenRewardCode: text('garden_reward_code'),
  unlockEnvironmentCode: text('unlock_environment_code'),
  targetCount: integer('target_count').notNull().default(1),
});

export const userAchievements = pgTable(
  'user_achievements',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    achievementCode: text('achievement_code')
      .notNull()
      .references(() => achievements.code, { onDelete: 'cascade' }),
    earnedAt: timestamp('earned_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('user_achievements_user_code_idx').on(table.userId, table.achievementCode),
  ]
);

export const gardenItems = pgTable(
  'garden_items',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemCode: text('item_code').notNull(),
    unlockedVia: text('unlocked_via').notNull(),
    placed: boolean('placed').notNull().default(true),
    posX: integer('pos_x').notNull().default(50),
    posY: integer('pos_y').notNull().default(50),
    unlockedAt: timestamp('unlocked_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('garden_items_user_item_idx').on(table.userId, table.itemCode),
  ]
);

export const bookmarks = pgTable(
  'bookmarks',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    verseCode: text('verse_code')
      .notNull()
      .references(() => verseMetadata.verseCode),
    folder: text('folder').notNull().default('Saved'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('bookmarks_user_verse_idx').on(table.userId, table.verseCode),
  ]
);

export const highlights = pgTable('highlights', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  verseCode: text('verse_code')
    .notNull()
    .references(() => verseMetadata.verseCode),
  color: text('color').notNull().default('gold'),
  excerpt: text('excerpt').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const reflections = pgTable('reflections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  verseCode: text('verse_code')
    .notNull()
    .references(() => verseMetadata.verseCode),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  chapterNumber: integer('chapter_number')
    .notNull()
    .references(() => chapters.chapterNumber),
  mode: text('mode').notNull().default('comprehension'),
  prompt: text('prompt').notNull(),
  options: jsonb('options').$type<string[]>().notNull(),
  correctIndex: integer('correct_index').notNull(),
  explanation: text('explanation').notNull(),
  sourceReference: text('source_reference').notNull(),
  reviewed: boolean('reviewed').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  quizId: integer('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  selectedIndex: integer('selected_index').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  nextReviewAt: timestamp('next_review_at').notNull().defaultNow(),
  attemptCount: integer('attempt_count').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notificationPreferences = pgTable('notification_preferences', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  inAppEnabled: boolean('in_app_enabled').notNull().default(true),
  browserPushEnabled: boolean('browser_push_enabled').notNull().default(false),
  browserPushSubscription: jsonb('browser_push_subscription').$type<Record<string, unknown> | null>(),
  emailEnabled: boolean('email_enabled').notNull().default(false),
  frequency: text('frequency').notNull().default('daily'),
  morningTime: text('morning_time').notNull().default('07:00'),
  eveningTime: text('evening_time'),
  timezone: text('timezone').notNull().default('UTC'),
  quietHoursStart: text('quiet_hours_start').notNull().default('22:00'),
  quietHoursEnd: text('quiet_hours_end').notNull().default('06:00'),
  consentRecordedAt: timestamp('consent_recorded_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const notificationDeliveryLogs = pgTable('notification_delivery_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull(),
  category: text('category').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  status: text('status').notNull().default('delivered'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const notificationTemplates = pgTable('notification_templates', {
  code: text('code').primaryKey(),
  category: text('category').notNull(),
  titleTemplate: text('title_template').notNull(),
  bodyTemplate: text('body_template').notNull(),
  active: boolean('active').notNull().default(true),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const xpRules = pgTable('xp_rules', {
  code: text('code').primaryKey(),
  label: text('label').notNull(),
  xpAmount: integer('xp_amount').notNull(),
  description: text('description').notNull(),
  active: boolean('active').notNull().default(true),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: serial('id').primaryKey(),
  actorUserId: integer('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const userQuests = pgTable(
  'user_quests',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    questCode: text('quest_code').notNull(),
    periodKey: text('period_key').notNull(), // YYYY-MM-DD for daily quests, 'journey' for milestone quests
    status: text('status').notNull().default('accepted'), // 'accepted' | 'claimed'
    acceptedAt: timestamp('accepted_at').notNull().defaultNow(),
    claimedAt: timestamp('claimed_at'),
  },
  (table) => [
    uniqueIndex('user_quests_user_code_period_idx').on(table.userId, table.questCode, table.periodKey),
  ]
);

export const userSkills = pgTable(
  'user_skills',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skillCode: text('skill_code').notNull(),
    unlockedAt: timestamp('unlocked_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('user_skills_user_code_idx').on(table.userId, table.skillCode),
  ]
);

