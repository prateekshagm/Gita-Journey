export interface ChapterSpec {
  chapterNumber: number;
  sanskritTitle: string;
  transliterationTitle: string;
  englishTitle: string;
  verseCount: number;
  summary: string;
  vedabaseUrl: string;
  yogaTheme: string;
}
import {
  getAuthorizedLecturesForVerse,
  type PrabhupadaLectureEntry,
} from './prabhupadaAudioCatalog.ts';

export const GITA_CHAPTERS: ChapterSpec[] = [
  {
    chapterNumber: 1,
    sanskritTitle: 'अर्जुनविषादयोग',
    transliterationTitle: 'Arjuna-viṣāda-yoga',
    englishTitle: 'Observing the Armies on the Battlefield of Kurukṣetra',
    verseCount: 46,
    summary:
      'Dhṛtarāṣṭra inquires from Sañjaya about the assembly at Kurukṣetra. Arjuna surveys both armies and experiences deep moral distress at seeing his kinsmen and teachers arrayed for battle.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/1/',
    yogaTheme: 'Setting & Moral Dilemma',
  },
  {
    chapterNumber: 2,
    sanskritTitle: 'सांख्ययोग',
    transliterationTitle: 'Sāṅkhya-yoga',
    englishTitle: 'Contents of the Gītā Summarized',
    verseCount: 72,
    summary:
      'Arjuna surrenders as Śrī Kṛṣṇa’s disciple. Kṛṣṇa begins His instruction by distinguishing the eternal soul (ātmā) from the temporary body and introducing buddhi-yoga and steadiness of mind.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/2/',
    yogaTheme: 'Analytical Study & Equanimity',
  },
  {
    chapterNumber: 3,
    sanskritTitle: 'कर्मयोग',
    transliterationTitle: 'Karma-yoga',
    englishTitle: 'Karma-yoga',
    verseCount: 43,
    summary:
      'Kṛṣṇa explains why action performed as selfless duty and offering (yajña) purifies consciousness, whereas renouncing action prematurely leads to hypocrisy.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/3/',
    yogaTheme: 'Selfless Action',
  },
  {
    chapterNumber: 4,
    sanskritTitle: 'ज्ञानकर्मसंन्यासयोग',
    transliterationTitle: 'Jñāna-karma-sannyāsa-yoga',
    englishTitle: 'Transcendental Knowledge',
    verseCount: 42,
    summary:
      'The disciplic succession (paramparā), the transcendental nature of Kṛṣṇa’s appearances and activities, and the role of approaching a bona fide spiritual teacher.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/4/',
    yogaTheme: 'Transcendental Knowledge',
  },
  {
    chapterNumber: 5,
    sanskritTitle: 'कर्मसंन्यासयोग',
    transliterationTitle: 'Karma-sannyāsa-yoga',
    englishTitle: 'Karma-yoga — Action in Kṛṣṇa Consciousness',
    verseCount: 29,
    summary:
      'Comparing external renunciation with detached action in devotion, showing how a wise person sees all beings with equal vision and attains peace.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/5/',
    yogaTheme: 'Action & Renunciation',
  },
  {
    chapterNumber: 6,
    sanskritTitle: 'ध्यानयोग',
    transliterationTitle: 'Dhyāna-yoga',
    englishTitle: 'Dhyāna-yoga',
    verseCount: 47,
    summary:
      'Disciplined meditation, mastery of the restless mind through practice and detachment, the destiny of an unsuccessful yogī, and the supremacy of the bhakti-yogī.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/6/',
    yogaTheme: 'Meditation & Mind Control',
  },
  {
    chapterNumber: 7,
    sanskritTitle: 'ज्ञानविज्ञानयोग',
    transliterationTitle: 'Jñāna-vijñāna-yoga',
    englishTitle: 'Knowledge of the Absolute',
    verseCount: 30,
    summary:
      'Kṛṣṇa describes His material and spiritual energies, four types of people who approach Him, and the rarity of one who knows Him in full.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/7/',
    yogaTheme: 'Realized Knowledge',
  },
  {
    chapterNumber: 8,
    sanskritTitle: 'अक्षरब्रह्मयोग',
    transliterationTitle: 'Akṣara-brahma-yoga',
    englishTitle: 'Attaining the Supreme',
    verseCount: 28,
    summary:
      'Answering Arjuna’s seven questions, Kṛṣṇa explains remembrance at the time of departure, the temporary nature of the material cosmos, and the eternal abode.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/8/',
    yogaTheme: 'Remembrance & Destination',
  },
  {
    chapterNumber: 9,
    sanskritTitle: 'राजविद्याराजगुह्ययोग',
    transliterationTitle: 'Rāja-vidyā-rāja-guhya-yoga',
    englishTitle: 'The Most Confidential Knowledge',
    verseCount: 34,
    summary:
      'The king of knowledge and king of secrets: Kṛṣṇa’s all-pervading yet personal relationship with creation, and His loving acceptance of simple offerings made with devotion.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/9/',
    yogaTheme: 'Confidential Devotion',
  },
  {
    chapterNumber: 10,
    sanskritTitle: 'विभूतियोग',
    transliterationTitle: 'Vibhūti-yoga',
    englishTitle: 'The Opulence of the Absolute',
    verseCount: 42,
    summary:
      'After speaking the Catuḥ-ślokī Gītā (verses 8–11), Kṛṣṇa describes His principal manifestations throughout the world so the mind can perceive His presence everywhere.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/10/',
    yogaTheme: 'Divine Opulences',
  },
  {
    chapterNumber: 11,
    sanskritTitle: 'विश्वरूपदर्शनयोग',
    transliterationTitle: 'Viśvarūpa-darśana-yoga',
    englishTitle: 'The Universal Form',
    verseCount: 55,
    summary:
      'Granting Arjuna divine vision, Kṛṣṇa reveals the awe-inspiring Universal Form, then resumes His gentle two-armed Śyāmasundara form accessible through undivided devotion.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/11/',
    yogaTheme: 'The Universal Form',
  },
  {
    chapterNumber: 12,
    sanskritTitle: 'भक्तियोग',
    transliterationTitle: 'Bhakti-yoga',
    englishTitle: 'Devotional Service',
    verseCount: 20,
    summary:
      'Kṛṣṇa confirms the superiority of personal loving devotion over impersonal contemplation, outlines progressive stages of practice, and describes the endearing qualities of a devotee.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/12/',
    yogaTheme: 'Pure Devotional Service',
  },
  {
    chapterNumber: 13,
    sanskritTitle: 'क्षेत्रक्षेत्रज्ञविभागयोग',
    transliterationTitle: 'Kṣetra-kṣetrajña-vibhāga-yoga',
    englishTitle: 'Nature, the Enjoyer, and Consciousness',
    verseCount: 35,
    summary:
      'Distinguishing the field of activities (the body), the individual knower of the field (the soul), and the Supersoul (Paramātmā) who accompanies every living entity.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/13/',
    yogaTheme: 'Field & Knower',
  },
  {
    chapterNumber: 14,
    sanskritTitle: 'गुणत्रयविभागयोग',
    transliterationTitle: 'Guṇatraya-vibhāga-yoga',
    englishTitle: 'The Three Modes of Material Nature',
    verseCount: 27,
    summary:
      'An analysis of goodness (sattva), passion (rajas), and ignorance (tamas)—how they bind the soul, how to recognize them, and how to transcend them through bhakti.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/14/',
    yogaTheme: 'The Three Guṇas',
  },
  {
    chapterNumber: 15,
    sanskritTitle: 'पुरुषोत्तमयोग',
    transliterationTitle: 'Puruṣottama-yoga',
    englishTitle: 'The Yoga of the Supreme Person',
    verseCount: 20,
    summary:
      'The allegory of the inverted banyan tree of material existence, the soul’s journey, and Kṛṣṇa’s position as Puruṣottama beyond both fallible and infallible beings.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/15/',
    yogaTheme: 'The Supreme Person',
  },
  {
    chapterNumber: 16,
    sanskritTitle: 'दैवासुरसम्पद्विभागयोग',
    transliterationTitle: 'Daivāsura-sampad-vibhāga-yoga',
    englishTitle: 'The Divine and Demoniac Natures',
    verseCount: 24,
    summary:
      'Contrasting twenty-six divine qualities beginning with fearlessness and truthfulness against arrogance, anger, and disregard for scriptural guidance.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/16/',
    yogaTheme: 'Qualities & Character',
  },
  {
    chapterNumber: 17,
    sanskritTitle: 'श्रद्धात्रयविभागयोग',
    transliterationTitle: 'Śraddhātraya-vibhāga-yoga',
    englishTitle: 'The Divisions of Faith',
    verseCount: 28,
    summary:
      'How faith, food preferences, worship, austerity, and charity are shaped by the three modes of nature, concluding with the meaning of Oṁ Tat Sat.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/17/',
    yogaTheme: 'Divisions of Faith',
  },
  {
    chapterNumber: 18,
    sanskritTitle: 'मोक्षसंन्यासयोग',
    transliterationTitle: 'Mokṣa-sannyāsa-yoga',
    englishTitle: 'Conclusion — The Perfection of Renunciation',
    verseCount: 78,
    summary:
      'A grand synthesis of the entire Gītā—renunciation vs. tyāga, action according to one’s nature, the most confidential surrender (18.65–66), and Sañjaya’s final reflection.',
    vedabaseUrl: 'https://vedabase.io/en/library/bg/18/',
    yogaTheme: 'Synthesis & Surrender',
  },
];

export const TOTAL_GITA_VERSES = GITA_CHAPTERS.reduce((sum, ch) => sum + ch.verseCount, 0);

export interface VerseMetadataRecord {
  chapterNumber: number;
  verseNumber: number;
  verseCode: string;
  vedabaseUrl: string;
  speaker: string;
  topicSummary: string;
  keySanskritTerms: string[];
  hasAuthorizedAudio: boolean;
  audioUrl: string | null;
  authorizedLectures: PrabhupadaLectureEntry[];
}

const NOTABLE_VERSES: Record<
  string,
  { speaker?: string; topicSummary: string; keySanskritTerms: string[] }
> = {
  '1.1': {
    speaker: 'Dhṛtarāṣṭra',
    topicSummary:
      'Dhṛtarāṣṭra asks Sañjaya what his sons and the sons of Pāṇḍu did after assembling at the sacred field of Kurukṣetra.',
    keySanskritTerms: ['dharma-kṣetre', 'kuru-kṣetre', 'sañjaya'],
  },
  '1.46': {
    speaker: 'Sañjaya',
    topicSummary:
      'Arjuna casts aside his bow and arrows on the chariot seat, overwhelmed with grief and compassion.',
    keySanskritTerms: ['visṛjya', 'śoka-saṁvigna-mānasaḥ'],
  },
  '2.7': {
    speaker: 'Arjuna',
    topicSummary:
      'Confused about duty, Arjuna formally accepts Śrī Kṛṣṇa as his spiritual master and asks for clear instruction.',
    keySanskritTerms: ['kārpaṇya-doṣa', 'śiṣyas te ’ham', 'śādhi mām'],
  },
  '2.13': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Just as the embodied soul passes from boyhood to youth to old age, it similarly passes into another body; the sober person is not bewildered.',
    keySanskritTerms: ['dehinaḥ', 'kaumāram', 'dhīras tatra na muhyati'],
  },
  '2.20': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'The soul is never born and never dies; unborn, eternal, ever-existing, and primeval, it is not slain when the body is slain.',
    keySanskritTerms: ['na jāyate', 'nityaḥ', 'śāśvataḥ'],
  },
  '2.47': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.',
    keySanskritTerms: ['karmaṇy evādhikāras te', 'mā phaleṣu'],
  },
  '3.21': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Whatever action a great person performs, common people follow; whatever standards they set, the world pursues.',
    keySanskritTerms: ['yad yad ācarati śreṣṭhaḥ', 'pramāṇam'],
  },
  '3.27': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'The bewildered spirit soul, under the influence of false ego, thinks itself the doer of activities actually carried out by the three modes of nature.',
    keySanskritTerms: ['prakṛteḥ kriyamāṇāni', 'ahaṅkāra-vimūḍhātmā'],
  },
  '4.7': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Whenever and wherever there is a decline in dharma and a rise of irreligion, the Supreme Lord manifests Himself.',
    keySanskritTerms: ['yadā yadā hi dharmasya', 'sambhavāmi yuge yuge'],
  },
  '4.34': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Learn the truth by approaching a spiritual master, inquiring submissively, and rendering service; self-realized souls can impart knowledge because they have seen the truth.',
    keySanskritTerms: ['tad viddhi praṇipātena', 'paripraśnena', 'sevayā'],
  },
  '5.29': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Knowing Kṛṣṇa as the beneficiary of all sacrifices, the Supreme Lord of all worlds, and the well-wishing friend of all living entities brings peace.',
    keySanskritTerms: ['bhoktāraṁ yajña-tapasām', 'suhṛdaṁ sarva-bhūtānām'],
  },
  '6.5': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'One must deliver oneself with the help of the mind, not degrade oneself; the mind is the friend of the conditioned soul, and its enemy as well.',
    keySanskritTerms: ['uddhared ātmanātmānam', 'bandhur ātmātmanaḥ'],
  },
  '6.47': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Of all yogīs, the one who abides in Kṛṣṇa with great faith and worships Him in loving devotional service is most intimately united with Him.',
    keySanskritTerms: ['yoginām api sarveṣām', 'śraddhāvān bhajate'],
  },
  '7.14': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'This divine energy of the three modes of material nature is difficult to overcome, yet those who surrender unto Kṛṣṇa can easily cross beyond it.',
    keySanskritTerms: ['daivī hy eṣā guṇa-mayī', 'mām eva ye prapadyante'],
  },
  '8.5': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Whoever quits the body remembering Kṛṣṇa alone at the end of life immediately attains His nature; of this there is no doubt.',
    keySanskritTerms: ['anta-kāle ca mām eva', 'smaran muktvā kalevaram'],
  },
  '9.22': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'To those who are constantly devoted and worship Kṛṣṇa with love, He carries what they lack and preserves what they have.',
    keySanskritTerms: ['ananyāś cintayanto mām', 'yoga-kṣemaṁ vahāmy aham'],
  },
  '9.26': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'If one offers Kṛṣṇa with love and devotion a leaf, a flower, a fruit, or water, He accepts it.',
    keySanskritTerms: ['patraṁ puṣpaṁ phalaṁ toyam', 'bhaktyā prayacchati'],
  },
  '10.8': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Kṛṣṇa is the source of all spiritual and material worlds; knowing this, the wise engage in His devotional service with all their hearts.',
    keySanskritTerms: ['ahaṁ sarvasya prabhavaḥ', 'budhā bhāva-samanvitāḥ'],
  },
  '11.32': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Kṛṣṇa declares Himself as time, the great destroyer of the worlds, engaged in annihilating all people except the Pāṇḍavas.',
    keySanskritTerms: ['kālo ’smi loka-kṣaya-kṛt'],
  },
  '12.8': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Fix your mind upon Kṛṣṇa and engage all your intelligence in Him; thus you will live in Him always, without doubt.',
    keySanskritTerms: ['mayy eva mana ādhatsva', 'mayi buddhiṁ niveśaya'],
  },
  '13.23': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Within the body resides the Supersoul—the overseer, permitter, supporter, transcendental enjoyer, and Supreme Lord.',
    keySanskritTerms: ['upadraṣṭānumantā ca', 'paramātmeti cāpy uktaḥ'],
  },
  '14.26': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'One who engages in full, unfailing devotional service transcends the modes of material nature and comes to the level of Brahman.',
    keySanskritTerms: ['avyabhicāreṇa bhakti-yogena', 'brahma-bhūyāya'],
  },
  '15.15': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Seated in everyone’s heart, Kṛṣṇa is the source of remembrance, knowledge, and forgetfulness; He is to be known by all the Vedas.',
    keySanskritTerms: ['sarvasya cāhaṁ hṛdi sanniviṣṭaḥ', 'vedaiś ca sarvaiḥ'],
  },
  '16.24': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Let scripture be your authority in determining what should and should not be done; knowing scriptural injunctions, perform work in this world.',
    keySanskritTerms: ['śāstraṁ pramāṇam', 'kāryākārya-vyavasthitau'],
  },
  '17.3': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Each person’s faith corresponds to their nature; a living being consists of their faith, and whatever one’s faith is, that one is.',
    keySanskritTerms: ['sattvānurūpā sarvasya śraddhā', 'śraddhā-mayo ’yaṁ puruṣaḥ'],
  },
  '18.65': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Always think of Kṛṣṇa, become His devotee, worship Him, and offer homage unto Him; thus you will come to Him without fail.',
    keySanskritTerms: ['man-manā bhava mad-bhaktaḥ', 'mad-yājī māṁ namaskuru'],
  },
  '18.66': {
    speaker: 'Śrī Kṛṣṇa',
    topicSummary:
      'Abandon all varieties of dharma and simply surrender unto Kṛṣṇa; He will deliver you from all sinful reactions—do not fear.',
    keySanskritTerms: ['sarva-dharmān parityajya', 'mām ekaṁ śaraṇaṁ vraja'],
  },
  '18.78': {
    speaker: 'Sañjaya',
    topicSummary:
      'Wherever there is Kṛṣṇa, the master of all mystics, and Arjuna, the supreme archer, there will certainly be opulence, victory, extraordinary power, and morality.',
    keySanskritTerms: ['yatra yogeśvaraḥ kṛṣṇaḥ', 'yatra pārtho dhanur-dharaḥ'],
  },
};

function inferSpeaker(chapter: number, verse: number): string {
  if (chapter === 1) {
    if (verse === 1) return 'Dhṛtarāṣṭra';
    if (verse >= 21 && verse <= 23) return 'Arjuna';
    if (verse >= 28 && verse <= 45) return 'Arjuna';
    return 'Sañjaya';
  }
  if (chapter === 2) {
    if (verse === 1) return 'Sañjaya';
    if (verse >= 4 && verse <= 8) return 'Arjuna';
    if (verse === 9 || verse === 10) return 'Sañjaya';
    if (verse === 54) return 'Arjuna';
    return 'Śrī Kṛṣṇa';
  }
  if (chapter === 3 && (verse === 1 || verse === 2 || verse === 36)) return 'Arjuna';
  if (chapter === 4 && verse === 4) return 'Arjuna';
  if (chapter === 5 && verse === 1) return 'Arjuna';
  if (chapter === 6 && (verse === 33 || verse === 34 || verse === 37 || verse === 38 || verse === 39))
    return 'Arjuna';
  if (chapter === 8 && (verse === 1 || verse === 2)) return 'Arjuna';
  if (chapter === 10 && verse >= 12 && verse <= 18) return 'Arjuna';
  if (chapter === 11) {
    if (verse >= 1 && verse <= 4) return 'Arjuna';
    if (verse >= 9 && verse <= 14) return 'Sañjaya';
    if (verse >= 15 && verse <= 31) return 'Arjuna';
    if (verse === 35 || verse === 50) return 'Sañjaya';
    if (verse >= 36 && verse <= 46) return 'Arjuna';
    if (verse === 51) return 'Arjuna';
    return 'Śrī Kṛṣṇa';
  }
  if (chapter === 12 && verse === 1) return 'Arjuna';
  if (chapter === 14 && verse === 21) return 'Arjuna';
  if (chapter === 17 && verse === 1) return 'Arjuna';
  if (chapter === 18) {
    if (verse === 1 || verse === 73) return 'Arjuna';
    if (verse >= 74 && verse <= 78) return 'Sañjaya';
  }
  return 'Śrī Kṛṣṇa';
}

export function buildAllVerseMetadata(): VerseMetadataRecord[] {
  const records: VerseMetadataRecord[] = [];
  for (const ch of GITA_CHAPTERS) {
    for (let v = 1; v <= ch.verseCount; v++) {
      const verseCode = `${ch.chapterNumber}.${v}`;
      const notable = NOTABLE_VERSES[verseCode];
      const lectures = getAuthorizedLecturesForVerse(verseCode);
      records.push({
        chapterNumber: ch.chapterNumber,
        verseNumber: v,
        verseCode,
        vedabaseUrl: `https://vedabase.io/en/library/bg/${ch.chapterNumber}/${v}/`,
        speaker: notable?.speaker ?? inferSpeaker(ch.chapterNumber, v),
        topicSummary:
          notable?.topicSummary ??
          `Chapter ${ch.chapterNumber} (${ch.transliterationTitle}), Verse ${v} — ${ch.yogaTheme}. Open the verified Vedabase entry for the Sanskrit verse, transliteration, translation, and purport.`,
        keySanskritTerms: notable?.keySanskritTerms ?? [ch.transliterationTitle.toLowerCase()],
        hasAuthorizedAudio: lectures.length > 0,
        audioUrl: lectures[0]?.audioUrl ?? null,
        authorizedLectures: lectures,
      });
    }
  }
  return records;
}

export interface QuizQuestionSeed {
  chapterNumber: number;
  mode:
    | 'comprehension'
    | 'vocabulary'
    | 'missing_word'
    | 'transliteration_order'
    | 'chapter_recap'
    | 'scenario'
    | 'chapter_battle';
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceReference: string;
}

export const VERIFIED_QUIZ_SEEDS: QuizQuestionSeed[] = [
  {
    chapterNumber: 1,
    mode: 'comprehension',
    prompt: 'Who begins the Bhagavad-gītā by inquiring from Sañjaya about the armies gathered at Kurukṣetra?',
    options: ['Dhṛtarāṣṭra', 'Yudhiṣṭhira', 'Bhīṣma', 'Vidura'],
    correctIndex: 0,
    explanation:
      'In Bhagavad-gītā 1.1, King Dhṛtarāṣṭra opens the dialogue by asking Sañjaya what the sons of Pāṇḍu and his own sons did on the field of Kurukṣetra.',
    sourceReference: 'Bg. 1.1 · https://vedabase.io/en/library/bg/1/1/',
  },
  {
    chapterNumber: 1,
    mode: 'vocabulary',
    prompt: 'In Bg. 1.1, what does the compound Sanskrit phrase "dharma-kṣetre" refer to?',
    options: [
      'A place of pilgrimage where religious principles prevail',
      'A chariot drawn by white horses',
      'A conchshell blown before battle',
      'The royal palace of Hastināpura',
    ],
    correctIndex: 0,
    explanation:
      'Kurukṣetra is addressed as dharma-kṣetra—a sacred field of religious principles—highlighting the spiritual gravity of the assembly.',
    sourceReference: 'Bg. 1.1 · https://vedabase.io/en/library/bg/1/1/',
  },
  {
    chapterNumber: 1,
    mode: 'missing_word',
    prompt: 'Complete the Sanskrit opening line of Bg. 1.1: "dharma-kṣetre ____ samavetā yuyutsavaḥ"',
    options: ['kuru-kṣetre', 'mathurā-pure', 'dvārakāyām', 'vṛndāvane'],
    correctIndex: 0,
    explanation:
      'The first line of Bg. 1.1 reads: "dharma-kṣetre kuru-kṣetre samavetā yuyutsavaḥ".',
    sourceReference: 'Bg. 1.1 · https://vedabase.io/en/library/bg/1/1/',
  },
  {
    chapterNumber: 1,
    mode: 'transliteration_order',
    prompt: 'Which sequence preserves the exact opening word order of Bhagavad-gītā 1.1?',
    options: [
      'dharma-kṣetre → kuru-kṣetre → samavetā → yuyutsavaḥ',
      'kuru-kṣetre → samavetā → dharma-kṣetre → yuyutsavaḥ',
      'samavetā → dharma-kṣetre → yuyutsavaḥ → kuru-kṣetre',
      'yuyutsavaḥ → kuru-kṣetre → dharma-kṣetre → samavetā',
    ],
    correctIndex: 0,
    explanation:
      'Bg. 1.1 opens with Dhṛtarāṣṭra’s words: dharma-kṣetre kuru-kṣetre samavetā yuyutsavaḥ.',
    sourceReference: 'Bg. 1.1 · https://vedabase.io/en/library/bg/1/1/',
  },
  {
    chapterNumber: 2,
    mode: 'comprehension',
    prompt: 'In Chapter 2, what analogy does Śrī Kṛṣṇa give in verse 2.13 to explain the continuity of the embodied soul?',
    options: [
      'Passing from boyhood to youth to old age, and similarly to another body',
      'A river merging into the ocean during monsoon season',
      'Sparks flying upward from a forest fire',
      'Clouds forming and dispersing in the autumn sky',
    ],
    correctIndex: 0,
    explanation:
      'In Bg. 2.13 (dehino ’smin yathā dehe kaumāraṁ yauvanaṁ jarā), Kṛṣṇa explains that the soul remains constant while the body undergoes stages of change.',
    sourceReference: 'Bg. 2.13 · https://vedabase.io/en/library/bg/2/13/',
  },
  {
    chapterNumber: 2,
    mode: 'vocabulary',
    prompt: 'In Bg. 2.47, what does "mā phaleṣu kadācana" advise?',
    options: [
      'Never consider yourself entitled to the fruits of your prescribed action',
      'Never perform any action under any circumstance',
      'Seek only material rewards from charitable acts',
      'Abandon one’s duties in society immediately',
    ],
    correctIndex: 0,
    explanation:
      'In Bg. 2.47, Kṛṣṇa teaches Arjuna to focus on his prescribed duty without attachment to the fruits (mā phaleṣu) and without choosing inaction.',
    sourceReference: 'Bg. 2.47 · https://vedabase.io/en/library/bg/2/47/',
  },
  {
    chapterNumber: 3,
    mode: 'chapter_recap',
    prompt: 'According to Chapter 3 (Bg. 3.21), why does a responsible leader set careful standards of action?',
    options: [
      'Because common people follow whatever example a great person sets',
      'To accumulate personal wealth faster than others',
      'To avoid speaking with teachers and elders',
      'Because rituals only work when performed in secret',
    ],
    correctIndex: 0,
    explanation:
      'In Bg. 3.21 (yad yad ācarati śreṣṭhaḥ), Kṛṣṇa emphasizes that society naturally follows the standard set by exemplary leaders.',
    sourceReference: 'Bg. 3.21 · https://vedabase.io/en/library/bg/3/21/',
  },
  {
    chapterNumber: 4,
    mode: 'comprehension',
    prompt: 'What three practices does Bg. 4.34 recommend for learning transcendental truth from a realized teacher?',
    options: [
      'Approaching humbly (praṇipāta), submissive inquiry (paripraśna), and service (sevā)',
      'Debate, solitude, and silent fasting alone',
      'Memorizing grammar without questioning',
      'Travelling to forests without guidance',
    ],
    correctIndex: 0,
    explanation:
      'Bg. 4.34 states: tad viddhi praṇipātena paripraśnena sevayā — learn by humble approach, sincere inquiry, and service.',
    sourceReference: 'Bg. 4.34 · https://vedabase.io/en/library/bg/4/34/',
  },
  {
    chapterNumber: 6,
    mode: 'vocabulary',
    prompt: 'In Bg. 6.5, what dual role can the mind play for a practitioner?',
    options: [
      'Both a friend and an enemy, depending on whether it is regulated',
      'Only an obstacle that can never be trained',
      'An external physical sense organ like the eyes',
      'A temporary illusion that disappears during sleep',
    ],
    correctIndex: 0,
    explanation:
      'Bg. 6.5 explains: bandhur ātmātmanas tasya yenātmaivātmanā jitaḥ — a conquered mind is the best friend, while an uncontrolled mind acts as an enemy.',
    sourceReference: 'Bg. 6.5 · https://vedabase.io/en/library/bg/6/5/',
  },
  {
    chapterNumber: 9,
    mode: 'comprehension',
    prompt: 'What four simple items does Kṛṣṇa say in Bg. 9.26 He gladly accepts when offered with love and devotion?',
    options: [
      'A leaf, a flower, a fruit, or water',
      'Gold, silver, silk, and sandalwood',
      'Chariots, banners, crowns, and gems',
      'Incense, lamps, bells, and drums only',
    ],
    correctIndex: 0,
    explanation:
      'In Bg. 9.26 (patraṁ puṣpaṁ phalaṁ toyam), Kṛṣṇa emphasizes that devotion—not material extravagance—makes an offering dear to Him.',
    sourceReference: 'Bg. 9.26 · https://vedabase.io/en/library/bg/9/26/',
  },
  {
    chapterNumber: 12,
    mode: 'chapter_recap',
    prompt: 'Which chapter of Bhagavad-gītā is specifically titled "Bhakti-yoga" (Devotional Service) and has 20 verses?',
    options: ['Chapter 12', 'Chapter 7', 'Chapter 15', 'Chapter 18'],
    correctIndex: 0,
    explanation:
      'Chapter 12 (Bhakti-yoga) consists of 20 verses focused directly on devotional service and the qualities of a dear devotee.',
    sourceReference: 'Bg. 12 · https://vedabase.io/en/library/bg/12/',
  },
  {
    chapterNumber: 18,
    mode: 'vocabulary',
    prompt: 'In Bg. 18.65, what does the phrase "man-manā bhava mad-bhaktaḥ" encourage?',
    options: [
      'Always think of Kṛṣṇa and become His devotee',
      'Calculate astronomical positions before acting',
      'Retire to a cave without speaking to anyone',
      'Study logic solely for public debate',
    ],
    correctIndex: 0,
    explanation:
      'In Bg. 18.65, Kṛṣṇa summarizes the essence of His instruction: always think of Him, become His devotee, worship Him, and offer obeisances.',
    sourceReference: 'Bg. 18.65 · https://vedabase.io/en/library/bg/18/65/',
  },
  {
    chapterNumber: 2,
    mode: 'scenario',
    prompt: 'A student feels anxious about exam results and struggles to focus on studying. Which principle from Bg. 2.47 applies most directly?',
    options: [
      'Perform your current duty attentively without clinging anxiously to the result',
      'Stop studying completely until anxiety vanishes on its own',
      'Compare grades constantly with peers to stay motivated',
      'Focus only on the reward certificate rather than learning',
    ],
    correctIndex: 0,
    explanation:
      'Bg. 2.47 teaches karmaṇy evādhikāras te mā phaleṣu kadācana: focus wholeheartedly on right action while releasing anxiety over outcomes.',
    sourceReference: 'Bg. 2.47 · https://vedabase.io/en/library/bg/2/47/',
  },
  {
    chapterNumber: 6,
    mode: 'scenario',
    prompt: 'During evening reading, your mind wanders repeatedly to daily distractions. How does Bg. 6.26 advise responding?',
    options: [
      'Gently and steadily bring the wandering mind back under regulation without harsh frustration',
      'Force yourself to stop reading for several months',
      'Assume meditation is only for ancient forest sages',
      'Increase distraction by multitasking while reading',
    ],
    correctIndex: 0,
    explanation:
      'In Bg. 6.26 (yato yato niścarati manaś cañcalam asthiram), Kṛṣṇa advises calmly drawing the restless mind back whenever it wanders.',
    sourceReference: 'Bg. 6.26 · https://vedabase.io/en/library/bg/6/26/',
  },
  {
    chapterNumber: 1,
    mode: 'chapter_battle',
    prompt: 'Chapter 1 Boss Challenge: Whose transcendental conchshell is named Pāñcajanya in Bg. 1.15?',
    options: ['Lord Śrī Kṛṣṇa', 'Arjuna', 'Bhīṣmadeva', 'Yudhiṣṭhira'],
    correctIndex: 0,
    explanation:
      'Bg. 1.15 states: pāñcajanyaṁ hṛṣīkeśo devadattaṁ dhanañjayaḥ — Lord Kṛṣṇa (Hṛṣīkeśa) blew Pāñcajanya, and Arjuna (Dhanañjaya) blew Devadatta.',
    sourceReference: 'Bg. 1.15 · https://vedabase.io/en/library/bg/1/15/',
  },
  {
    chapterNumber: 1,
    mode: 'chapter_battle',
    prompt: 'Chapter 1 Boss Challenge: Why does Arjuna ask Kṛṣṇa to draw his chariot between the two armies in Bg. 1.21–22?',
    options: [
      'To behold who is assembled and eager to fight before battle begins',
      'To escape the battlefield before the conchshells finish sounding',
      'To challenge Bhīṣma to a private archery contest alone',
      'To negotiate a tax treaty with Duryodhana',
    ],
    correctIndex: 0,
    explanation:
      'In Bg. 1.21–22, Arjuna requests Kṛṣṇa (Acyuta) to place the chariot between both armies so he may inspect those present for battle.',
    sourceReference: 'Bg. 1.21–22 · https://vedabase.io/en/library/bg/1/21-22/',
  },
  {
    chapterNumber: 2,
    mode: 'chapter_battle',
    prompt: 'Chapter 2 Boss Challenge: In Bg. 2.7, what pivotal turning point transforms the dialogue from despair to spiritual instruction?',
    options: [
      'Arjuna surrenders as a disciple and asks Kṛṣṇa to instruct him conclusively',
      'Duryodhana withdraws his forces from Kurukṣetra',
      'Sañjaya leaves the palace to join the Pāṇḍava camp',
      'Bhīṣma lowers his bow to address the assembly',
    ],
    correctIndex: 0,
    explanation:
      'In Bg. 2.7 (śiṣyas te ’haṁ śādhi māṁ tvāṁ prapannam), Arjuna formally accepts Kṛṣṇa as his spiritual master, opening the core teachings of the Gītā.',
    sourceReference: 'Bg. 2.7 · https://vedabase.io/en/library/bg/2/7/',
  },
  {
    chapterNumber: 3,
    mode: 'missing_word',
    prompt: 'Complete the opening words of Bg. 3.21: "yad yad ācarati ____ tat tad evetaro janaḥ"',
    options: ['śreṣṭhaḥ', 'dhīraḥ', 'paṇḍitaḥ', 'yogī'],
    correctIndex: 0,
    explanation:
      'Bg. 3.21 reads: yad yad ācarati śreṣṭhas tat tad evetaro janaḥ — whatever action a great person performs, common people follow.',
    sourceReference: 'Bg. 3.21 · https://vedabase.io/en/library/bg/3/21/',
  },
];

export interface AchievementSeed {
  code: string;
  title: string;
  description: string;
  category: 'verse_milestone' | 'chapter_milestone' | 'consistency' | 'knowledge' | 'garden';
  xpReward: number;
  gardenRewardCode: string | null;
  unlockEnvironmentCode: string | null;
  targetCount: number;
}

export const ACHIEVEMENT_SEEDS: AchievementSeed[] = [
  {
    code: 'first_verse',
    title: 'First Verse Explored',
    description: 'Completed your very first verse on the 700-verse path.',
    category: 'verse_milestone',
    xpReward: 25,
    gardenRewardCode: 'lotus_blue',
    unlockEnvironmentCode: null,
    targetCount: 1,
  },
  {
    code: 'verses_10',
    title: 'Ten Steps on the Path',
    description: 'Completed 10 verses with steady curiosity.',
    category: 'verse_milestone',
    xpReward: 50,
    gardenRewardCode: 'stone_path',
    unlockEnvironmentCode: null,
    targetCount: 10,
  },
  {
    code: 'verses_50',
    title: 'Fifty Verses Marked',
    description: 'Completed 50 verses across your reading sessions.',
    category: 'verse_milestone',
    xpReward: 120,
    gardenRewardCode: 'tulasi_grove',
    unlockEnvironmentCode: 'vrindavan_grove',
    targetCount: 50,
  },
  {
    code: 'verses_108',
    title: '108 Verses Milestone',
    description: 'Completed 108 verses in your personal study archive.',
    category: 'verse_milestone',
    xpReward: 250,
    gardenRewardCode: 'brass_diya',
    unlockEnvironmentCode: 'temple_courtyard',
    targetCount: 108,
  },
  {
    code: 'verses_350',
    title: 'Halfway Through the Gītā',
    description: 'Completed 350 of the 700 verses of Bhagavad-gītā.',
    category: 'verse_milestone',
    xpReward: 400,
    gardenRewardCode: 'yamuna_pond',
    unlockEnvironmentCode: null,
    targetCount: 350,
  },
  {
    code: 'verses_700',
    title: '700-Verse Completion',
    description: 'Completed all 700 verses across all 18 chapters of Bhagavad-gītā.',
    category: 'verse_milestone',
    xpReward: 1000,
    gardenRewardCode: 'peacock',
    unlockEnvironmentCode: 'navadvipa_dawn',
    targetCount: 700,
  },
  {
    code: 'chapter_1_complete',
    title: 'Chapter 1 Completed',
    description: 'Completed all 46 verses of Observing the Armies on Kurukṣetra.',
    category: 'chapter_milestone',
    xpReward: 100,
    gardenRewardCode: 'kadamba_tree',
    unlockEnvironmentCode: null,
    targetCount: 1,
  },
  {
    code: 'chapters_6_complete',
    title: 'First Six Chapters',
    description: 'Completed Chapters 1 through 6 (Karma-yoga section).',
    category: 'chapter_milestone',
    xpReward: 300,
    gardenRewardCode: 'jasmine_arch',
    unlockEnvironmentCode: null,
    targetCount: 6,
  },
  {
    code: 'quiz_scholar',
    title: 'Reflective Scholar',
    description: 'Answered 5 verified chapter knowledge questions accurately.',
    category: 'knowledge',
    xpReward: 75,
    gardenRewardCode: null,
    unlockEnvironmentCode: null,
    targetCount: 5,
  },
];

export interface GardenCatalogItem {
  code: string;
  name: string;
  description: string;
  unlockHint: string;
  defaultX: number;
  defaultY: number;
}

export const GARDEN_CATALOG: GardenCatalogItem[] = [
  {
    code: 'lotus_blue',
    name: 'Blue Yamuna Lotus',
    description: 'A calm lotus blossom symbolizing serene beginning in study.',
    unlockHint: 'Complete your first verse',
    defaultX: 24,
    defaultY: 68,
  },
  {
    code: 'stone_path',
    name: 'Sandstone Garden Path',
    description: 'Hand-laid stepping stones marking steady daily steps.',
    unlockHint: 'Complete 10 verses',
    defaultX: 50,
    defaultY: 78,
  },
  {
    code: 'tulasi_grove',
    name: 'Tulasī Courtyard Planter',
    description: 'Traditional carved courtyard planter with flourishing leaves.',
    unlockHint: 'Complete 50 verses',
    defaultX: 38,
    defaultY: 54,
  },
  {
    code: 'kadamba_tree',
    name: 'Kadamba Shade Tree',
    description: 'Fragrant golden-flowered kadamba canopy along the riverbank.',
    unlockHint: 'Complete Chapter 1 (46 verses)',
    defaultX: 16,
    defaultY: 36,
  },
  {
    code: 'brass_diya',
    name: 'Evening Brass Dīpa',
    description: 'Warm oil lamp illuminating quiet evening reflection.',
    unlockHint: 'Complete 108 verses',
    defaultX: 66,
    defaultY: 62,
  },
  {
    code: 'yamuna_pond',
    name: 'Reflective Lotus Pool',
    description: 'Still mirror pool reflecting sky and temple lanterns.',
    unlockHint: 'Complete 350 verses',
    defaultX: 74,
    defaultY: 74,
  },
  {
    code: 'jasmine_arch',
    name: 'Jasmine & Marigold Archway',
    description: 'Floral sandstone archway celebrating six completed chapters.',
    unlockHint: 'Complete 6 chapters',
    defaultX: 50,
    defaultY: 30,
  },
  {
    code: 'peacock',
    name: 'Garden Peacock',
    description: 'Graceful ornamental peacock visiting the completed garden.',
    unlockHint: 'Complete all 700 verses',
    defaultX: 82,
    defaultY: 52,
  },
];

export const XP_RULE_SEEDS = [
  {
    code: 'verse_complete',
    label: 'Verse Completion',
    xpAmount: 10,
    description: 'Awarded once per unique verse completed.',
  },
  {
    code: 'purport_bonus',
    label: 'Purport Reading Bonus',
    xpAmount: 5,
    description: 'Optional bonus when reading the Vedabase purport alongside a verse.',
  },
  {
    code: 'reflection_bonus',
    label: 'Personal Reflection Note',
    xpAmount: 5,
    description: 'Awarded once per verse when recording a thoughtful reflection.',
  },
  {
    code: 'chapter_complete',
    label: 'Chapter Completion Milestone',
    xpAmount: 100,
    description: 'Awarded once when all verses in a chapter are completed.',
  },
  {
    code: 'quiz_correct',
    label: 'Play & Learn Question',
    xpAmount: 15,
    description: 'Awarded once per quiz question answered accurately.',
  },
  {
    code: 'daily_mission_complete',
    label: 'Daily Mission Target Met',
    xpAmount: 25,
    description: 'Awarded once per calendar day when your chosen daily target is met.',
  },
];

export const NOTIFICATION_TEMPLATE_SEEDS = [
  {
    code: 'morning_reminder',
    category: 'morning_reminder',
    titleTemplate: 'Morning Reading Invitation',
    bodyTemplate: 'Your calm reading space is ready for today’s target ({{target}} verses).',
  },
  {
    code: 'evening_reminder',
    category: 'evening_reminder',
    titleTemplate: 'Quiet Evening Reflection',
    bodyTemplate: 'If you have a few peaceful minutes, your bookmark awaits at Bg. {{lastVerse}}.',
  },
  {
    code: 'chapter_unlock',
    category: 'chapter_unlock',
    titleTemplate: 'Chapter {{chapterNumber}} Unlocked',
    bodyTemplate: 'You completed Chapter {{prevChapter}} and unlocked {{chapterTitle}}.',
  },
  {
    code: 'milestone',
    category: 'milestone',
    titleTemplate: 'Study Milestone Reached',
    bodyTemplate: 'You reached {{milestoneTitle}} on your 700-verse journey.',
  },
  {
    code: 'welcome_back',
    category: 'welcome_back',
    titleTemplate: 'Welcome Back to Your Reading',
    bodyTemplate: 'Your progress is safely preserved. Continue gently whenever you wish.',
  },
  {
    code: 'weekly_summary',
    category: 'weekly_summary',
    titleTemplate: 'Weekly Study Summary',
    bodyTemplate: 'You explored {{weeklyVerses}} verses this week across your reading journey.',
  },
];

export interface SanskritMatchSet {
  id: string;
  chapterNumber: number;
  title: string;
  sourceReference: string;
  pairs: Array<{ term: string; meaning: string }>;
}

export const SANSKRIT_MATCH_SETS: SanskritMatchSet[] = [
  {
    id: 'match_ch1',
    chapterNumber: 1,
    title: 'Chapter 1: Kurukṣetra Opening Terms',
    sourceReference: 'Bg. 1.1–1.15 · https://vedabase.io/en/library/bg/1/1/',
    pairs: [
      { term: 'dharma-kṣetre', meaning: 'Place of pilgrimage / religious principles' },
      { term: 'yuyutsavaḥ', meaning: 'Desiring to fight' },
      { term: 'pāñcajanyam', meaning: 'Śrī Kṛṣṇa’s transcendental conchshell' },
      { term: 'hṛṣīkeśa', meaning: 'Master of the senses (Śrī Kṛṣṇa)' },
    ],
  },
  {
    id: 'match_ch2',
    chapterNumber: 2,
    title: 'Chapter 2: The Soul & Steady Wisdom',
    sourceReference: 'Bg. 2.13–2.55 · https://vedabase.io/en/library/bg/2/13/',
    pairs: [
      { term: 'dehī', meaning: 'The embodied living entity (soul)' },
      { term: 'dhīraḥ', meaning: 'Sober, steady, undisturbed person' },
      { term: 'śiṣyaḥ', meaning: 'Humble disciple seeking instruction' },
      { term: 'sthita-prajña', meaning: 'One situated in steady transcendental wisdom' },
    ],
  },
  {
    id: 'match_ch9_18',
    chapterNumber: 9,
    title: 'Chapters 9 & 18: Devotional Vocabulary',
    sourceReference: 'Bg. 9.26 & 18.65 · https://vedabase.io/en/library/bg/9/26/',
    pairs: [
      { term: 'patram', meaning: 'A simple leaf offered with devotion' },
      { term: 'bhaktyā', meaning: 'With loving devotion' },
      { term: 'man-manā', meaning: 'With mind always absorbed in Me' },
      { term: 'śaraṇam', meaning: 'Taking sincere shelter / refuge' },
    ],
  },
];

export interface VerseOrderChallenge {
  id: string;
  chapterNumber: number;
  verseCode: string;
  title: string;
  orderedTokens: string[];
  explanation: string;
  sourceReference: string;
}

export const VERSE_ORDER_CHALLENGES: VerseOrderChallenge[] = [
  {
    id: 'order_1_1',
    chapterNumber: 1,
    verseCode: '1.1',
    title: 'Opening Line of Bhagavad-gītā (Bg. 1.1)',
    orderedTokens: ['dharma-kṣetre', 'kuru-kṣetre', 'samavetā', 'yuyutsavaḥ'],
    explanation:
      'Dhṛtarāṣṭra begins: dharma-kṣetre kuru-kṣetre samavetā yuyutsavaḥ (“assembled at the holy place of Kurukṣetra desiring to fight”).',
    sourceReference: 'Bg. 1.1 · https://vedabase.io/en/library/bg/1/1/',
  },
  {
    id: 'order_2_47',
    chapterNumber: 2,
    verseCode: '2.47',
    title: 'Duty Without Attachment to Fruits (Bg. 2.47)',
    orderedTokens: ['karmaṇy', 'evādhikāras te', 'mā phaleṣu', 'kadācana'],
    explanation:
      'Kṛṣṇa instructs: karmaṇy evādhikāras te mā phaleṣu kadācana — you have a right to perform your prescribed duty, not to the fruits of action.',
    sourceReference: 'Bg. 2.47 · https://vedabase.io/en/library/bg/2/47/',
  },
  {
    id: 'order_9_26',
    chapterNumber: 9,
    verseCode: '9.26',
    title: 'Offerings Accepted with Devotion (Bg. 9.26)',
    orderedTokens: ['patraṁ', 'puṣpaṁ', 'phalaṁ', 'toyam'],
    explanation:
      'In Bg. 9.26, Kṛṣṇa lists the four simple offerings He accepts when presented with devotion: patraṁ puṣpaṁ phalaṁ toyam (leaf, flower, fruit, water).',
    sourceReference: 'Bg. 9.26 · https://vedabase.io/en/library/bg/9/26/',
  },
  {
    id: 'order_18_65',
    chapterNumber: 18,
    verseCode: '18.65',
    title: 'Essence of the Dialogue (Bg. 18.65)',
    orderedTokens: ['man-manā', 'bhava', 'mad-bhakto', 'mad-yājī'],
    explanation:
      'Bg. 18.65 concludes: man-manā bhava mad-bhakto mad-yājī māṁ namaskuru (“Always think of Me, become My devotee, worship Me, and offer homage unto Me”).',
    sourceReference: 'Bg. 18.65 · https://vedabase.io/en/library/bg/18/65/',
  },
];

export interface QuestDefinition {
  code: string;
  title: string;
  category: 'daily' | 'understanding' | 'memory' | 'sanskrit' | 'challenge' | 'chapter' | 'consistency';
  periodType: 'daily' | 'journey';
  description: string;
  objectiveLabel: string;
  xpReward: number;
  targetCount: number; // 0 means dynamic (e.g. dailyVerseTarget or active chapter count)
  actionNav: 'reading' | 'play' | 'map' | 'progress';
  actionLabel: string;
}

export const QUEST_CATALOG: QuestDefinition[] = [
  {
    code: 'daily_reading_quest',
    title: 'Daily Reading Quest',
    category: 'daily',
    periodType: 'daily',
    description: 'Read and record your daily verse target at your own calm pace.',
    objectiveLabel: 'Complete today’s verse target',
    xpReward: 25,
    targetCount: 0,
    actionNav: 'reading',
    actionLabel: 'Open Reading Room',
  },
  {
    code: 'understand_teaching',
    title: 'Understand the Teaching',
    category: 'understanding',
    periodType: 'journey',
    description: 'Study verses together with Śrīla Prabhupāda’s purport on Vedabase or imported editions.',
    objectiveLabel: 'Read 3 verses with purport checked',
    xpReward: 30,
    targetCount: 3,
    actionNav: 'reading',
    actionLabel: 'Study Purports',
  },
  {
    code: 'remember_verse',
    title: 'Remember the Verse',
    category: 'memory',
    periodType: 'journey',
    description: 'Save meaningful verses with bookmarks or record personal study reflections.',
    objectiveLabel: 'Save 3 bookmarks or personal reflections',
    xpReward: 25,
    targetCount: 3,
    actionNav: 'reading',
    actionLabel: 'Save Notes & Bookmarks',
  },
  {
    code: 'sanskrit_explorer',
    title: 'Sanskrit Explorer',
    category: 'sanskrit',
    periodType: 'journey',
    description: 'Explore Sanskrit vocabulary and word-order sequences from verified verses.',
    objectiveLabel: 'Complete 2 Sanskrit or Word-Order challenges',
    xpReward: 35,
    targetCount: 2,
    actionNav: 'play',
    actionLabel: 'Practice Sanskrit',
  },
  {
    code: 'wisdom_challenge',
    title: 'Wisdom Challenge',
    category: 'challenge',
    periodType: 'journey',
    description: 'Test comprehension across chapter wisdom and scenario questions.',
    objectiveLabel: 'Answer 3 knowledge challenges accurately',
    xpReward: 40,
    targetCount: 3,
    actionNav: 'play',
    actionLabel: 'Enter Challenges',
  },
  {
    code: 'chapter_completion_quest',
    title: 'Chapter Completion Quest',
    category: 'chapter',
    periodType: 'journey',
    description: 'Finish every verse in your current chapter to unlock the next region on the World Map.',
    objectiveLabel: 'Complete your current unlocked chapter',
    xpReward: 100,
    targetCount: 0,
    actionNav: 'map',
    actionLabel: 'View Chapter Path',
  },
  {
    code: 'consistency_quest',
    title: 'Consistency Quest',
    category: 'consistency',
    periodType: 'journey',
    description: 'Return to read across 3 distinct days. Missed days never deduct XP.',
    objectiveLabel: 'Read on 3 distinct calendar days',
    xpReward: 50,
    targetCount: 3,
    actionNav: 'reading',
    actionLabel: 'Continue Daily Habit',
  },
];

export type SkillBranch =
  | 'Reading Consistency'
  | 'Verse Memory'
  | 'Sanskrit Vocabulary'
  | 'Scripture Understanding'
  | 'Chapter Mastery';

export interface SkillNodeSpec {
  code: string;
  branch: SkillBranch;
  tier: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  requirementLabel: string;
  metricKey:
    | 'activeDays'
    | 'memoryItems'
    | 'sanskritCompleted'
    | 'understandingActions'
    | 'completedChapters';
  threshold: number;
  prerequisiteCode: string | null;
  xpReward: number;
}

export const SKILL_TREE_NODES: SkillNodeSpec[] = [
  // Branch 1: Reading Consistency
  {
    code: 'consistency_1',
    branch: 'Reading Consistency',
    tier: 1,
    title: 'Steady Beginning',
    description: 'Establish your first calendar day of mindful Gītā reading.',
    requirementLabel: '1 active reading day',
    metricKey: 'activeDays',
    threshold: 1,
    prerequisiteCode: null,
    xpReward: 15,
  },
  {
    code: 'consistency_2',
    branch: 'Reading Consistency',
    tier: 2,
    title: 'Gentle Rhythm',
    description: 'Return to the scripture across multiple days without rush.',
    requirementLabel: '3 active reading days',
    metricKey: 'activeDays',
    threshold: 3,
    prerequisiteCode: 'consistency_1',
    xpReward: 30,
  },
  {
    code: 'consistency_3',
    branch: 'Reading Consistency',
    tier: 3,
    title: 'Habitual Reader',
    description: 'Sustain a steady week-plus cumulative reading cadence.',
    requirementLabel: '7 active reading days',
    metricKey: 'activeDays',
    threshold: 7,
    prerequisiteCode: 'consistency_2',
    xpReward: 60,
  },

  // Branch 2: Verse Memory
  {
    code: 'memory_1',
    branch: 'Verse Memory',
    tier: 1,
    title: 'First Keep',
    description: 'Bookmark a verse or record your first personal reflection note.',
    requirementLabel: '1 bookmark or reflection',
    metricKey: 'memoryItems',
    threshold: 1,
    prerequisiteCode: null,
    xpReward: 15,
  },
  {
    code: 'memory_2',
    branch: 'Verse Memory',
    tier: 2,
    title: 'Verse Curator',
    description: 'Build a personal collection of key verses and takeaways.',
    requirementLabel: '5 bookmarks or reflections',
    metricKey: 'memoryItems',
    threshold: 5,
    prerequisiteCode: 'memory_1',
    xpReward: 35,
  },
  {
    code: 'memory_3',
    branch: 'Verse Memory',
    tier: 3,
    title: 'Living Archive',
    description: 'Maintain an extensive study archive for spaced revision.',
    requirementLabel: '12 bookmarks or reflections',
    metricKey: 'memoryItems',
    threshold: 12,
    prerequisiteCode: 'memory_2',
    xpReward: 65,
  },

  // Branch 3: Sanskrit Vocabulary
  {
    code: 'sanskrit_1',
    branch: 'Sanskrit Vocabulary',
    tier: 1,
    title: 'Root Listener',
    description: 'Complete a Sanskrit vocabulary or word-matching activity.',
    requirementLabel: '1 Sanskrit activity',
    metricKey: 'sanskritCompleted',
    threshold: 1,
    prerequisiteCode: null,
    xpReward: 20,
  },
  {
    code: 'sanskrit_2',
    branch: 'Sanskrit Vocabulary',
    tier: 2,
    title: 'Term Builder',
    description: 'Recognize key Bhagavad-gītā terms and word sequences.',
    requirementLabel: '3 Sanskrit activities',
    metricKey: 'sanskritCompleted',
    threshold: 3,
    prerequisiteCode: 'sanskrit_1',
    xpReward: 40,
  },
  {
    code: 'sanskrit_3',
    branch: 'Sanskrit Vocabulary',
    tier: 3,
    title: 'Sanskrit Pathfinder',
    description: 'Navigate Devanāgarī & IAST vocabulary comfortably.',
    requirementLabel: '5 Sanskrit activities',
    metricKey: 'sanskritCompleted',
    threshold: 5,
    prerequisiteCode: 'sanskrit_2',
    xpReward: 70,
  },

  // Branch 4: Scripture Understanding
  {
    code: 'understanding_1',
    branch: 'Scripture Understanding',
    tier: 1,
    title: 'Purport Seeker',
    description: 'Examine commentary or complete a comprehension check.',
    requirementLabel: '1 purport or comprehension challenge',
    metricKey: 'understandingActions',
    threshold: 1,
    prerequisiteCode: null,
    xpReward: 20,
  },
  {
    code: 'understanding_2',
    branch: 'Scripture Understanding',
    tier: 2,
    title: 'Context Thinker',
    description: 'Connect chapter context across purports and scenarios.',
    requirementLabel: '5 purports or challenges',
    metricKey: 'understandingActions',
    threshold: 5,
    prerequisiteCode: 'understanding_1',
    xpReward: 45,
  },
  {
    code: 'understanding_3',
    branch: 'Scripture Understanding',
    tier: 3,
    title: 'Deep Synthesis',
    description: 'Demonstrate thoughtful engagement across teachings.',
    requirementLabel: '12 purports or challenges',
    metricKey: 'understandingActions',
    threshold: 12,
    prerequisiteCode: 'understanding_2',
    xpReward: 80,
  },

  // Branch 5: Chapter Mastery
  {
    code: 'mastery_1',
    branch: 'Chapter Mastery',
    tier: 1,
    title: 'Kurukṣetra Witness',
    description: 'Complete every verse of Chapter 1.',
    requirementLabel: '1 chapter completed',
    metricKey: 'completedChapters',
    threshold: 1,
    prerequisiteCode: null,
    xpReward: 50,
  },
  {
    code: 'mastery_2',
    branch: 'Chapter Mastery',
    tier: 2,
    title: 'Karma-Yoga Traveler',
    description: 'Complete three full chapters on the world map.',
    requirementLabel: '3 chapters completed',
    metricKey: 'completedChapters',
    threshold: 3,
    prerequisiteCode: 'mastery_1',
    xpReward: 100,
  },
  {
    code: 'mastery_3',
    branch: 'Chapter Mastery',
    tier: 3,
    title: 'Six-Chapter Scholar',
    description: 'Finish the first six-chapter section (Karma-yoga).',
    requirementLabel: '6 chapters completed',
    metricKey: 'completedChapters',
    threshold: 6,
    prerequisiteCode: 'mastery_2',
    xpReward: 150,
  },
  {
    code: 'mastery_4',
    branch: 'Chapter Mastery',
    tier: 4,
    title: 'Complete Path Finisher',
    description: 'Finish all 18 chapters and 700 verses.',
    requirementLabel: '18 chapters completed',
    metricKey: 'completedChapters',
    threshold: 18,
    prerequisiteCode: 'mastery_3',
    xpReward: 300,
  },
];

export interface GardenEnvironmentSpec {
  code: 'yamuna_sanctuary' | 'vrindavan_grove' | 'temple_courtyard' | 'navadvipa_dawn';
  name: string;
  description: string;
  requiredVerses: number;
  skyTop: string;
  skyBottom: string;
  waterColor: string;
  meadowColor: string;
  accentStroke: string;
}

export const GARDEN_ENVIRONMENTS: GardenEnvironmentSpec[] = [
  {
    code: 'yamuna_sanctuary',
    name: 'Yamuna Riverbank',
    description: 'Quiet twilight riverbank beside calm indigo waters.',
    requiredVerses: 0,
    skyTop: '#dbe7f3',
    skyBottom: '#f2f6fb',
    waterColor: '#5c8cb8',
    meadowColor: '#8eb18c',
    accentStroke: '#1b436b',
  },
  {
    code: 'vrindavan_grove',
    name: 'Vrindavan Grove',
    description: 'Sheltered courtyard grove unlocked at 50 completed verses.',
    requiredVerses: 50,
    skyTop: '#d7eadf',
    skyBottom: '#f2f8f3',
    waterColor: '#4c8b8b',
    meadowColor: '#6f9f78',
    accentStroke: '#2d6a4f',
  },
  {
    code: 'temple_courtyard',
    name: 'Sandstone Temple Courtyard',
    description: 'Warm sandstone colonnade unlocked at 108 completed verses.',
    requiredVerses: 108,
    skyTop: '#efe3cf',
    skyBottom: '#faf6ee',
    waterColor: '#4f76a8',
    meadowColor: '#98a67c',
    accentStroke: '#9b6c16',
  },
  {
    code: 'navadvipa_dawn',
    name: 'Navadvīpa Golden Dawn',
    description: 'Radiant sunrise sanctuary unlocked upon completing all 700 verses.',
    requiredVerses: 700,
    skyTop: '#f6dec0',
    skyBottom: '#fcf7ee',
    waterColor: '#628db5',
    meadowColor: '#8aa879',
    accentStroke: '#a64b0a',
  },
];

