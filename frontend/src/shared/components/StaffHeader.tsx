import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Sun, Moon, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StaffHeaderProps {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  assignedJobsCount: number;
  isQC: boolean;
}

export const StaffHeader: React.FC<StaffHeaderProps> = ({ darkMode, setDarkMode, assignedJobsCount, isQC }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole = typeof user?.role === 'string' ? user?.role : (user?.role as any)?.name;
  const tasksRoute = isQC ? '/qc/tasks' : '/operator/jobs';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getShift = () => {
    const hour = new Date().getHours();
    return hour < 15 ? 'Morning' : 'Evening';
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:flex bg-green-600 text-white px-6 h-20 justify-between items-center shadow-md z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xl font-bold leading-tight">{getGreeting()}, {user?.name?.split(' ')[0] || 'User'} 👋</p>
          </div>
          <div className="h-8 w-px bg-green-500 mx-2"></div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold leading-none">{isQC ? 'QC Checker' : userRole === 'OPERATOR' ? 'Packing Operator' : userRole?.replace('_', ' ')}</span>
            <span className="text-xs opacity-90 flex items-center gap-1 leading-none mt-1">
              <MapPin size={12} /> {(user as any)?.warehouse?.name || 'Hyderabad Warehouse'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            className="p-2 hover:bg-green-700 rounded-lg transition-colors relative"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => navigate(tasksRoute)} className="p-2 hover:bg-green-700 rounded-lg transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden bg-green-600 text-white px-4 py-4 shadow-md z-10 shrink-0 flex flex-col gap-3">
        {/* Top Row: Notifications */}
        <div className="flex justify-end items-center">
          <div className="flex items-center gap-2">
            <button 
              className="p-1 hover:bg-green-700 rounded-lg transition-colors relative"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            <button onClick={() => navigate(tasksRoute)} className="p-1 hover:bg-green-700 rounded-lg transition-colors relative">
              <Bell size={24} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-green-600 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Second Row: Greeting */}
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}, {user?.name?.split(' ')[0] || 'User'} 👋</h1>
        </div>

        {/* Third Row: Role & Warehouse */}
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold opacity-95">{isQC ? 'QC Checker' : userRole === 'OPERATOR' ? 'Packing Operator' : userRole?.replace('_', ' ')}</span>
          <span className="text-xs opacity-80 flex items-center gap-1">
            <MapPin size={12} /> {(user as any)?.warehouse?.name || 'Hyderabad Warehouse'}
          </span>
        </div>

        {/* Fourth Row: Operational Summary */}
        <div className="mt-1 bg-green-700/50 rounded-xl p-2.5 flex items-center justify-center text-[11px] font-medium opacity-90 text-center">
          {isQC 
            ? <>🟢 Shift: {getShift()} &bull; Ready for Inspection &bull; {assignedJobsCount} Assigned QC Tasks</>
            : <>🟢 Shift: {getShift()} &bull; Ready for Packing &bull; {assignedJobsCount} Assigned Jobs</>
          }
        </div>
      </header>
    </>
  );
};
