import { GoogleGenAI, Type } from "@google/genai";
import { PlayMode, AnalyzedSegment } from "../types";
import { ORAL_VOWELS, NASAL_VOWELS } from "../data";

// --- HELPER: Slugify for Filenames ---
// Converts "C'est la vie." -> "cest-la-vie-sentence"
export const getAudioFilename = (text: string, mode: PlayMode): string => {
  const slug = text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]/g, "-") // Replace non-chars with dash
    .replace(/-+/g, "-") // Collapse dashes
    .replace(/^-|-$/g, ""); // Trim dashes
  
  return `${slug}-${mode}.mp3`;
};

// --- AUDIO PLAYBACK ---

// Global reference to currently playing audio to allow stopping/overlapping handling
let currentAudio: HTMLAudioElement | null = null;

/**
 * Plays the aggregated audio files for a phoneme (e.g. "open-a_words.mp3")
 * directly from the /Audio/ folder using HTML5 Audio.
 */
export const playPhonemeAudio = async (phonemeId: string, type: 'words' | 'sentences'): Promise<void> => {
    // Stop any currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    // Explicitly match the file structure: /Audio/open-a_words.mp3
    // Ensure the folder 'Audio' matches case sensitivity of your public folder.
    const filename = `${phonemeId}_${type}.mp3`;
    const url = `/Audio/${filename}`;
    
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        currentAudio = audio;
        
        audio.onended = () => {
            currentAudio = null;
            resolve();
        };
        
        audio.onerror = (e) => {
            console.error(`Failed to play ${url}`, e);
            currentAudio = null;
            reject(new Error(`Audio file not found or unplayable: ${filename}`));
        };

        // play() returns a promise
        audio.play().catch(e => {
            console.error("Playback interrupted or failed:", e);
            reject(e);
        });
    });
};

/**
 * Attempts to play an individual word file.
 * Since TTS is disabled, this will only work if a file exists at /Audio/{slug}-{mode}.mp3
 */
export const playPronunciation = async (text: string, mode: PlayMode = PlayMode.NORMAL): Promise<void> => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    const filename = getAudioFilename(text, mode);
    const url = `/Audio/${filename}`;

    console.log(`Attempting to play static file: ${url}`);

    return new Promise((resolve) => {
        const audio = new Audio(url);
        currentAudio = audio;

        audio.onended = () => {
            currentAudio = null;
            resolve();
        };

        audio.onerror = () => {
            console.warn(`Static audio missing for: "${text}" (${url}). TTS is disabled.`);
            currentAudio = null;
            // Resolve silently so the UI doesn't crash or get stuck
            resolve();
        };

        audio.play().catch(() => {
            // Ignore errors (like user interaction requirements or missing files)
            resolve();
        });
    });
};

// --- TEXT GENERATION & ANALYSIS ---

export const generateAnalyzedText = async (topic: string): Promise<AnalyzedSegment[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Build a reference map for the LLM
  const vowelRef = [...ORAL_VOWELS, ...NASAL_VOWELS].map(v => 
    `ID: "${v.id}" (Sound: /${v.ipa}/, Spellings: ${v.spellings})`
  ).join('\n');

  const prompt = `
  You are a specialized French pronunciation teacher. 
  
  TASK:
  1. Write a short, simple French text (1-2 sentences) about: "${topic}".
  2. Analyze the text phonetically by breaking it into small segments (syllables or word parts).
  3. For each segment, identify if it contains one of the following target vowel sounds.
  
  TARGET VOWEL IDs:
  ${vowelRef}
  
  OUTPUT FORMAT:
  Return ONLY a JSON array of objects. Do not include markdown code blocks.
  Schema:
  {
    "segments": [
      { 
        "text": string (the text segment), 
        "vowelId": string (matches one of the IDs above, OR null if it's a consonant cluster, schwa, or silent letter) 
      }
    ]
  }

  EXAMPLE OUTPUT:
  {
    "segments": [
      { "text": "Sa", "vowelId": "open-a" },
      { "text": "lut", "vowelId": "u" },
      { "text": ", ", "vowelId": null },
      { "text": "ça", "vowelId": "open-a" },
      { "text": " ", "vowelId": null },
      { "text": "va", "vowelId": "open-a" },
      { "text": "?", "vowelId": null }
    ]
  }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            segments: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        vowelId: { type: Type.STRING, nullable: true }
                    }
                }
            }
        }
      }
    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("Failed to generate text");
  
  try {
    const result = JSON.parse(jsonText);
    return result.segments || [];
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Invalid response format");
  }
};
