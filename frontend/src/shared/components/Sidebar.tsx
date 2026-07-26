import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface SidebarProps {
  navItems: NavItem[];
  isSidebarHovered: boolean;
  setIsSidebarHovered: (v: boolean) => void;
  baseRoute: string; // e.g., '/operator' or '/qc'
}

export const Sidebar: React.FC<SidebarProps> = ({ navItems, isSidebarHovered, setIsSidebarHovered, baseRoute }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside 
      className={`hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        ${isSidebarHovered ? 'w-64' : 'w-20'} lg:w-64`}
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={() => setIsSidebarHovered(false)}
    >
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center h-10 w-full">
            <img
              src="/villagekart_svg_icon-2.svg"
              alt="VillagKart"
              className="max-w-[180px] h-full object-contain"
            />
          </div>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto sidebar-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== baseRoute && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center p-3 rounded-xl transition-all group relative overflow-hidden ${
                isActive 
                  ? 'bg-green-50 text-green-700' 
                  : 'text-slate-500 hover:bg-slate-50 dark:bg-gray-900 hover:text-green-600'
              }`}
            >
              <div className={`flex items-center justify-center shrink-0 ${isActive ? 'text-green-600' : 'text-slate-400 group-hover:text-green-500'}`}>
                <Icon size={22} className={isActive ? 'fill-green-100' : ''} />
              </div>
              <span className={`ml-3 font-medium whitespace-nowrap transition-opacity duration-300 lg:opacity-100 lg:w-auto ${
                isSidebarHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
              }`}>
                {item.label}
              </span>
              
              {/* Active Indicator Line */}
              {isActive && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-r-full transition-opacity duration-300 lg:opacity-100 ${
                  isSidebarHovered ? 'opacity-100' : 'opacity-0'
                }`} />
              )}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center p-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors group relative overflow-hidden`}
        >
          <div className="flex items-center justify-center shrink-0 text-red-400 group-hover:text-red-500">
            <LogOut size={22} />
          </div>
          <span className={`ml-3 font-medium whitespace-nowrap transition-opacity duration-300 lg:opacity-100 lg:w-auto ${
            isSidebarHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
          }`}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};
