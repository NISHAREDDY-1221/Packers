import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, Package, ShieldCheck, ExternalLink, ChevronDown, Sparkles } from 'lucide-react';

export const PortalSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const portals = [
    {
      id: 'admin',
      name: 'Admin Portal',
      subtitle: 'Work Orders, Approvals & Inventory',
      icon: Building2,
      path: '/',
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      isActive: !currentPath.startsWith('/operator') && !currentPath.startsWith('/qc'),
    },
    {
      id: 'operator',
      name: 'Packing Operator',
      subtitle: 'Batch Execution & Packaging Jobs',
      icon: Package,
      path: '/operator/dashboard',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      borderColor: 'border-blue-200 dark:border-blue-800',
      isActive: currentPath.startsWith('/operator'),
    },
    {
      id: 'qc',
      name: 'QC Checker',
      subtitle: 'Quality Checks & Inspection Logs',
      icon: ShieldCheck,
      path: '/qc/dashboard',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40',
      borderColor: 'border-purple-200 dark:border-purple-800',
      isActive: currentPath.startsWith('/qc'),
    },
  ];

  const activePortal = portals.find(p => p.isActive) || portals[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Switcher Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-gray-700/80 hover:bg-slate-200 dark:hover:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-xs font-bold text-slate-800 dark:text-gray-100 transition-all cursor-pointer shadow-2xs"
        title="Switch portal or open in 3 tabs"
      >
        <Sparkles size={14} className="text-amber-500 shrink-0" />
        <span className="hidden sm:inline font-semibold">{activePortal.name}</span>
        <span className="sm:hidden font-semibold">{activePortal.name.split(' ')[0]}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Switcher Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-gray-700 p-3 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-100 dark:border-gray-700">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Switch Portal</p>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">Work on all 3 portals simultaneously</p>
            </div>
          </div>

          <div className="space-y-2">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <div
                  key={portal.id}
                  className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    portal.isActive
                      ? `${portal.bgColor} ${portal.borderColor} ring-1 ring-emerald-500/20`
                      : 'border-slate-100 dark:border-gray-750 hover:bg-slate-50 dark:hover:bg-gray-750'
                  }`}
                >
                  <button
                    onClick={() => {
                      navigate(portal.path);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 flex-1 text-left cursor-pointer"
                  >
                    <div className={`p-2 rounded-lg ${portal.bgColor} ${portal.color}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {portal.name}
                        </p>
                        {portal.isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400">
                        {portal.subtitle}
                      </p>
                    </div>
                  </button>

                  <a
                    href={portal.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in new tab (Work in 3 portals)"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
