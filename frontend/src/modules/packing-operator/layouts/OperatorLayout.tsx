import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListTodo, Package, History, AlertCircle, UserCircle, Bell } from 'lucide-react';
import { Sidebar } from '../../../shared/components/Sidebar';
import type { NavItem } from '../../../shared/components/Sidebar';
import { StaffHeader } from '../../../shared/components/StaffHeader';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import { workOrderService } from '../../../api/workOrderService';

const operatorNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/operator/dashboard' },
  { icon: ListTodo, label: 'My Jobs', path: '/operator/jobs' },
  { icon: Package, label: 'Active Packing', path: '/operator/active-packing' },
  { icon: History, label: 'Packing History', path: '/operator/history' },
  { icon: Bell, label: 'Notifications', path: '/operator/notifications' },
  { icon: AlertCircle, label: 'Report Issue', path: '/operator/report-issue' },
  { icon: UserCircle, label: 'Profile', path: '/operator/profile' },
];

export const OperatorLayout: React.FC = () => {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [assignedJobsCount, setAssignedJobsCount] = useState(0);
  const location = useLocation();
  
  const isProfilePage = location.pathname.includes('/profile');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    workOrderService.getWorkOrders().then((res: any) => setAssignedJobsCount(res.data.length)).catch(console.error);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900 font-sans w-full overflow-hidden">
      <Sidebar 
        navItems={operatorNavItems} 
        isSidebarHovered={isSidebarHovered} 
        setIsSidebarHovered={setIsSidebarHovered} 
        baseRoute="/operator"
      />
      
      <div className="flex flex-col flex-1 min-w-0 relative">
        {!isProfilePage && (
          <StaffHeader 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            assignedJobsCount={assignedJobsCount} 
            isQC={false} 
          />
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 scroll-smooth bg-slate-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        <BottomNavigation 
          navItems={operatorNavItems.filter(item => ['Dashboard', 'My Jobs', 'Active Packing', 'Packing History', 'Profile'].includes(item.label))} 
          baseRoute="/operator"
        />
      </div>
    </div>
  );
};

