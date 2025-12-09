import React, { useState } from 'react';
import { ContrastPairData, PlayMode } from '../types';
import { playPronunciation } from '../services/geminiService';

interface ContrastTrainerProps {
  data: ContrastPairData;
}

const HighlightedWord: React.FC<{ word: string; highlight: string; colorClass: string }> = ({ word, highlight, colorClass }) => {
    if (!highlight) return <div className="text-2xl font-bold text-slate-800 mb-1">{word}</div>;
  
    const parts = word.split(new RegExp(`(${highlight})`, 'gi'));
  
    return (
      <div className="text-2xl font-bold text-slate-800 mb-1">
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className={`font-bold ${colorClass}`}>
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>
    );
  };

const ContrastTrainer: React.FC<ContrastTrainerProps> = ({ data }) => {
  const [itemModes, setItemModes] = useState<Record<string, PlayMode>>({});

  const getMode = (id: string) => itemModes[id] || PlayMode.SLOW;

  const cycleMode = (id: string) => {
    setItemModes(prev => {
      const current = prev[id] || PlayMode.SLOW;
      let next = PlayMode.SLOW;
      if (current === PlayMode.SLOW) next = PlayMode.NORMAL;
      else if (current === PlayMode.NORMAL) next = PlayMode.SENTENCE;
      else next = PlayMode.SLOW;
      
      return { ...prev, [id]: next };
    });
  };

  const handlePlay = (word: string, sentence: string, id: string) => {
    const mode = getMode(id);
    let textToPlay = word;
    
    if (mode === PlayMode.SENTENCE) {
      textToPlay = sentence;
    }

    playPronunciation(textToPlay, mode);
    cycleMode(id);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">{data.name}</h3>
        <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded mt-2 md:mt-0">Critical Contrast</span>
      </div>

      <p className="text-slate-600 text-sm mb-6">{data.note}</p>

      <div className="grid grid-cols-2 gap-4">
        {data.pair.map((item, idx) => {
          const uniqueId = `${data.id}-${idx}`;
          const theme = item.colorTheme || 'indigo'; // Default fallback
          const borderClass = `border-${theme}-200`;
          const hoverBorderClass = `hover:border-${theme}-400`;
          const hoverBgClass = `hover:bg-${theme}-50`;
          const textClass = `text-${theme}-600`;
          const iconTextClass = `text-${theme}-500`;

          return (
            <div 
              key={idx} 
              onClick={() => handlePlay(item.word, item.sentence, uniqueId)}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 text-center group select-none ${borderClass} ${hoverBorderClass} ${hoverBgClass} active:scale-[0.98]`}
            >
              <HighlightedWord word={item.word} highlight={item.highlight} colorClass={textClass} />
              <div className="text-sm font-mono text-slate-500 mb-2">{item.ipa}</div>
              <div className="text-xs text-slate-400 italic">"{item.meaning}"</div>
              
              <div className={`absolute top-2 right-2 transition-opacity opacity-0 group-hover:opacity-100 ${iconTextClass}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContrastTrainer;