import { PhonemeData, ContrastPairData, RoutineStep } from './types';

export const ORAL_VOWELS: PhonemeData[] = [
  // --- ANCHORS (The corners of the vowel space) ---
  {
    id: 'open-a',
    ipa: 'a',
    name: 'Open A',
    spellings: 'a, à, â',
    colorTheme: 'amber',
    examples: [
      { word: 'papa', sentence: 'Papa est là.', highlight: 'a' },
      { word: 'là', sentence: 'Il est là.', highlight: 'à' },
      { word: 'pâte', sentence: 'J\'aime les pâtes.', highlight: 'â' }
    ],
    exceptions: [
      { word: 'femme', sentence: 'Quelle femme !', highlight: 'e', highlightOccurrence: 1 },
      { word: 'solennel', sentence: 'Un moment solennel.', highlight: 'e', highlightOccurrence: 1 }
    ],
    comparison: 'Closest to Georgian ა',
    georgianTip: 'Further forward than Georgian ა.',
    fix: 'Open mouth more than for ა, tongue low and forward.'
  },
  {
    id: 'i',
    ipa: 'i',
    name: 'i',
    spellings: 'i, y, î',
    colorTheme: 'cyan',
    examples: [
      { word: 'ici', sentence: 'Je suis ici.', highlight: 'i' },
      { word: 'vie', sentence: 'C\'est la vie.', highlight: 'ie' },
      { word: 'stylo', sentence: 'Mon stylo bleu.', highlight: 'y' },
      { word: 'île', sentence: 'Une île déserte.', highlight: 'î' }
    ],
    comparison: 'Same as Georgian ი',
    georgianTip: 'No issues expected.',
    fix: 'Standard pronunciation.'
  },
  {
    id: 'ou',
    ipa: 'u',
    name: 'ou',
    spellings: 'ou, où',
    colorTheme: 'violet',
    examples: [
      { word: 'tout', sentence: 'C\'est tout ?', highlight: 'ou' },
      { word: 'rouge', sentence: 'Le feu est rouge.', highlight: 'ou' },
      { word: 'où', sentence: 'Où vas-tu ?', highlight: 'où' }
    ],
    comparison: 'Close to Georgian უ but less front',
    georgianTip: 'You can start from the Georgian უ, but it is not exactly the same sound.',
    fix: 'Push tongue far back, lips tight and very rounded.'
  },
  {
    id: 'u',
    ipa: 'y',
    name: 'u',
    spellings: 'u, û',
    colorTheme: 'fuchsia',
    examples: [
      { word: 'lune', sentence: 'Regarde la lune.', highlight: 'u' },
      { word: 'tu', sentence: 'Tu es prêt ?', highlight: 'u' },
      { word: 'sûr', sentence: 'Tu es sûr ?', highlight: 'û' }
    ],
    exceptions: [
      { word: 'eu', sentence: 'J\'ai eu peur.', highlight: 'eu' } // Participle 'eu' is /y/
    ],
    comparison: 'Uniquely French',
    georgianTip: '#1 hardest vowel. Say Georgian ი, keep tongue there, round lips like უ.',
    fix: 'Tongue forward (like i), Lips rounded (like u).'
  },

  // --- PAIR: E (Closed vs Open) ---
  {
    id: 'closed-e',
    ipa: 'e',
    name: 'Closed E',
    spellings: 'é, er, ez, ed, et',
    colorTheme: 'emerald',
    examples: [
      { word: 'été', sentence: 'J\'aime l\'été.', highlight: 'é' },
      { word: 'parler', sentence: 'Je veux parler.', highlight: 'er' },
      { word: 'nez', sentence: 'Il a un gros nez.', highlight: 'ez' },
      { word: 'pied', sentence: 'J\'ai mal au pied.', highlight: 'ed' },
      { word: 'jouet', sentence: 'Un beau jouet.', highlight: 'et' }
    ],
    comparison: 'No Georgian equivalent',
    georgianTip: 'Georgians often merge /e/ and /ɛ/ into ე. Avoid this.',
    fix: 'Keep vowel high and tense, no glide toward "i".'
  },
  {
    id: 'open-e',
    ipa: 'ɛ',
    name: 'Open E',
    spellings: 'è, ê, ai, ei, e (+cons)',
    colorTheme: 'lime',
    examples: [
      { word: 'mère', sentence: 'Ma mère est gentille.', highlight: 'è' },
      { word: 'tête', sentence: 'J\'ai mal à la tête.', highlight: 'ê' },
      { word: 'maîtresse', sentence: 'La maîtresse explique.', highlight: 'aî' },
      { word: 'sel', sentence: 'Passe-moi le sel.', highlight: 'e' },
      { word: 'merveille', sentence: 'C\'est une merveille.', highlight: 'e' },
      { word: 'neige', sentence: 'La neige tombe.', highlight: 'ei' }
    ],
    comparison: 'Close to Georgian ე',
    georgianTip: 'More open than Georgian ე.',
    fix: 'Open mouth slightly more than for ე, relaxed tongue.'
  },

  // --- PAIR: O (Closed vs Open) ---
  {
    id: 'closed-o',
    ipa: 'o',
    name: 'Closed O',
    spellings: 'eau, au, ô',
    colorTheme: 'orange',
    examples: [
      { word: 'eau', sentence: 'Je bois de l\'eau.', highlight: 'eau' },
      { word: 'beau', sentence: 'Il fait beau.', highlight: 'eau' },
      { word: 'auto', sentence: 'Mon auto est en panne.', highlight: 'au' },
      { word: 'hôtel', sentence: 'Un grand hôtel.', highlight: 'ô' }
    ],
    comparison: 'Closer to Georgian ო',
    georgianTip: 'More rounded than Georgian ო.',
    fix: 'Round lips more strongly, stable vowel.'
  },
  {
    id: 'open-o',
    ipa: 'ɔ',
    name: 'Open O',
    spellings: 'o',
    colorTheme: 'rose',
    examples: [
      { word: 'porte', sentence: 'Ferme la porte.', highlight: 'o' },
      { word: 'bol', sentence: 'Un bol de café.', highlight: 'o' },
      { word: 'robe', sentence: 'Jolie robe.', highlight: 'o' }
    ],
    comparison: 'Lower than Georgian ო',
    georgianTip: 'More open/lower than Georgian ო.',
    fix: 'Open jaw slightly more, less lip rounding than /o/.'
  },

  // --- PAIR: EU (Closed vs Open) ---
  {
    id: 'closed-eu',
    ipa: 'ø',
    name: 'eu (closed)',
    spellings: 'eu, œu',
    colorTheme: 'blue',
    examples: [
      { word: 'peu', sentence: 'Un peu de sel.', highlight: 'eu' },
      { word: 'deux', sentence: 'Deux billets.', highlight: 'eu' },
      { word: 'vœu', sentence: 'Fais un vœu.', highlight: 'œu' },
      { word: 'monsieur', sentence: 'Bonjour monsieur.', highlight: 'eu' }
    ],
    comparison: 'Like /y/ but lower',
    georgianTip: 'Requires strong lip rounding.',
    fix: 'Start from /e/ then round lips strongly.'
  },
  {
    id: 'open-eu',
    ipa: 'œ',
    name: 'eu (open)',
    spellings: 'eu, œu (+cons)',
    colorTheme: 'sky',
    examples: [
      { word: 'peur', sentence: 'J\'ai peur.', highlight: 'eu' },
      { word: 'fleur', sentence: 'Une belle fleur.', highlight: 'eu' },
      { word: 'sœur', sentence: 'C\'est ma sœur.', highlight: 'œu' },
      { word: 'bœuf', sentence: 'Du bœuf.', highlight: 'œu' }
    ],
    comparison: 'More open than /ø/',
    georgianTip: 'Relaxed rounding.',
    fix: 'Start from /ɛ/ (è) and round lips slightly.'
  }
];

export const NASAL_VOWELS: PhonemeData[] = [
  {
    id: 'nasal-a',
    ipa: 'ɑ̃',
    name: 'Nasal A',
    spellings: 'an, en, am, em',
    colorTheme: 'purple',
    examples: [
      { word: 'maman', sentence: 'Bonjour maman.', highlight: 'an' },
      { word: 'vent', sentence: 'Il y a du vent.', highlight: 'en' },
      { word: 'chambre', sentence: 'Ma chambre.', highlight: 'am' },
      { word: 'temps', sentence: 'Le temps passe.', highlight: 'em' }
    ],
    comparison: 'Not in Georgian',
    georgianTip: "Don’t turn it into ან. It’s one sound.",
    fix: 'Start from /a/, lower velum. Mouth open, tongue low. No "n" sound.'
  },
  {
    id: 'nasal-e',
    ipa: 'ɛ̃',
    name: 'Nasal E',
    spellings: 'in, im, ain, ein, un',
    colorTheme: 'pink',
    examples: [
      { word: 'vin', sentence: 'Du vin rouge.', highlight: 'in' },
      { word: 'important', sentence: 'C\'est important.', highlight: 'im' },
      { word: 'pain', sentence: 'Du pain frais.', highlight: 'ain' },
      { word: 'plein', sentence: 'Le verre est plein.', highlight: 'ein' },
      { word: 'lundi', sentence: 'À lundi.', highlight: 'un' }
    ],
    comparison: 'Not "ინ"',
    georgianTip: 'Modern French merges "in" and "un" into this sound.',
    fix: 'Start from /ɛ/ (è), add nasal airflow. Jaw slightly open.'
  },
  {
    id: 'nasal-o',
    ipa: 'ɔ̃',
    name: 'Nasal O',
    spellings: 'on, om',
    colorTheme: 'red',
    examples: [
      { word: 'bon', sentence: 'C\'est très bon.', highlight: 'on' },
      { word: 'nom', sentence: 'Ton nom.', highlight: 'om' },
      { word: 'long', sentence: 'Le chemin est long.', highlight: 'on' }
    ],
    comparison: 'Not "ონ"',
    georgianTip: 'Keep lips rounded.',
    fix: 'Start from open o /ɔ/ + nasal airflow.'
  }
];

export const CONTRASTS: ContrastPairData[] = [
  {
    id: 'u-y',
    name: '/y/ vs /u/',
    pair: [
      { word: 'tu', ipa: '/ty/', meaning: 'you', sentence: 'Tu viens ?', highlight: 'u', colorTheme: 'fuchsia' },
      { word: 'tout', ipa: '/tu/', meaning: 'all', sentence: 'Tout va bien.', highlight: 'ou', colorTheme: 'violet' }
    ],
    note: 'The #1 difficulty. /y/ is forward (tongue like i), /u/ is back.'
  },
  {
    id: 'o-oe',
    name: '/ø/ vs /œ/',
    pair: [
      { word: 'peu', ipa: '/pø/', meaning: 'little', sentence: 'J\'en veux un peu.', highlight: 'eu', colorTheme: 'blue' },
      { word: 'peur', ipa: '/pœʁ/', meaning: 'fear', sentence: 'J\'ai peur.', highlight: 'eu', colorTheme: 'sky' }
    ],
    note: 'Closed (tight lips) vs Open (relaxed lips).'
  },
  {
    id: 'nasal-oral',
    name: 'Nasal vs Oral',
    pair: [
      { word: 'bon', ipa: '/bɔ̃/', meaning: 'good', sentence: 'Ce gâteau est bon.', highlight: 'on', colorTheme: 'red' },
      { word: 'beau', ipa: '/bo/', meaning: 'beautiful', sentence: 'Il fait beau.', highlight: 'eau', colorTheme: 'orange' }
    ],
    note: 'Do not pronounce the "n" in nasal vowels.'
  },
  {
    id: 'e-open-e',
    name: 'é vs è',
    pair: [
      { word: 'été', ipa: '/ete/', meaning: 'summer', sentence: 'En été il fait chaud.', highlight: 'é', colorTheme: 'emerald' },
      { word: 'prête', ipa: '/prɛt/', meaning: 'ready', sentence: 'Elle est prête.', highlight: 'ê', colorTheme: 'lime' }
    ],
    note: 'Tense/High vs Relaxed/Low. Do not merge into Georgian ე.'
  }
];

export const ROUTINE: RoutineStep[] = [
  {
    title: 'Front Rounded Vowels',
    instruction: 'Transition smoothly without moving your tongue, only your lips.',
    sequence: ['i', 'y', 'u'],
    note: 'Say: si – su – sy, tu – tout – tu'
  },
  {
    title: 'Nasal Sequences',
    instruction: 'Hold each for 2 seconds without adding "n".',
    sequence: ['a → ɑ̃', 'e → ɛ̃', 'o → ɔ̃'],
    note: 'Focus on airflow through the nose.'
  },
  {
    title: 'Minimal Pair Drills',
    instruction: 'Repeat these pairs to feel the difference.',
    sequence: ['tu / tout', 'vin / vent / vont'],
    note: 'Use a mirror. Georgian speakers often under-round lips.'
  }
];