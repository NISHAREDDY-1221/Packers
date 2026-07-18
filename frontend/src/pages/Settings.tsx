import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center min-h-[300px] flex flex-col justify-center items-center max-w-2xl mx-auto mt-8">
      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-500">
        <SettingsIcon size={24} />
      </div>
      <h2 className="text-lg font-bold text-slate-800 mb-2">Settings</h2>
      <p className="text-slate-500 max-w-sm text-sm">
        Configure packing preferences, printer layouts, and user profile parameters.
      </p>
    </div>
  );
};
