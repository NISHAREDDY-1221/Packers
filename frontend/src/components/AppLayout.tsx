import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "../context/AuthContext";
import { Home, ClipboardList, Layers, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userRole =
    typeof user?.role === "string" ? user.role : (user?.role as any)?.name;
  if (userRole === "ADMIN") return null;

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      path: "/",
      label: "Home",
      icon: Home,
    },
    ...(userRole === "OPERATOR"
      ? [
          {
            path: "/packing-execution",
            label: "Packing",
            icon: Layers,
          },
        ]
      : []),
    ...(userRole === "QC_CHECKER"
      ? [
          {
            path: "/quality-check",
            label: "QC Check",
            icon: Layers,
          },
        ]
      : []),
    {
      path: "/order-history",
      label: "Orders",
      icon: ClipboardList,
    },
    {
      path: "/profile",
      label: "Profile",
      icon: User,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 flex justify-around items-center h-16 px-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors " +
              (active ? "text-[#00891D]" : "text-gray-400")
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 overflow-x-hidden relative">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 md:ml-72 min-w-0 overflow-x-hidden h-screen overflow-y-auto bg-gray-100 dark:bg-gray-900">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-2 md:p-4 overflow-x-hidden bg-gray-100 dark:bg-gray-900 min-h-screen pb-20 md:pb-4">
          <Outlet />
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <MobileBottomNav />
    </div>
  );
};
