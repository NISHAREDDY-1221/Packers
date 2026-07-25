import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, ListTodo, History, UserCircle, LogOut, PackageCheck, Package, AlertCircle, LayoutDashboard, Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { workOrderService } from '../api/workOrderService';

export const MobileLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [assignedJobsCount, setAssignedJobsCount] = useState(0);

  const userRole = typeof user?.role === 'string' ? user?.role : (user?.role as any)?.name;
  const isQC = userRole === 'QC_INSPECTOR';

  useEffect(() => {
    if (!isQC) {
      workOrderService.getWorkOrders().then(res => setAssignedJobsCount(res.data.length)).catch(console.error);
    }
  }, [isQC]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  const navItems = isQC ? [
    { icon: Home, label: 'Home', path: '/staff' },
    { icon: PackageCheck, label: 'QC Tasks', path: '/staff/tasks' },
    { icon: History, label: 'History', path: '/staff/history' },
    { icon: UserCircle, label: 'Profile', path: '/staff/profile' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/staff' },
    { icon: ListTodo, label: 'My Jobs', path: '/staff/tasks' },
    { icon: Package, label: 'Active Packing', path: '/staff/active' },
    { icon: History, label: 'Packing History', path: '/staff/history' },
    { icon: AlertCircle, label: 'Report Issue', path: '/staff/issues' },
    { icon: UserCircle, label: 'Profile', path: '/staff/profile' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans w-full overflow-hidden">
      {/* Desktop/Tablet Sidebar (Hidden on mobile) */}
      <aside 
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
          ${isSidebarHovered ? 'w-64' : 'w-20'} lg:w-64`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
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
            const isActive = location.pathname === item.path || (item.path !== '/staff' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center p-3 rounded-xl transition-all group relative overflow-hidden ${
                  isActive 
                    ? 'bg-green-50 text-green-700' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-green-600'
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
        
        <div className="p-4 border-t border-gray-100 shrink-0">
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

      {/* Main Content Column */}
      <div className="flex flex-col flex-1 min-w-0 relative">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-green-600 text-white px-6 h-20 justify-between items-center shadow-md z-10 shrink-0">
          {isQC ? (
            <div className="flex flex-col">
              <span className="font-bold text-xl leading-tight">VillagKart</span>
              <span className="text-xs font-semibold opacity-90 uppercase tracking-wider">{userRole?.replace('_', ' ')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xl font-bold leading-tight">{getGreeting()}, {user?.name?.split(' ')[0]} 👋</p>
              </div>
              <div className="h-8 w-px bg-green-500 mx-2"></div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold leading-none">{userRole?.replace('_', ' ')}</span>
                <span className="text-xs opacity-90 flex items-center gap-1 leading-none mt-1">
                  <span className="text-[10px]">📍</span> Hyderabad Warehouse
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            {!isQC && (
              <button className="p-2 hover:bg-green-700 rounded-lg transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-2 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors">
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden bg-green-600 text-white px-4 py-4 shadow-md z-10 shrink-0 flex flex-col gap-3">
          {isQC ? (
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">VillagKart</span>
                <span className="text-[10px] opacity-80 uppercase tracking-wider">{userRole?.replace('_', ' ')}</span>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-green-700 rounded-full transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <>
              {/* Top Row: Hamburger & Notifications */}
              <div className="flex justify-between items-center">
                <button className="p-1 hover:bg-green-700 rounded-lg transition-colors">
                  <Menu size={24} />
                </button>
                <button className="p-1 hover:bg-green-700 rounded-lg transition-colors relative">
                  <Bell size={24} />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-green-600 rounded-full"></span>
                </button>
              </div>

              {/* Second Row: Greeting */}
              <div>
                <h1 className="text-2xl font-bold">{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
              </div>

              {/* Third Row: Role & Warehouse */}
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold opacity-95">Packing Operator</span>
                <span className="text-xs opacity-80 flex items-center">
                  📍 Hyderabad Warehouse
                </span>
              </div>

              {/* Fourth Row: Operational Summary */}
              <div className="mt-1 bg-green-700/50 rounded-xl p-2.5 flex items-center justify-center text-[11px] font-medium opacity-90 text-center">
                🟢 Shift: {getShift()} &bull; Ready for Packing &bull; {assignedJobsCount} Assigned Jobs
              </div>
            </>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 scroll-smooth bg-slate-50">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="md:hidden absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 shrink-0">
          {(isQC ? navItems : navItems.filter(item => ['Dashboard', 'My Jobs', 'Active Packing', 'Packing History', 'Profile'].includes(item.label))).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/staff' && location.pathname.startsWith(item.path));
            // Adjust label for mobile if needed
            const mobileLabel = item.label === 'Dashboard' ? 'Home' : item.label === 'Packing History' ? 'History' : item.label;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-green-600' : 'text-gray-500 hover:text-green-500'
                  }`}
              >
                <Icon size={20} className={isActive ? 'fill-green-50/50' : ''} />
                <span className="text-[10px] font-medium">{mobileLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
