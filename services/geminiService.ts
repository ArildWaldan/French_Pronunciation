import { PlayMode, AnalyzedSegment } from "../types";

// --- HELPER: Slugify for Filenames ---
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

let currentAudio: HTMLAudioElement | null = null;

/**
 * Plays the aggregated audio files for a phoneme (e.g. "open-a_words.mp3")
 * directly from the /Audio/ folder using HTML5 Audio.
 */
export const playPhonemeAudio = async (phonemeId: string, type: 'words' | 'sentences'): Promise<void> => {
    // 1. Stop any currently playing audio to prevent overlap
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    // 2. Construct path: /Audio/open-a_words.mp3
    const filename = `${phonemeId}_${type}.mp3`;
    const url = `/Audio/${filename}`;
    
    // 3. Direct Playback (No checks, no pre-fetch)
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        currentAudio = audio;
        
        audio.onended = () => {
            currentAudio = null;
            resolve();
        };
        
        audio.onerror = (e) => {
            console.error(`Native Audio Error for ${url}`, e);
            currentAudio = null;
            reject(new Error(`Could not play ${url}`));
        };

        // Attempt playback
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.error("Browser blocked playback or file missing:", e);
                reject(e);
            });
        }
    });
};

/**
 * Attempts to play individual word files if they exist (e.g. /Audio/papa-normal.mp3)
 */
export const playPronunciation = async (text: string, mode: PlayMode = PlayMode.NORMAL): Promise<void> => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    const filename = getAudioFilename(text, mode);
    const url = `/Audio/${filename}`;

    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        currentAudio = audio;
        
        audio.onended = () => {
            currentAudio = null;
            resolve();
        };
        
        audio.onerror = (e) => {
            console.warn(`File not found: ${url}`);
            currentAudio = null;
            resolve(); // Resolve silently for missing individual words
        };

        audio.play().catch(() => resolve());
    });
};

// --- STUBS ---
export const generateAnalyzedText = async (topic: string): Promise<AnalyzedSegment[]> => {
    return []; 
};
