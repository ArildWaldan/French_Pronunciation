import React from 'react';
import { ContrastPairData } from '../types';

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
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <h3 className="text-lg font-bold text-slate-800">{data.name}</h3>
        <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded mt-2 md:mt-0">Critical Contrast</span>
      </div>

      <p className="text-slate-600 text-sm mb-6">{data.note}</p>

      <div className="grid grid-cols-2 gap-4">
        {data.pair.map((item, idx) => {
          const theme = item.colorTheme || 'indigo'; // Default fallback
          const borderClass = `border-${theme}-200`;
          const textClass = `text-${theme}-600`;

          return (
            <div 
              key={idx} 
              className={`relative p-4 rounded-lg border-2 text-center group select-none ${borderClass} bg-slate-50`}
            >
              <HighlightedWord word={item.word} highlight={item.highlight} colorClass={textClass} />
              <div className="text-sm font-mono text-slate-500 mb-2">{item.ipa}</div>
              <div className="text-xs text-slate-400 italic">"{item.meaning}"</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContrastTrainer;
