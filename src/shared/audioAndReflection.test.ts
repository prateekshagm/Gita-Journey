import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRABHUPADA_AUDIO_BY_VERSE,
  getAuthorizedLecturesForVerse,
} from './prabhupadaAudioCatalog.ts';
import { GITA_SHLOKAS } from './shlokaTexts.ts';
import { GITA_CHAPTERS, TOTAL_GITA_VERSES } from './gitaData.ts';
import { SUPPORTED_LANGUAGES, renderShlokaInLanguageScript } from './languages.ts';
import {
  appendPointToReflectionNote,
  formatHighlightReflectionNote,
  parseReflectionLines,
} from './reflectionHelpers.ts';
import { validateVerseCode } from './progression.ts';

test('Prabhupada audio catalog has only valid verse codes and verified HTTPS MP3 URLs', () => {
  const verseKeys = Object.keys(PRABHUPADA_AUDIO_BY_VERSE);
  assert.ok(verseKeys.length >= 400, `Expected >= 400 covered verses, got ${verseKeys.length}`);

  for (const vc of verseKeys) {
    assert.ok(validateVerseCode(vc), `Invalid verse code in audio catalog: ${vc}`);
    const lectures = PRABHUPADA_AUDIO_BY_VERSE[vc];
    assert.ok(lectures.length > 0);
    for (const lec of lectures) {
      assert.ok(lec.audioUrl.startsWith('https://s3.amazonaws.com/vanipedia/'), `Unexpected audio URL: ${lec.audioUrl}`);
      assert.ok(lec.audioUrl.endsWith('.mp3'));
      assert.ok(lec.transcriptUrl.startsWith('https://vanisource.org/wiki/'));
      assert.equal(lec.archiveSourceUrl, 'https://prabhupadavani.org/transcriptions/type/bhagavad-gita/');
    }
  }

  // Exact spot checks against verified Prabhupadavani/Vanisource index
  const bg11 = getAuthorizedLecturesForVerse('1.1');
  assert.ok(bg11.some((l) => l.title === '730707 - Lecture BG 01.01 - London'));

  const bg213 = getAuthorizedLecturesForVerse('2.13');
  assert.ok(bg213.length >= 10);
  assert.equal(bg213[0].language, 'en');

  // Verses without archived BG lectures must remain empty (no false authorization)
  assert.deepEqual(getAuthorizedLecturesForVerse('18.66'), []);
});

test('All 700 Gita Sanskrit shlokas are complete and match canonical chapter verse counts', () => {
  assert.equal(TOTAL_GITA_VERSES, 700);
  assert.equal(Object.keys(GITA_SHLOKAS).length, 700);

  for (const ch of GITA_CHAPTERS) {
    for (let v = 1; v <= ch.verseCount; v++) {
      const vc = `${ch.chapterNumber}.${v}`;
      const entry = GITA_SHLOKAS[vc];
      assert.ok(entry, `Missing shloka ${vc}`);
      assert.ok(entry.devanagari.length > 5, `Empty devanagari for ${vc}`);
      assert.ok(entry.transliteration.length > 5, `Empty transliteration for ${vc}`);
    }
  }

  assert.match(GITA_SHLOKAS['1.1'].devanagari, /धर्मक्षेत्रे कुरुक्षेत्रे/);
  assert.match(GITA_SHLOKAS['1.46'].transliteration, /sañjaya uvāca/i);
  assert.match(GITA_SHLOKAS['18.66'].transliteration, /sarvadharmān/i);
});

test('Supported languages include Kannada, Telugu, Tamil, Malayalam, and Marathi with script rendering', () => {
  const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
  for (const required of ['en', 'hi', 'bn', 'kn', 'te', 'ta', 'ml', 'mr']) {
    assert.ok(codes.includes(required), `Missing language ${required}`);
  }

  const sample = GITA_SHLOKAS['1.1'].devanagari;
  const kn = renderShlokaInLanguageScript(sample, 'kn');
  const te = renderShlokaInLanguageScript(sample, 'te');
  const ta = renderShlokaInLanguageScript(sample, 'ta');
  const ml = renderShlokaInLanguageScript(sample, 'ml');

  assert.ok(kn && kn.text.includes('ಧರ್ಮಕ್ಷೇತ್ರೇ'));
  assert.ok(te && te.text.includes('ధర్మక్షేత్రే'));
  assert.ok(ta && ta.text.length > 10);
  assert.ok(ml && ml.text.includes('ധര്മക്ഷേത്രേ'));
  assert.equal(renderShlokaInLanguageScript(sample, 'mr'), null);
});

test('Highlight auto-saves cleanly as reflection and supports adding multiple bullet points', () => {
  const initial = formatHighlightReflectionNote('The sober person is not bewildered by bodily change.');
  assert.equal(initial, 'Highlighted: "The sober person is not bewildered by bodily change."');

  const withFirstPoint = appendPointToReflectionNote(initial, 'Recall equanimity during daily setbacks.');
  const withSecondPoint = appendPointToReflectionNote(withFirstPoint, 'Compare with Bg. 2.14 on tolerance.');

  const parsed = parseReflectionLines(withSecondPoint);
  assert.equal(parsed.isHighlight, true);
  assert.equal(parsed.mainText, 'Highlighted: "The sober person is not bewildered by bodily change."');
  assert.deepEqual(parsed.points, [
    'Recall equanimity during daily setbacks.',
    'Compare with Bg. 2.14 on tolerance.',
  ]);
});
