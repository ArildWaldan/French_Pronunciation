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
 * Plays the aggregated audio files for a phoneme directly from the /audio/ folder.
 * NOTE: The folder path is case-sensitive on Netlify/Linux. 
 * We use '/audio/' (lowercase) as it is the standard convention for the public folder.
 */
export const playPhonemeAudio = async (phonemeId: string, type: 'words' | 'sentences'): Promise<void> => {
    // 1. Stop any currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    // 2. Construct path using lowercase 'audio' to avoid 404s on Linux servers
    const filename = `${phonemeId}_${type}.mp3`;
    const url = `/audio/${filename}`;
    
    console.log(`Playing: ${url}`); // Debug log to confirm path

    // 3. Simple Fire-and-Forget Playback
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        currentAudio = audio;
        
        // Ensure volume is up
        audio.volume = 1.0;

        audio.onended = () => {
            currentAudio = null;
            resolve();
        };
        
        audio.onerror = (e) => {
            console.error(`Error playing ${url}`, e);
            currentAudio = null;
            // We reject here so the UI knows it finished (even if failed), 
            // but we don't throw a visible alert to the user.
            reject(new Error(`Could not play ${url}`));
        };

        // Standard play attempt
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error(`Playback prevented for ${url}:`, error);
                reject(error);
            });
        }
    });
};

/**
 * Legacy support for individual word playback
 */
export const playPronunciation = async (text: string, mode: PlayMode = PlayMode.NORMAL): Promise<void> => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    const filename = getAudioFilename(text, mode);
    // Ensure lowercase path here as well
    const url = `/audio/${filename}`;

    console.log(`Playing Individual: ${url}`);

    const audio = new Audio(url);
    currentAudio = audio;
    
    // Fire and forget
    audio.play().catch(e => console.warn("Could not play word audio", e));
    
    return Promise.resolve();
};

// --- STUBS ---
export const generateAnalyzedText = async (topic: string): Promise<AnalyzedSegment[]> => {
    return []; 
};
