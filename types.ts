
export enum VowelCategory {
  ORAL = 'Oral Vowels',
  NASAL = 'Nasal Vowels',
  CONTRAST = 'Critical Contrasts',
  ROUTINE = 'Daily Routine',
  GENERATOR = 'Smart Text'
}

export enum PlayMode {
  SLOW = 'slow',
  NORMAL = 'normal',
  SENTENCE = 'sentence'
}

export interface WordExample {
  word: string;
  sentence: string;
  highlight: string; // The substring to color-code (e.g., "ai" in "lait")
  highlightOccurrence?: number; // Optional: 1-based index of which occurrence to highlight
}

export interface PhonemeData {
  id: string; // Unique ID for audio file mapping
  ipa: string;
  name: string;
  spellings: string;
  examples: WordExample[];
  exceptions?: WordExample[]; // New list for exceptions
  georgianTip: string;
  fix: string;
  comparison?: string;
  colorTheme: string; // Tailwind color name (e.g., 'amber', 'rose', 'indigo')
}

export interface ContrastItem {
  word: string;
  ipa: string;
  meaning: string;
  sentence: string;
  highlight: string;
  colorTheme?: string;
}

export interface ContrastPairData {
  id: string;
  name: string;
  pair: [ContrastItem, ContrastItem];
  note: string;
}

export interface RoutineStep {
  title: string;
  instruction: string;
  sequence: string[];
  note: string;
}

export interface AnalyzedSegment {
  text: string;
  vowelId?: string; // Matches PhonemeData.id
}
