import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { NavItem } from './Sidebar';

interface BottomNavigationProps {
  navItems: NavItem[];
  baseRoute: string; // e.g., '/operator' or '/qc'
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ navItems, baseRoute }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // On mobile, show max 5 items. You can slice it or filter as needed.
  // Assuming the navItems passed in are already exactly what should show on mobile.
  const mobileNavItems = navItems.slice(0, 5);

  return (
    <nav className="md:hidden absolute bottom-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 shrink-0">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path !== baseRoute && location.pathname.startsWith(item.path));
        // Short labels for mobile
        const mobileLabel = item.label === 'Dashboard' ? 'Home' : item.label === 'Packing History' || item.label === 'QC History' ? 'History' : item.label;
        
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-green-600' : 'text-gray-500 dark:text-gray-400 hover:text-green-500'
              }`}
          >
            <Icon size={20} className={isActive ? 'fill-green-50/50' : ''} />
            <span className="text-[10px] font-medium text-center leading-tight">{mobileLabel}</span>
          </button>
        );
      })}
    </nav>
  );
};
