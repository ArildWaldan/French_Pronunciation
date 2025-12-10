import React, { useState } from 'react';
import { PhonemeData } from '../types';
import { playPhonemeAudio } from '../services/geminiService';

interface VowelCardProps {
  data: PhonemeData;
}

const HighlightedWord: React.FC<{ word: string; highlight: string; colorClass: string; occurrence?: number }> = ({ word, highlight, colorClass, occurrence }) => {
  if (!highlight) return <span className="text-base">{word}</span>;

  // Simple split based on the highlight string, case-insensitive
  const parts = word.split(new RegExp(`(${highlight})`, 'gi'));
  
  // Track match occurrences
  let matchCount = 0;

  return (
    <span className="text-base">
      {parts.map((part, i) => {
        const isMatch = part.toLowerCase() === highlight.toLowerCase();
        if (isMatch) matchCount++;
        
        // Determine if we should highlight this specific match
        const shouldHighlight = isMatch && (!occurrence || matchCount === occurrence);

        return shouldHighlight ? (
          <span key={i} className={`font-bold ${colorClass}`}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
};

const VowelCard: React.FC<VowelCardProps> = ({ data }) => {
  const [showExceptions, setShowExceptions] = useState(false);
  const [playing, setPlaying] = useState<'words' | 'sentences' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePlayAudio = async (type: 'words' | 'sentences') => {
      if (playing) return;
      setPlaying(type);
      setError(null);
      try {
        await playPhonemeAudio(data.id, type);
      } catch (e) {
          console.error(e);
          setError("Audio missing");
          // Clear error msg after 3s
          setTimeout(() => setError(null), 3000);
      } finally {
          setPlaying(null); 
      }
  };

  // Dynamic Tailwind classes based on the theme
  const theme = data.colorTheme;
  const borderClass = `border-${theme}-200`;
  const bgHeaderClass = `bg-${theme}-50`;
  const borderHeaderClass = `border-${theme}-100`;
  const textTitleClass = `text-${theme}-900`;
  const textSubtitleClass = `text-${theme}-700`;
  const badgeClass = `bg-${theme}-100`;
  const btnClass = `bg-${theme}-600 hover:bg-${theme}-700 active:bg-${theme}-800`;
  const btnSecClass = `bg-white text-${theme}-700 border border-${theme}-200 hover:border-${theme}-300 hover:bg-${theme}-50`;
  const highlightTextClass = `text-${theme}-600`;

  return (
    <div className={`bg-white rounded-xl shadow-md border ${borderClass} overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full`}>
      {/* Header Section */}
      <div className={`${bgHeaderClass} p-5 border-b ${borderHeaderClass}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`text-3xl font-bold ${textTitleClass} mb-1 leading-tight`}>{data.spellings}</h3>
            <p className={`text-sm font-medium ${textSubtitleClass} flex items-center gap-2`}>
              <span className={`${badgeClass} ${textSubtitleClass} px-2 py-0.5 rounded font-mono border border-${theme}-200`}>/{data.ipa}/</span>
              <span>{data.name}</span>
            </p>
          </div>
        </div>

        {/* Primary Audio Controls */}
        <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2">
                <button
                    onClick={() => handlePlayAudio('words')}
                    disabled={playing !== null}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-all ${btnClass} ${playing === 'words' ? 'opacity-75' : ''}`}
                >
                    {playing === 'words' ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                    )}
                    Examples
                </button>
                <button
                    onClick={() => handlePlayAudio('sentences')}
                    disabled={playing !== null}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-all ${btnSecClass} ${playing === 'sentences' ? 'bg-' + theme + '-50' : ''}`}
                >
                    {playing === 'sentences' ? (
                    <svg className={`animate-spin h-4 w-4 text-${theme}-600`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    )}
                    Sentences
                </button>
            </div>
            {error && <div className="text-xs text-red-500 font-bold text-center bg-red-50 p-1 rounded border border-red-100">{error}</div>}
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col gap-6">
        
        {/* Examples Section */}
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vocabulary</p>
          <div className="flex flex-wrap gap-3">
            {data.examples.map((item) => {
              return (
                <div
                  key={item.word}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-2 bg-white border-slate-200 text-slate-700 cursor-default`}
                >
                  <HighlightedWord word={item.word} highlight={item.highlight} colorClass={highlightTextClass} />
                </div>
              );
            })}
          </div>

          {/* Exceptions Dropdown */}
          {data.exceptions && data.exceptions.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowExceptions(!showExceptions)}
                className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${textSubtitleClass} hover:underline`}
              >
                <span>Exceptions ⚠️</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-4 h-4 transition-transform ${showExceptions ? 'rotate-180' : ''}`}
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              
              {showExceptions && (
                <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                   {data.exceptions.map((item) => {
                    return (
                      <div
                        key={item.word}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-2 bg-white border-slate-200 text-slate-700`}
                      >
                        <HighlightedWord 
                           word={item.word} 
                           highlight={item.highlight} 
                           colorClass={`text-${theme}-600`}
                           occurrence={item.highlightOccurrence}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 mt-auto">
          {/* Georgian Comparison */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🇬🇪</span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comparison</p>
            </div>
            <p className="text-sm text-slate-700 georgian-text leading-relaxed font-medium">{data.comparison}</p>
            <p className="text-sm text-slate-500 mt-1 italic opacity-90">{data.georgianTip}</p>
          </div>

          {/* The Fix */}
          <div className={`pl-4 border-l-4 border-${theme}-300 py-1`}>
            <p className={`text-xs font-bold text-${theme}-600 uppercase tracking-wider mb-1`}>Technique</p>
            <p className="text-sm text-slate-600 leading-relaxed">{data.fix}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VowelCard;
