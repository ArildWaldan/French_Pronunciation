import React from 'react';

const AssetGenerator: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-200 p-4 border-t border-slate-700 z-50 transition-transform duration-300 transform translate-y-0">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-bold text-white flex items-center gap-2">
            <span>🛠 Asset Generator</span>
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Disabled</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            TTS Generation has been disabled. The app is now in "Static Audio Only" mode.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssetGenerator;
