import React, { useState } from 'react';
import { ORAL_VOWELS, NASAL_VOWELS, CONTRASTS } from '../data';
import { PlayMode } from '../types';
import { generateAudioBlob } from '../services/geminiService';

const AssetGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [logs, setLogs] = useState<string[]>([]);

  const addToLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

  const generateAll = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    
    // Collect all tasks
    const tasks: { text: string; mode: PlayMode }[] = [];

    const addTasks = (word: string, sentence: string) => {
      tasks.push({ text: word, mode: PlayMode.SLOW });
      tasks.push({ text: word, mode: PlayMode.NORMAL });
      tasks.push({ text: sentence, mode: PlayMode.SENTENCE });
    };

    [...ORAL_VOWELS, ...NASAL_VOWELS].forEach(v => {
      v.examples.forEach(ex => addTasks(ex.word, ex.sentence));
    });

    CONTRASTS.forEach(c => {
      c.pair.forEach(p => addTasks(p.word, p.sentence));
    });

    setProgress({ current: 0, total: tasks.length });

    // Process tasks sequentially to avoid rate limits
    // In a real dev environment you might parallelize this a bit
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      try {
        addToLog(`Generating: ${task.text} (${task.mode})...`);
        const { blob, filename } = await generateAudioBlob(task.text, task.mode);
        
        // Auto-download logic
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // Hack: Append .mp3 extension name even if it's wav container, 
        // purely because the service code expects checking .mp3 in the fetch path.
        // Or we can save as .wav and update service. Let's stick to matching the service:
        a.download = filename; 
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        addToLog(`Saved: ${filename}`);
      } catch (e) {
        console.error(e);
        addToLog(`Error: ${task.text}`);
      }
      setProgress({ current: i + 1, total: tasks.length });
      
      // Small delay to be nice to the API
      await new Promise(r => setTimeout(r, 500));
    }

    setIsGenerating(false);
    addToLog("Done! Move files to public/audio/");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-200 p-4 border-t border-slate-700 z-50 transition-transform duration-300 transform translate-y-0">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-bold text-white flex items-center gap-2">
            <span>🛠 Asset Generator</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Dev Mode</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Generates high-quality audio files using Gemini. Move the downloaded files to your project's <code>public/audio/</code> folder.
          </p>
        </div>

        <div className="flex items-center gap-4">
            {isGenerating && (
                <div className="text-right">
                    <div className="text-xs font-mono text-indigo-300">
                        {progress.current} / {progress.total}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                        {logs[0]}
                    </div>
                </div>
            )}
            
            <button
                onClick={generateAll}
                disabled={isGenerating}
                className={`
                    px-4 py-2 rounded font-bold text-sm transition-colors
                    ${isGenerating 
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'}
                `}
            >
                {isGenerating ? 'Generating...' : 'Generate All Assets'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AssetGenerator;