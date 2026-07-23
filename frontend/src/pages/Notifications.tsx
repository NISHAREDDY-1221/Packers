import React from "react";
import { Bell } from "lucide-react";

export const Notifications: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center min-h-[300px] flex flex-col justify-center items-center max-w-2xl mx-auto mt-8">
      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-500">
        <Bell size={24} />
      </div>
      <h2 className="text-lg font-bold text-slate-800 mb-2">Notifications</h2>
      <p className="text-slate-500 max-w-sm text-sm">
        System alerts, material shortages, and workflow notifications will be
        displayed here.
      </p>
    </div>
  );
};
