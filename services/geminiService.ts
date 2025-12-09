import { GoogleGenAI, Modality, Type } from "@google/genai";
import { PlayMode, AnalyzedSegment } from "../types";
import { ORAL_VOWELS, NASAL_VOWELS } from "../data";

// In-memory cache to store loaded AudioBuffers (whether from file or API)
const audioCache: Map<string, AudioBuffer> = new Map();
const pendingRequests: Map<string, Promise<AudioBuffer>> = new Map();

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
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
        if (!response.ok) throw new Error(`Failed to load audio: ${url}`);
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
    const filename = `${phonemeId}_${type}.mp3`;
    // Update path to match "Audio" capitalization in your project structure
    const url = `/Audio/${filename}`;
    const cacheKey = `phoneme:${phonemeId}:${type}`;
    
    try {
        await loadAndPlay(url, cacheKey);
    } catch (e) {
        console.error("Audio file not found, check public/Audio/ folder", e);
    }
};

async function fetchAndDecode(text: string, mode: PlayMode): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const filename = getAudioFilename(text, mode);
  // Update path to match "Audio" capitalization
  const localUrl = `/Audio/${filename}`;

  // 1. Try fetching static file
  try {
    const fileResponse = await fetch(localUrl);
    if (fileResponse.ok) {
      const fileData = await fileResponse.arrayBuffer();
      return await decodeAudioData(fileData, ctx);
    }
  } catch (e) {
    // Ignore error, proceed to API
  }

  // 2. Fallback to Gemini API
  console.log(`File not found: ${filename}. Generating via Gemini API...`);
  
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
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }
      return buffer;
  }
  
  try {
      return await decodeAudioData(audioBytes.buffer, ctx);
  } catch {
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
