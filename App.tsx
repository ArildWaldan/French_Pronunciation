import React, { useState } from 'react';
import { VowelCategory } from './types';
import { ORAL_VOWELS, NASAL_VOWELS, CONTRASTS, ROUTINE } from './data';
import VowelCard from './components/VowelCard';
import ContrastTrainer from './components/ContrastTrainer';
import SmartTextGenerator from './components/SmartTextGenerator';
import { playPronunciation } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VowelCategory>(VowelCategory.ORAL);
  
  const tabs = Object.values(VowelCategory);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-indigo-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prononciation Française</h1>
            <p className="text-indigo-200 text-sm">For Georgian Speakers 🇬🇪🇫🇷</p>
          </div>
          
          <nav className="flex space-x-1 bg-indigo-800 p-1 rounded-lg overflow-x-auto max-w-full">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap
                  ${activeTab === tab 
                    ? 'bg-white text-indigo-900 shadow-sm' 
                    : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'}
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Intro Banner for specific tabs */}
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">{activeTab}</h2>
            <p className="text-slate-600 max-w-2xl">
              {activeTab === VowelCategory.ORAL && "French vowels are steady and pure. Unlike Georgian, distinguish carefully between rounded and unrounded lips."}
              {activeTab === VowelCategory.NASAL && "Air goes through nose + mouth. Do NOT pronounce the 'n' at the end."}
              {activeTab === VowelCategory.CONTRAST && "These pairs change the meaning of words completely. Master these distinctions."}
              {activeTab === VowelCategory.ROUTINE && "A 5-minute daily workout to retrain your muscle memory."}
              {activeTab === VowelCategory.GENERATOR && "Generate custom practice stories. The AI automatically colors the vowels to help you read."}
            </p>
        </div>

        {/* ORAL VOWELS GRID */}
        {activeTab === VowelCategory.ORAL && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ORAL_VOWELS.map((vowel) => (
              <VowelCard key={vowel.ipa} data={vowel} />
            ))}
          </div>
        )}

        {/* NASAL VOWELS GRID */}
        {activeTab === VowelCategory.NASAL && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {NASAL_VOWELS.map((vowel) => (
              <VowelCard key={vowel.ipa} data={vowel} />
            ))}
          </div>
        )}

        {/* CONTRASTS */}
        {activeTab === VowelCategory.CONTRAST && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONTRASTS.map((pair) => (
              <ContrastTrainer key={pair.id} data={pair} />
            ))}
          </div>
        )}

        {/* ROUTINE */}
        {activeTab === VowelCategory.ROUTINE && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>Instructions</span>
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-slate-700">
                    <li>Do this for 5 minutes every day.</li>
                    <li>Use a mirror to check your lip rounding.</li>
                    <li>Georgian speakers tend to "under-round". Exaggerate first!</li>
                </ul>
            </div>

            {ROUTINE.map((step, idx) => (
              <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-indigo-900">{step.title}</h3>
                  <span className="bg-indigo-200 text-indigo-800 text-xs font-bold px-2 py-1 rounded">Step {idx + 1}</span>
                </div>
                <p className="text-indigo-800 mb-4 italic">{step.instruction}</p>
                
                <div className="space-y-3">
                  {step.sequence.map((seq, sIdx) => (
                     <div key={sIdx} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                        <span className="font-mono text-xl font-bold text-slate-700">{seq}</span>
                        <button 
                           onClick={() => playPronunciation(seq.replace(/→|\/|-/g, " "))}
                           className="text-indigo-600 hover:text-indigo-800"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                            </svg>
                        </button>
                     </div>
                  ))}
                </div>
                <p className="text-sm text-slate-500 mt-4 border-t border-indigo-200 pt-3">
                    💡 {step.note}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* SMART GENERATOR */}
        {activeTab === VowelCategory.GENERATOR && (
            <SmartTextGenerator />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12 py-8 bg-slate-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="text-slate-300 text-[10px] mt-2">v1.2 • Hybrid Audio Engine</p>
        </div>
      </footer>
    </div>
  );
};

export default App;