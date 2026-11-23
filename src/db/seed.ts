import { sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  achievements,
  chapters,
  notificationTemplates,
  quizzes,
  verseMetadata,
  xpRules,
} from './schema.ts';
import {
  ACHIEVEMENT_SEEDS,
  GITA_CHAPTERS,
  NOTIFICATION_TEMPLATE_SEEDS,
  VERIFIED_QUIZ_SEEDS,
  XP_RULE_SEEDS,
  buildAllVerseMetadata,
} from '../shared/gitaData.ts';

let seedPromise: Promise<void> | null = null;

/**
 * Idempotently seeds authoritative structural metadata:
 * 18 chapters, all 700 verse metadata rows, verified quizzes, achievements, XP rules, and notification templates.
 * Never fabricates or inserts unauthorized copyrighted scripture text.
 */
export async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      // 1. Seed 18 chapters
      await db
        .insert(chapters)
        .values(GITA_CHAPTERS)
        .onConflictDoUpdate({
          target: chapters.chapterNumber,
          set: {
            sanskritTitle: sql`excluded.sanskrit_title`,
            transliterationTitle: sql`excluded.transliteration_title`,
            englishTitle: sql`excluded.english_title`,
            verseCount: sql`excluded.verse_count`,
            summary: sql`excluded.summary`,
            vedabaseUrl: sql`excluded.vedabase_url`,
            yogaTheme: sql`excluded.yoga_theme`,
          },
        });

      // 2. Seed/sync all 700 verse metadata entries (including verified Prabhupada lecture audios)
      const [audioSyncCheck] = await db
        .select({
          total: sql<number>`count(*)::int`,
          audioCount: sql<number>`count(*) filter (where has_authorized_audio = true)::int`,
        })
        .from(verseMetadata);

      if ((audioSyncCheck?.total ?? 0) < 700 || (audioSyncCheck?.audioCount ?? 0) === 0) {
        const allVerses = buildAllVerseMetadata();
        // Batch upsert in chunks of 100 for clean parameterized SQL
        for (let i = 0; i < allVerses.length; i += 100) {
          const chunk = allVerses.slice(i, i + 100);
          await db
            .insert(verseMetadata)
            .values(chunk)
            .onConflictDoUpdate({
              target: verseMetadata.verseCode,
              set: {
                hasAuthorizedAudio: sql`excluded.has_authorized_audio`,
                audioUrl: sql`excluded.audio_url`,
                authorizedLectures: sql`excluded.authorized_lectures`,
              },
            });
        }
      }

      // 3. Seed achievements
      await db
        .insert(achievements)
        .values(ACHIEVEMENT_SEEDS)
        .onConflictDoUpdate({
          target: achievements.code,
          set: {
            title: sql`excluded.title`,
            description: sql`excluded.description`,
          },
        });

      // 4. Seed XP rules
      await db
        .insert(xpRules)
        .values(XP_RULE_SEEDS)
        .onConflictDoNothing({ target: xpRules.code });

      // 5. Seed notification templates
      await db
        .insert(notificationTemplates)
        .values(NOTIFICATION_TEMPLATE_SEEDS)
        .onConflictDoNothing({ target: notificationTemplates.code });

      // 6. Seed verified quizzes idempotently by prompt
      const existingQuizzes = await db
        .select({ prompt: quizzes.prompt })
        .from(quizzes);
      const existingPrompts = new Set(existingQuizzes.map((q) => q.prompt));
      const missingQuizzes = VERIFIED_QUIZ_SEEDS.filter((q) => !existingPrompts.has(q.prompt));
      if (missingQuizzes.length > 0) {
        await db.insert(quizzes).values(
          missingQuizzes.map((q) => ({
            chapterNumber: q.chapterNumber,
            mode: q.mode,
            prompt: q.prompt,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            sourceReference: q.sourceReference,
            reviewed: true,
          }))
        );
      }
    } catch (err) {
      seedPromise = null;
      console.error('Database seed error:', err);
      throw new Error('Failed to verify initial Gita metadata.', { cause: err });
    }
  })();
  return seedPromise;
}
