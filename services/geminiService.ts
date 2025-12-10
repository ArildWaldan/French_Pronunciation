import { GoogleGenAI, Modality, Type } from "@google/genai";
import { PlayMode, AnalyzedSegment } from "../types";
import { ORAL_VOWELS, NASAL_VOWELS } from "../data";

// In-memory cache to store loaded AudioBuffers (whether from file or API)
const audioCache: Map<string, AudioBuffer> = new Map();
const pendingRequests: Map<string, Promise<AudioBuffer>> = new Map();

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    // We do NOT enforce a sampleRate here. We let the browser/hardware decide.
    // Enforcing it can cause playback issues or initialization failures on some mobile devices.
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

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

// --- HELPER: Buffer Inspection ---
// Detects if a downloaded buffer is actually text (HTML 404 or Git LFS pointer)
// to prevent "EncodingError" when calling decodeAudioData.
const isBufferValidAudio = (buffer: ArrayBuffer): boolean => {
  // Check start of file for common text signatures
  // We look at the first 50 bytes
  const headerBytes = new Uint8Array(buffer.slice(0, 50));
  const headerStr = String.fromCharCode(...headerBytes).trim().toLowerCase();

  // 1. Check for HTML (Netlify 404 fallback)
  if (headerStr.startsWith('<!doctype html') || headerStr.startsWith('<html')) {
    return false;
  }

  // 2. Check for Git LFS pointer
  if (headerStr.startsWith('version https://git-lfs')) {
    return false;
  }

  // 3. Simple heuristic: If it's extremely small (< 200 bytes), it's likely not a valid MP3/WAV
  if (buffer.byteLength < 200) {
    return false;
  }

  return true;
};

// --- HELPER: Decoding ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function addWavHeader(samples: Uint8Array, sampleRate: number, numChannels: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length);
  const view = new DataView(buffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + samples.length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * blockAlign)
  view.setUint32(28, sampleRate * numChannels * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, samples.length, true);
  
  // write the PCM samples
  const newUint8 = new Uint8Array(buffer);
  newUint8.set(samples, 44);
  
  return newUint8;
}

async function decodeAudioData(
  data: ArrayBuffer,
  ctx: AudioContext
): Promise<AudioBuffer> {
  // Guard against invalid data (Text disguised as Audio)
  if (!isBufferValidAudio(data)) {
    throw new Error("Invalid audio data detected (likely HTML or LFS pointer)");
  }

  // We clone the buffer because decodeAudioData detaches it
  const bufferCopy = data.slice(0);
  try {
    return await ctx.decodeAudioData(bufferCopy);
  } catch (e) {
    throw e;
  }
}

// --- MAIN LOGIC ---

export const generateAudioBlob = async (text: string, mode: PlayMode): Promise<{ blob: Blob; filename: string }> => {
  const filename = getAudioFilename(text, mode);
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let prompt = "";
  
  switch (mode) {
    case PlayMode.SLOW:
      prompt = `Pronounce this French text very clearly and slowly for a learner: "${text}"`;
      break;
    case PlayMode.NORMAL:
      prompt = `Pronounce this French text naturally: "${text}"`;
      break;
    case PlayMode.SENTENCE:
      prompt = `Pronounce this French sentence clearly: "${text}"`;
      break;
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, 
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio from Gemini");

  const audioBytes = decode(base64Audio);
  
  // Add WAV header so the blob is a valid audio file
  const wavBytes = addWavHeader(audioBytes, 24000, 1);
  const blob = new Blob([wavBytes], { type: 'audio/wav' });

  return { blob, filename };
};

// Generic player for a specific URL/filename
async function loadAndPlay(url: string, cacheKey: string) {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();

    if (audioCache.has(cacheKey)) {
        const source = ctx.createBufferSource();
        source.buffer = audioCache.get(cacheKey)!;
        source.connect(ctx.destination);
        source.start();
        return;
    }

    if (pendingRequests.has(cacheKey)) {
        const buffer = await pendingRequests.get(cacheKey)!;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
        return;
    }

    const loadPromise = async (): Promise<AudioBuffer> => {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to load audio: ${url} (Status: ${response.status})`);
        }
        
        const data = await response.arrayBuffer();
        return await decodeAudioData(data, ctx);
    };

    const promise = loadPromise()
        .then(buffer => {
            audioCache.set(cacheKey, buffer);
            pendingRequests.delete(cacheKey);
            return buffer;
        })
        .catch(e => {
            pendingRequests.delete(cacheKey);
            throw e;
        });

    pendingRequests.set(cacheKey, promise);

    const buffer = await promise;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
}


export const playPhonemeAudio = async (phonemeId: string, type: 'words' | 'sentences'): Promise<void> => {
    // Explicitly match the file structure: /Audio/open-a_words.mp3
    // Note the Capital 'A' in Audio to match the folder name exactly.
    const filename = `${phonemeId}_${type}.mp3`;
    const url = `/Audio/${filename}`;
    const cacheKey = `phoneme:${phonemeId}:${type}`;
    
    // 1. Try playing from cache or static file
    try {
        await loadAndPlay(url, cacheKey);
    } catch (e) {
        // This is where we catch the "Invalid audio data" error we threw above
        // or a standard 404.
        console.warn(`Local audio skipped for ${url} (using Fallback):`, e instanceof Error ? e.message : e);
        
        // 2. Fallback: Lookup data and generate on the fly
        const allVowels = [...ORAL_VOWELS, ...NASAL_VOWELS];
        const phoneme = allVowels.find(p => p.id === phonemeId);
        
        if (!phoneme) {
            console.error(`Phoneme ID ${phonemeId} not found in data.`);
            return;
        }

        let textToSay = "";
        if (type === 'words') {
             // Create a list with pauses (periods help TTS pause)
             textToSay = phoneme.examples.map(ex => ex.word).join('. '); 
        } else {
             textToSay = phoneme.examples.map(ex => ex.sentence).join(' ');
        }
        
        // Use playPronunciation which handles live generation + caching
        // We use PlayMode.NORMAL for this list of words/sentences
        await playPronunciation(textToSay, PlayMode.NORMAL);
    }
};

async function fetchAndDecode(text: string, mode: PlayMode): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const filename = getAudioFilename(text, mode);
  const localUrl = `/Audio/${filename}`;

  // 1. Try fetching static file
  try {
    const fileResponse = await fetch(localUrl);
    
    // Check basic headers first
    const contentType = fileResponse.headers.get('content-type');
    
    if (fileResponse.ok && (!contentType || !contentType.includes('text/html'))) {
      const fileData = await fileResponse.arrayBuffer();
      // This will throw if the fileData is actually HTML or corrupt
      return await decodeAudioData(fileData, ctx);
    }
  } catch (e) {
    // Ignore error, proceed to API
  }

  // 2. Fallback to Gemini API
  console.log(`Generating audio for "${text}" via Gemini API...`);
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let prompt = "";
  
  switch (mode) {
    case PlayMode.SLOW:
      prompt = `Pronounce this French text very clearly and slowly for a learner: "${text}"`;
      break;
    case PlayMode.NORMAL:
      prompt = `Pronounce this French text naturally: "${text}"`;
      break;
    case PlayMode.SENTENCE:
      prompt = `Pronounce this French sentence clearly: "${text}"`;
      break;
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, 
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio from Gemini");

  const audioBytes = decode(base64Audio);
  
  // Re-using the raw PCM decoder logic just in case:
  const rawDecode = (data: Uint8Array) => {
      const dataInt16 = new Int16Array(data.buffer);
      // Gemini sends 24kHz PCM. We create a buffer with that specific rate.
      // The AudioContext (which might be 44.1k or 48k) will play it correctly.
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }
      return buffer;
  }
  
  try {
      // Try standard decode first (for WAV headers if we added them or if API changes)
      // We do NOT use isBufferValidAudio here because audioBytes comes directly from API and has no header yet
      return await ctx.decodeAudioData(audioBytes.buffer.slice(0));
  } catch {
      // Fallback to raw PCM decode
      return rawDecode(audioBytes);
  }
}

export const playPronunciation = async (text: string, mode: PlayMode = PlayMode.NORMAL): Promise<void> => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();

  const cacheKey = `${text}::${mode}`;

  if (audioCache.has(cacheKey)) {
    const source = ctx.createBufferSource();
    source.buffer = audioCache.get(cacheKey)!;
    source.connect(ctx.destination);
    source.start();
    return;
  }

  if (pendingRequests.has(cacheKey)) {
    const buffer = await pendingRequests.get(cacheKey)!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    return;
  }

  const promise = fetchAndDecode(text, mode)
    .then(buffer => {
      audioCache.set(cacheKey, buffer);
      pendingRequests.delete(cacheKey);
      return buffer;
    })
    .catch(e => {
      pendingRequests.delete(cacheKey);
      throw e;
    });

  pendingRequests.set(cacheKey, promise);
  
  const buffer = await promise;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
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
