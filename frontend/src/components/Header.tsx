import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LogOut,
  Bell,
  Settings,
  Menu,
  Clock,
  Sun,
  Moon,
  ChevronDown,
  X,
  ClipboardList,
  Layers,
  PlayCircle,
  ShieldCheck,
  PackageCheck,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  QrCode,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";

interface HeaderProps {
  onMenuClick?: () => void;
}

interface SearchResult {
  id: string;
  type:
    | "recipe"
    | "workOrder"
    | "materialIssue"
    | "execution"
    | "label"
    | "qc"
    | "fg"
    | "repack"
    | "report";
  title: string;
  subtitle?: string;
  route: string;
}



export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user: authUser, logout } = useAuth();
  const { workOrders, recipes } = useApp();

  const user = authUser
    ? {
        displayName: authUser.name,
        role:
          typeof authUser.role === "string"
            ? authUser.role
            : (authUser.role as any)?.name || "USER",
        email: authUser.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.name)}&background=00891d&color=fff&size=128&bold=true`,
      }
    : {
        displayName: "Loading...",
        role: "...",
        email: "...",
        avatar:
          "https://ui-avatars.com/api/?name=Loading&background=00891d&color=fff&size=128&bold=true",
      };

  const dynamicSearchData = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = [];
    
    recipes.forEach((r) => {
      results.push({
        id: r.id,
        type: "recipe",
        title: r.packingName || r.id,
        subtitle: `SKU: ${r.outputSku}`,
        route: "/recipe-bom"
      });
    });

    workOrders.forEach((w) => {
      results.push({
        id: w.id,
        type: "workOrder",
        title: w.woNo,
        subtitle: `${w.productName} - ${w.status}`,
        route: "/work-orders"
      });
    });

    return results;
  }, [workOrders, recipes]);

  const notifications = useMemo(() => {
    const notifs = [];
    
    const urgent = workOrders.filter((w) => w.priority === "URGENT" || w.priority === "Urgent");
    if (urgent.length > 0) {
      notifs.push({
        id: "urgent-wos",
        text: `There are ${urgent.length} urgent work orders pending.`,
        timeAgo: "Just now",
      });
    }

    const qcPending = workOrders.filter((w) => w.status === "QC Pending");
    if (qcPending.length > 0) {
      notifs.push({
        id: "qc-pending",
        text: `${qcPending.length} completed jobs are waiting for Quality Check.`,
        timeAgo: "10 min ago",
      });
    }
    
    return notifs;
  }, [workOrders]);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return dynamicSearchData.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(query)),
    );
  }, [searchQuery, dynamicSearchData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(e.target.value.trim().length > 0);
  };

  const handleSearchResultClick = (result: SearchResult) => {
    navigate(result.route);
    setSearchQuery("");
    setShowSearchResults(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    setShowSearchResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "recipe":
        return <ClipboardList size={16} className="text-blue-500" />;
      case "workOrder":
        return <Layers size={16} className="text-orange-500" />;
      case "materialIssue":
        return <ArrowUpRight size={16} className="text-purple-500" />;
      case "execution":
        return <PlayCircle size={16} className="text-green-500" />;
      case "label":
        return <QrCode size={16} className="text-yellow-500" />;
      case "qc":
        return <ShieldCheck size={16} className="text-red-500" />;
      case "fg":
        return <PackageCheck size={16} className="text-indigo-500" />;
      case "repack":
        return <RefreshCw size={16} className="text-pink-500" />;
      case "report":
        return <BarChart3 size={16} className="text-teal-500" />;
    }
  };

  const getResultTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "recipe":
        return "Recipe";
      case "workOrder":
        return "Work Order";
      case "materialIssue":
        return "Material Issue";
      case "execution":
        return "Execution";
      case "label":
        return "Label";
      case "qc":
        return "Quality Check";
      case "fg":
        return "Finished Goods";
      case "repack":
        return "Repacking";
      case "report":
        return "Report";
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 py-4 px-2 md:px-4 flex items-center justify-between sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 md:gap-3 flex-1">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={22} className="text-gray-600 dark:text-gray-300" />
        </button>

        {/* Search Bar */}
        <div ref={searchRef} className="relative max-w-sm flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10"
            size={18}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search orders, customers, products..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() =>
              searchQuery.trim().length > 0 && setShowSearchResults(true)
            }
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={handleSearchClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={16} />
            </button>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
              <div className="p-2">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSearchResultClick(result)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="mt-0.5">{getResultIcon(result.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {result.title}
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {getResultTypeLabel(result.type)}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {showSearchResults &&
            searchQuery.trim().length > 0 &&
            searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No results found
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Try searching for recipes, work orders, material issues,
                    quality checks, finished goods, repacking, or reports.
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>

      <div className="flex items-center gap-2">

        {/* Notifications */}
        <div className="relative">
          <button
            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            onClick={() => setShowNotifications((prev) => !prev)}
          >
            <Bell size={20} className="text-gray-600 dark:text-gray-300" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {showNotifications && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowNotifications(false)}
              />
              <div className="fixed left-4 right-4 top-16 w-auto sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[380px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 sm:origin-top-right">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Notifications
                  </h3>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-snug">
                        {item.text}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                        <Clock
                          size={12}
                          className="text-gray-400 dark:text-gray-500"
                        />
                        <span>{item.timeAgo}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate("/notifications");
                  }}
                  className="w-full text-center text-xs sm:text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium py-2.5 border-t border-gray-100 dark:border-gray-700"
                >
                  See all notifications
                </button>
              </div>
            </>
          )}
        </div>

        {/* Settings */}
        <button
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Settings"
          onClick={() => navigate("/settings")}
        >
          <Settings size={20} className="text-gray-600 dark:text-gray-300" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
          >
            {/* Avatar */}
            <div className="relative w-9 h-9">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-9 h-9 rounded-full object-cover"
              />
            </div>

            {/* Name + Role */}
            <div className="text-left hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-none">
                {user.displayName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.role}
              </p>
            </div>

            {/* Chevron inside circle */}
            <div
              className={`flex items-center justify-center w-6 h-6 border border-gray-300 dark:border-gray-600 rounded-full transition-transform duration-200 ${
                showDropdown ? "rotate-180" : ""
              }`}
            >
              <ChevronDown size={14} className="text-gray-500" />
            </div>
          </button>
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              ></div>
              <div className="fixed left-4 right-4 top-16 w-auto sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 sm:origin-top-right">
                <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                    {user.displayName}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
