import React from 'react';
import { AlertCircle } from 'lucide-react';


interface PagePlaceholderProps {
  title: string;
  stepNumber: number;
}

export const PagePlaceholder: React.FC<PagePlaceholderProps> = ({ title, stepNumber }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center max-w-2xl mx-auto mt-12">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-500 ring-4 ring-slate-50">
        <AlertCircle size={28} />
      </div>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
      
      <p className="text-slate-600 mb-6 max-w-md">
        This module is currently part of <strong>Step {stepNumber}</strong> in the development plan. It is structured and routed, but the interface content is not yet built out.
      </p>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 w-full text-left font-medium text-sm text-slate-600 mb-8 space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider">
          <span>Development Phase</span>
          <span>Status</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-700">1. Portal Shell (Sidebar & Routing)</span>
          <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-100">Completed</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-700">{stepNumber}. {title}</span>
          <span className="text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full text-xs font-bold border border-indigo-100">Scheduled</span>
        </div>
      </div>

      <div className="text-xs text-slate-400 font-mono">
        VillagKart Packing & Repacking ERP System
      </div>
    </div>
  );
};
