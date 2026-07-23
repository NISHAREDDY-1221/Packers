import React from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import {
  Mail,
  Shield,
  LogOut,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Package,
  Clock,
  Star,
  Settings,
  Bell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { workOrders, qualityChecks } = useApp();
  const navigate = useNavigate();

  const userRole =
    typeof user?.role === "string"
      ? user.role
      : (user?.role as any)?.name || "OPERATOR";

  const initials = (user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Stats
  const totalOrders =
    userRole === "QC_CHECKER" ? qualityChecks.length : workOrders.length;
  const completedOrders =
    userRole === "QC_CHECKER"
      ? qualityChecks.filter((q) => q.result === "Pass").length
      : workOrders.filter(
          (w) => w.status === "Completed" || w.status === "Labels Printed",
        ).length;
  const slaPercent =
    totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Green Header with Avatar - VillagKart style */}
      <div className="bg-[#00891D] -mx-2 md:-mx-4 -mt-2 md:-mt-4 px-5 pt-5 pb-10 text-center relative">
        {/* Back Button */}
        <div className="absolute left-4 top-5">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
        </div>

        {/* Avatar Circle */}
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
          <span className="text-[#00891D] font-bold text-xl">{initials}</span>
        </div>

        {/* Name & Role */}
        <h2 className="text-white text-lg font-bold mt-3">
          {user?.name || "Loading..."}
        </h2>
        <p className="text-green-100 text-xs mt-0.5">
          {userRole.replace("_", " ")} · VillagKart Store
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 text-center min-w-[70px]">
            <p className="text-white text-lg font-bold">{totalOrders}</p>
            <p className="text-green-100 text-[10px] font-medium">Orders</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 text-center min-w-[70px]">
            <p className="text-white text-lg font-bold">{completedOrders}</p>
            <p className="text-green-100 text-[10px] font-medium">Completed</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-lg px-4 py-2 text-center min-w-[70px]">
            <p className="text-white text-lg font-bold">{slaPercent}%</p>
            <p className="text-green-100 text-[10px] font-medium">SLA %</p>
          </div>
        </div>
      </div>

      {/* Store Operations Section */}
      <div className="px-4 mt-6">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          Store Operations
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() =>
              navigate(
                userRole === "QC_CHECKER"
                  ? "/quality-check"
                  : "/packing-execution",
              )
            }
            className="w-full flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600">
              {userRole === "QC_CHECKER" ? (
                <ShieldCheck size={18} />
              ) : (
                <Package size={18} />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {userRole === "QC_CHECKER"
                  ? "Quality Inspections"
                  : "Packing Queue"}
              </p>
              <p className="text-[11px] text-gray-400">
                {userRole === "QC_CHECKER"
                  ? "View pending inspections"
                  : "View active packing jobs"}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>

          <button
            onClick={() => navigate("/order-history")}
            className="w-full flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Clock size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Order History
              </p>
              <p className="text-[11px] text-gray-400">
                View past completed orders
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>

          <button
            onClick={() => navigate("/notifications")}
            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
              <Bell size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Notifications
              </p>
              <p className="text-[11px] text-gray-400">
                Alerts and updates
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>
      </div>

      {/* Store Info Section */}
      <div className="px-4 mt-6">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          Account Info
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
              <Mail size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {user?.email || "N/A"}
              </p>
              <p className="text-[11px] text-gray-400">Email Address</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
              <Shield size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {userRole.replace("_", " ")}
              </p>
              <p className="text-[11px] text-gray-400">Account Role</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
              <Settings size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Account Settings
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>

          <div className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600">
              <Star size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Performance
              </p>
              <p className="text-[11px] text-gray-400">
                {slaPercent}% completion rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="px-4 mt-6">
        <button
          onClick={handleLogout}
          className="w-full bg-white dark:bg-gray-800 text-red-500 font-semibold py-3.5 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
};
