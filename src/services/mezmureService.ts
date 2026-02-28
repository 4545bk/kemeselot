/**
 * Mezmure Dawit Service
 *
 * Uses the real data.json provided by the user:
 *   { id: number, chapter: string, text: string }
 *
 * `text` contains all verses as a single Ge'ez string with \n separators.
 *
 * Ethiopian Orthodox 7-day reading schedule:
 *   Sunday    (0): Psalms 1–21
 *   Monday    (1): Psalms 22–41
 *   Tuesday   (2): Psalms 42–61
 *   Wednesday (3): Psalms 62–77
 *   Thursday  (4): Psalms 78–100
 *   Friday    (5): Psalms 101–118
 *   Saturday  (6): Psalms 119–151
 */

import psalmsData from '../../assets/data/mezmure_dawit.json';

// ---------- Types ----------

export interface Psalm {
  id: number;
  chapter: string;       // e.g. "መዝሙር 23"
  text: string;          // Full Ge'ez text with all verses
  titleAmharic: string;  // Derived from chapter field
  titleEnglish: string;  // e.g. "Psalm 23"
  verses: string[];      // Split by \n for display
}

export interface DailyReading {
  dayName: string;
  dayNameAmharic: string;
  psalms: Psalm[];
  psalmRange: string;    // e.g. "Psalms 1–21"
}

export interface EthiopianDate {
  dayName: string;
  dayNameAmharic: string;
  dayOfWeek: number;
  day: number;
  month: string;
  year: number;
}

// ---------- Ethiopian Calendar ----------

const ETH_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir',
  'Yekatit', 'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagumen',
];

const DAY_NAMES_AMHARIC = [
  'እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ',
];
const DAY_NAMES_ENGLISH = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

export function toEthiopianDate(date: Date): EthiopianDate {
  const jdn = Math.floor(date.getTime() / 86400000) + 2440588;
  const r = (jdn - 1723856) % 1461;
  const n = r % 365 + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = n % 30 + 1;
  const dow = date.getDay();

  return {
    dayName: DAY_NAMES_ENGLISH[dow],
    dayNameAmharic: DAY_NAMES_AMHARIC[dow],
    dayOfWeek: dow,
    day,
    month: ETH_MONTHS[month - 1] ?? 'Unknown',
    year,
  };
}

export function getTodayEthiopianDate(): EthiopianDate {
  return toEthiopianDate(new Date());
}

// ---------- Data Processing ----------

// Parse and enrich the raw JSON into Psalm objects
const ALL_PSALMS: Psalm[] = (psalmsData as Array<{ id: number; chapter: string; text: string }>).map(
  raw => ({
    id: raw.id,
    chapter: raw.chapter,
    text: raw.text,
    titleAmharic: raw.chapter,
    titleEnglish: `Psalm ${raw.id}`,
    verses: raw.text.split('\n').filter(v => v.trim().length > 0),
  }),
);

// 7-day reading schedule by psalm ID ranges
const WEEKLY_SCHEDULE: Array<{ start: number; end: number }> = [
  { start: 1, end: 21 },    // Sunday
  { start: 22, end: 41 },   // Monday
  { start: 42, end: 61 },   // Tuesday
  { start: 62, end: 77 },   // Wednesday
  { start: 78, end: 100 },  // Thursday
  { start: 101, end: 118 }, // Friday
  { start: 119, end: 151 }, // Saturday
];

function getPsalmsForDay(dayOfWeek: number): Psalm[] {
  const range = WEEKLY_SCHEDULE[dayOfWeek];
  if (!range) return ALL_PSALMS.slice(0, 20);
  return ALL_PSALMS.filter(p => p.id >= range.start && p.id <= range.end);
}

// ---------- Public API ----------

export function getTodayPsalms(): DailyReading {
  const ethDate = getTodayEthiopianDate();
  const dow = ethDate.dayOfWeek;
  const psalms = getPsalmsForDay(dow);
  const range = WEEKLY_SCHEDULE[dow];

  return {
    dayName: ethDate.dayName,
    dayNameAmharic: ethDate.dayNameAmharic,
    psalms,
    psalmRange: range ? `Psalms ${range.start}–${range.end}` : 'Daily Reading',
  };
}

export function getPsalmById(id: number): Psalm | undefined {
  return ALL_PSALMS.find(p => p.id === id);
}

export function getRandomTodayPsalm(): Psalm {
  const psalms = getPsalmsForDay(new Date().getDay());
  return psalms[Math.floor(Math.random() * psalms.length)];
}

export function getWeeklySchedule(): DailyReading[] {
  return WEEKLY_SCHEDULE.map((range, dow) => ({
    dayName: DAY_NAMES_ENGLISH[dow],
    dayNameAmharic: DAY_NAMES_AMHARIC[dow],
    psalms: getPsalmsForDay(dow),
    psalmRange: `Psalms ${range.start}–${range.end}`,
  }));
}

export function getAllPsalms(): Psalm[] {
  return ALL_PSALMS;
}

export function searchPsalms(query: string): Psalm[] {
  const q = query.toLowerCase();
  return ALL_PSALMS.filter(
    p =>
      p.text.toLowerCase().includes(q) ||
      p.chapter.includes(q) ||
      p.titleEnglish.toLowerCase().includes(q),
  );
}

const SPIRITUAL_QUOTES = [
  { text: 'የሚሰማኝ ግን በእርጋታ ይቀመጣል፥ ከክፉም መከራ ያርፋል።', source: 'Proverbs 1:33' },
  { text: 'እግዚአብሔር ብርሃኔና መድኃኒቴ ነው፤ የሚያስፈራኝ ማን ነው?', source: 'Psalm 27:1' },
  { text: 'ሁልጊዜ በጌታ ደስ ይበላችሁ፤ ደግሜ እላለሁ፥ ደስ ይበላችሁ።', source: 'Philippians 4:4' },
  { text: 'በእግዚአብሔር የታመነ ሰው ግን በደስታ ይሞላል።', source: 'Spiritual Wisdom' },
];

export function getDailyQuote() {
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return SPIRITUAL_QUOTES[dayOfYear % SPIRITUAL_QUOTES.length];
}

export default {
  getTodayPsalms,
  getWeeklySchedule,
  getTodayEthiopianDate,
  getPsalmById,
  getRandomTodayPsalm,
  getAllPsalms,
  searchPsalms,
  getDailyQuote,
};
