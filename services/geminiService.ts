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
 * Plays the aggregated audio files for a phoneme directly from the /Audio/ folder.
 * NOTE: The folder path is case-sensitive on Netlify/Linux.
 */
export const playPhonemeAudio = async (phonemeId: string, type: 'words' | 'sentences'): Promise<void> => {
    // 1. Stop any currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    // 2. Construct path using capital 'Audio' to match the actual folder name
    const filename = `${phonemeId}_${type}.mp3`;
    const url = `/Audio/${filename}`;

    console.log(`[Audio] Attempting to play: ${url}`);
    console.log(`[Audio] Full URL will be: ${window.location.origin}${url}`);

    // 3. Simple Fire-and-Forget Playback
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        currentAudio = audio;

        // Ensure volume is up
        audio.volume = 1.0;

        // Add load event for debugging
        audio.onloadeddata = () => {
            console.log(`[Audio] Successfully loaded: ${url}`);
        };

        audio.onended = () => {
            console.log(`[Audio] Finished playing: ${url}`);
            currentAudio = null;
            resolve();
        };

        audio.onerror = (e) => {
            const target = (typeof e !== 'string' && e.target) ? e.target as HTMLAudioElement : audio;
            console.error(`[Audio] Error loading ${url}`);
            console.error(`[Audio] Error code: ${target.error?.code}`);
            console.error(`[Audio] Error message: ${target.error?.message}`);
            console.error(`[Audio] Network state: ${target.networkState}`);
            console.error(`[Audio] Ready state: ${target.readyState}`);
            currentAudio = null;
            reject(new Error(`Could not load ${url} - Error code: ${target.error?.code}`));
        };

        // Standard play attempt
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error(`[Audio] Playback prevented for ${url}:`, error);
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
    // Use capital 'Audio' to match the actual folder name
    const url = `/Audio/${filename}`;

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
