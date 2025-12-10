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
 * Validates that the url points to an actual audio file and not an HTML 404 page.
 */
async function validateAudioUrl(url: string): Promise<boolean> {
    try {
        // We use a HEAD request to check content-type without downloading the whole file
        const response = await fetch(url, { method: 'HEAD' });
        const type = response.headers.get('Content-Type');
        
        if (!response.ok) {
            console.warn(`Audio check failed: ${url} returned status ${response.status}`);
            return false;
        }
        
        // If Netlify serves a 200 OK for a 404 (SPA rewrite), the type will be text/html
        if (type && type.includes('text/html')) {
            console.error(`Audio check failed: ${url} is serving HTML (likely a 404 fallback).`);
            return false;
        }
        
        // If it's a Git LFS pointer, it might be text/plain or octet-stream with small size
        const length = response.headers.get('Content-Length');
        if (length && parseInt(length) < 200) {
             console.warn(`Audio check warning: ${url} is suspiciously small (${length} bytes). Possible Git LFS pointer.`);
        }

        return true;
    } catch (e) {
        console.error("Network error checking audio:", e);
        return false;
    }
}

/**
 * Plays the aggregated audio files for a phoneme (e.g. "open-a_words.mp3")
 * directly from the /Audio/ folder using HTML5 Audio.
 */
export const playPhonemeAudio = async (phonemeId: string, type: 'words' | 'sentences'): Promise<void> => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    // Path construction matching your screenshot: /Audio/open-a_words.mp3
    const filename = `${phonemeId}_${type}.mp3`;
    const url = `/Audio/${filename}`;
    
    // Validate first to give a better error message
    const isValid = await validateAudioUrl(url);
    if (!isValid) {
        throw new Error(`File missing or corrupted: ${filename}`);
    }

    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        currentAudio = audio;
        
        audio.onended = () => {
            currentAudio = null;
            resolve();
        };
        
        audio.onerror = (e) => {
            const err = audio.error;
            let msg = "Unknown Error";
            if (err?.code === 4) msg = "Format not supported (check Git LFS)";
            if (err?.code === 3) msg = "Decoding error";
            
            console.error(`Playback failed for ${url}:`, msg, e);
            currentAudio = null;
            reject(new Error(`Playback Error: ${msg}`));
        };

        audio.play().catch(e => {
            console.error("Playback interrupted:", e);
            reject(e);
        });
    });
};

/**
 * Legacy support for individual words. 
 * NOTE: Based on your file structure, these likely do not exist, 
 * but we keep the function safe to avoid crashes.
 */
export const playPronunciation = async (text: string, mode: PlayMode = PlayMode.NORMAL): Promise<void> => {
    // We just log a warning that individual word playback is not supported without files
    console.warn(`Individual word playback for "${text}" is disabled in Static Mode.`);
    return Promise.resolve();
};

// --- TEXT GENERATION STUBS ---
// Replaced with empty implementations to satisfy imports without using API
export const generateAnalyzedText = async (topic: string): Promise<AnalyzedSegment[]> => {
    return []; 
};
