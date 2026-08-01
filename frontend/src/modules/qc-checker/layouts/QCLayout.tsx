import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Home, PackageCheck, Package, History, UserCircle } from 'lucide-react';
import { Sidebar } from '../../../shared/components/Sidebar';
import type { NavItem } from '../../../shared/components/Sidebar';
import { StaffHeader } from '../../../shared/components/StaffHeader';
import { BottomNavigation } from '../../../shared/components/BottomNavigation';
import { workOrderService } from '../../../api/workOrderService';

const qcNavItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', path: '/qc/dashboard' },
  { icon: PackageCheck, label: 'My QC Tasks', path: '/qc/tasks' },
  { icon: Package, label: 'Active QC', path: '/qc/active-inspection' },
  { icon: History, label: 'History', path: '/qc/history' },
  { icon: UserCircle, label: 'Profile', path: '/qc/profile' },
];

export const QCLayout: React.FC = () => {
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

  const QC_STATUSES = ['PACKING_COMPLETED', 'LABEL_APPLICATION_ASSIGNED', 'LABEL_APPLICATION_IN_PROGRESS', 'LABELS_APPLIED', 'QC_PENDING'];

  useEffect(() => {
    const fetchCount = () => {
      workOrderService.getWorkOrders({ limit: 500 }).then((res: any) => {
        const qcJobs = (res.data || []).filter((wo: any) => QC_STATUSES.includes(wo.status));
        setAssignedJobsCount(qcJobs.length);
      }).catch(console.error);
    };

    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900 font-sans w-full overflow-hidden">
      <Sidebar 
        navItems={qcNavItems} 
        isSidebarHovered={isSidebarHovered} 
        setIsSidebarHovered={setIsSidebarHovered} 
        baseRoute="/qc"
      />
      
      <div className="flex flex-col flex-1 min-w-0 relative">
        {!isProfilePage && (
          <StaffHeader 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
            assignedJobsCount={assignedJobsCount} 
            isQC={true} 
          />
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 scroll-smooth bg-slate-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        <BottomNavigation 
          navItems={qcNavItems} 
          baseRoute="/qc"
        />
      </div>
    </div>
  );
};
