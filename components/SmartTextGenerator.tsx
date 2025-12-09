import React, { useState } from 'react';
import { ORAL_VOWELS, NASAL_VOWELS } from '../data';
import { generateAnalyzedText, playPronunciation, playPhonemeAudio } from '../services/geminiService';
import { AnalyzedSegment, PlayMode } from '../types';

const SUGGESTIONS = [
  "A breakfast in Paris",
  "Meeting a friend",
  "The weather today",
  "My favorite color",
  "At the bakery"
];

// Helper to find color based on ID
const getThemeForId = (id: string | null | undefined): string => {
  if (!id) return 'slate';
  const allVowels = [...ORAL_VOWELS, ...NASAL_VOWELS];
  const vowel = allVowels.find(v => v.id === id);
  return vowel ? vowel.colorTheme : 'slate';
};

const SmartTextGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [segments, setSegments] = useState<AnalyzedSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (selectedTopic?: string) => {
    const query = selectedTopic || topic;
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setSegments([]);

    try {
      const result = await generateAnalyzedText(query);
      setSegments(result);
    } catch (err) {
      console.error(err);
      setError("Could not generate text. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSegmentClick = (text: string, vowelId?: string | null) => {
    // If it's a recognized vowel, play the reference audio file (the "soundboard" effect)
    if (vowelId) {
        // We use 'words' type to play the example words for this vowel
        playPhonemeAudio(vowelId, 'words');
    } else {
        // Fallback to TTS for non-colored segments (consonants, punctuation, schwas)
        playPronunciation(text.trim(), PlayMode.NORMAL);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Smart Text Generator ✨</h3>
        <p className="text-slate-600 mb-6 text-sm">
          Enter a topic, and AI will write a short story color-coded by pronunciation rules.
        </p>

        {/* Input Area */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., A cat in the garden..."
            className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <button
            onClick={() => handleGenerate()}
            disabled={isLoading || !topic.trim()}
            className={`px-6 py-3 rounded-lg font-bold text-white transition-all ${
              isLoading || !topic.trim()
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-md active:transform active:scale-95'
            }`}
          >
            {isLoading ? 'Writing...' : 'Generate'}
          </button>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => {
                setTopic(s);
                handleGenerate(s);
              }}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors border border-slate-200"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-center mb-6">
          {error}
        </div>
      )}

      {/* Output Display */}
      {segments.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-8 min-h-[200px]">
          <div className="flex flex-wrap items-baseline leading-relaxed text-2xl font-medium font-serif tracking-wide text-center justify-center">
            {segments.map((seg, idx) => {
              const theme = getThemeForId(seg.vowelId);
              const isColored = !!seg.vowelId;
              
              // Styles
              const textColor = isColored ? `text-${theme}-600` : 'text-slate-700';
              const hoverBg = isColored ? `hover:bg-${theme}-50` : 'hover:bg-slate-100';
              
              return (
                <span
                  key={idx}
                  onClick={() => handleSegmentClick(seg.text, seg.vowelId)}
                  className={`
                    ${textColor} 
                    ${hoverBg}
                    cursor-pointer 
                    rounded 
                    px-0.5
                    transition-colors duration-200
                    ${isColored ? 'font-bold' : 'font-normal'}
                  `}
                  title={seg.vowelId ? `/${seg.vowelId}/` : ''}
                >
                  {seg.text}
                </span>
              );
            })}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Color Key</p>
             <div className="flex flex-wrap justify-center gap-2">
                {[...ORAL_VOWELS, ...NASAL_VOWELS].map(v => (
                    <div key={v.id} className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        <div className={`w-3 h-3 rounded-full bg-${v.colorTheme}-500`}></div>
                        <span className="text-[10px] text-slate-500 font-mono">/{v.ipa}/</span>
                    </div>
                ))}
             </div>
          </div>
        </div>
      )}
      
      {/* Loading Skeleton */}
      {isLoading && segments.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-100 p-8 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-6 bg-slate-200 rounded w-2/3 mx-auto mb-4"></div>
              <div className="h-6 bg-slate-200 rounded w-1/2 mx-auto"></div>
          </div>
      )}
    </div>
  );
};

export default SmartTextGenerator;