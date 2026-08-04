import React, { useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Layers,
  ArrowUpRight,
  PlayCircle,
  QrCode,
  ShieldCheck,
  PackageCheck,
  RefreshCw,
  BarChart3,
  ClipboardCheck,
  X,
  Bell,
  Settings
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface MenuItem {
  type: 'section' | 'link';
  sectionTitle?: string;
  path?: string;
  label?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

const sidebarConfig: MenuItem[] = [
  {
    type: 'link',
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    type: 'section',
    sectionTitle: 'RECIPE & CONFIG',
  },
  {
    type: 'link',
    path: '/master-data',
    label: 'Master Data',
    icon: Layers,
  },
  {
    type: 'link',
    path: '/recipe-bom',
    label: 'Recipe / BOM',
    icon: ClipboardList,
  },
  {
    type: 'link',
    path: '/work-orders',
    label: 'Work Orders',
    icon: Layers,
  },
  {
    type: 'section',
    sectionTitle: 'OPERATIONS',
  },
  {
    type: 'link',
    path: '/material-issue',
    label: 'Material Issue',
    icon: ArrowUpRight,
  },
  {
    type: 'link',
    path: '/packing-execution',
    label: 'Packing Execution',
    icon: PlayCircle,
  },
  {
    type: 'section',
    sectionTitle: 'POST PACKING',
  },
  {
    type: 'link',
    path: '/barcodes-labels',
    label: 'Barcodes & Labels',
    icon: QrCode,
  },
  {
    type: 'link',
    path: '/quality-check',
    label: 'Quality Check',
    icon: ShieldCheck,
  },
  {
    type: 'link',
    path: '/finished-goods',
    label: 'Finished Goods',
    icon: PackageCheck,
  },
  {
    type: 'link',
    path: '/repacking',
    label: 'Repacking',
    icon: RefreshCw,
  },
  {
    type: 'section',
    sectionTitle: 'ADMINISTRATION',
  },
  {
    type: 'link',
    path: '/approvals',
    label: 'Approvals',
    icon: ClipboardCheck,
  },
  {
    type: 'link',
    path: '/notifications',
    label: 'Notifications',
    icon: Bell,
  },
  {
    type: 'link',
    path: '/settings',
    label: 'Settings',
    icon: Settings,
  },
  {
    type: 'section',
    sectionTitle: 'REPORTS',
  },
  {
    type: 'link',
    path: '/reports',
    label: 'Reports',
    icon: BarChart3,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();

  const isItemActive = useCallback(
    (path: string): boolean => {
      if (path === '/') {
        return location.pathname === '/';
      }
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  const renderSectionHeader = useCallback((title: string) => {
    return (
      <div className="mt-1">
        <div className="px-3 py-2 mb-2">
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {title}
          </span>
        </div>
      </div>
    );
  }, []);

  const renderLinkItem = useCallback(
    (section: MenuItem) => {
      if (!section.path || !section.label || !section.icon) return null;

      const isActive = isItemActive(section.path);
      const Icon = section.icon;

      return (
        <div className="mt-1" key={section.path}>
          <Link
            to={section.path}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 transition-all text-sm ${isActive
                ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400'
              }`}
          >
            <Icon size={16} />
            <span>{section.label}</span>
          </Link>
        </div>
      );
    },
    [isItemActive, setIsOpen]
  );

  return (
    <aside
      className={`w-72 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 h-screen flex flex-col fixed left-0 top-0 z-50 overflow-hidden transition-transform duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700 ${isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      style={{ fontFamily: "'Segoe UI', sans-serif" }}
    >
      {/* Header Section - Logo and Close Button */}
      <div className="py-4 pl-5 pr-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          {/* Logo only - wider, centered in sidebar, height unchanged */}
          <div className="flex-1 min-w-0 h-12 flex items-center justify-center overflow-hidden">
            <img
              src="/villagekart_svg_icon-2.svg"
              alt="VillagKart"
              className="max-w-[260px] w-full h-full object-contain object-center"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const icon = document.createElement('div');
                  icon.innerHTML =
                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
                  parent.appendChild(icon);
                }
              }}
            />
          </div>
          {/* Close Button - Visible on mobile */}
          {setIsOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Close menu"
            >
              <X size={18} className="text-gray-700 dark:text-gray-300" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Section - All menu items are rendered here */}
      <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden sidebar-scrollbar min-h-0">
        {sidebarConfig.map((section, index) => {
          const key = section.sectionTitle || section.path || `sidebar-${index}`;
          switch (section.type) {
            case 'section':
              return section.sectionTitle ? (
                <div key={key}>{renderSectionHeader(section.sectionTitle)}</div>
              ) : null;
            case 'link':
              return <div key={key}>{renderLinkItem(section)}</div>;
            default:
              return null;
          }
        })}
      </nav>
    </aside>
  );
};
