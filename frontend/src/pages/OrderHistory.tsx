import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  ClipboardCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HistoryItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  status: string;
  type: "qc" | "wo" | "repack";
}

const STATUS_FILTERS_QC = [
  "All",
  "Pass",
  "Reject",
  "Rework",
  "Partial Pass"
];
const STATUS_FILTERS_OP = [
  "All",
  "Completed",
  "QC Pending",
  "QC Passed",
  "QC Printed",
  "Cancelled",
  "Repacked",
];

export const OrderHistory: React.FC = () => {
  const { user } = useAuth();
  const { workOrders, qualityChecks, repackings } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const userRole =
    typeof user?.role === "string"
      ? user.role
      : (user?.role as any)?.name || "OPERATOR";

  const filters =
    userRole === "QC_CHECKER" ? STATUS_FILTERS_QC : STATUS_FILTERS_OP;

  const historyItems = useMemo(() => {
    let items: HistoryItem[] = [];

    if (userRole === "QC_CHECKER") {
      items = qualityChecks.map((qc) => ({
        id: qc.id,
        title: "QC - " + (qc.woNo || "Unknown"),
        subtitle: qc.productName || "",
        date: qc.date,
        status: qc.result,
        type: "qc" as const,
      }));
    } else {
      const woItems = workOrders
        .filter(
          (wo) =>
            wo.status === "Completed" ||
            wo.status === "QC Pending" ||
            wo.status === "QC Passed" ||
            wo.status === "QC Printed" ||
            wo.status === "Cancelled",
        )
        .map((wo) => ({
          id: wo.id,
          title: wo.woNo,
          subtitle: wo.productName,
          date: wo.date || new Date().toISOString().split("T")[0],
          status: wo.status,
          type: "wo" as const,
        }));
        
      const rpItems = repackings.map((rp) => ({
        id: rp.id,
        title: "Repack - " + rp.newBatchNo,
        subtitle: rp.productName || "Repacking",
        date: rp.createdAt?.split(" ")[0] || new Date().toISOString().split("T")[0],
        status: "Repacked",
        type: "repack" as const,
      }));

      items = [...woItems, ...rpItems];
    }

    // Apply status filter
    if (activeFilter !== "All") {
      items = items.filter((item) => item.status === activeFilter);
    }

    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q),
      );
    }

    return items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [workOrders, qualityChecks, repackings, userRole, searchQuery, activeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pass":
      case "Completed":
      case "QC Passed":
        return "text-green-600 bg-green-50";
      case "Reject":
      case "Discard":
      case "Cancelled":
        return "text-red-600 bg-red-50";
      case "Rework":
        return "text-orange-600 bg-orange-50";
      case "QC Pending":
        return "text-amber-600 bg-amber-50";
      case "QC Printed":
        return "text-blue-600 bg-blue-50";
      case "Repacked":
        return "text-indigo-600 bg-indigo-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pass":
      case "Completed":
      case "QC Passed":
        return <CheckCircle size={14} />;
      case "Reject":
      case "Discard":
      case "Cancelled":
        return <XCircle size={14} />;
      case "Rework":
        return <RefreshCw size={14} />;
      case "QC Pending":
        return <AlertTriangle size={14} />;
      case "Repacked":
        return <RefreshCw size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Green Header Banner - VillagKart style */}
      <div className="bg-[#00891D] -mx-2 md:-mx-4 -mt-2 md:-mt-4 px-5 pt-5 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center hover:bg-white/25 transition-colors"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-white text-lg font-bold">Order History</h1>
            <p className="text-green-100 text-xs">
              {historyItems.length} orders total
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 mt-4">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by Order ID / Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 rounded-xl py-3 pl-12 pr-4 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-gray-800 dark:text-gray-200"
          />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-1 tabs-scrollbar">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={
                "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors " +
                (activeFilter === filter
                  ? "bg-[#00891D] text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-green-400")
              }
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="px-4 mt-4">
        {historyItems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <ClipboardCheck
              size={48}
              className="mx-auto text-gray-200 dark:text-gray-600 mb-4"
            />
            <h3 className="text-gray-800 dark:text-gray-200 font-bold text-base">
              No orders found
            </h3>
            <p className="text-gray-400 text-sm mt-2">
              {searchQuery
                ? "Try adjusting your filters or search query."
                : "No completed orders yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {historyItems.map((item, idx) => (
              <div
                key={item.id + "-" + idx}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-3 hover:shadow-sm transition-shadow"
              >
                {/* Status icon */}
                <div
                  className={
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 " +
                    getStatusColor(item.status)
                  }
                >
                  {getStatusIcon(item.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {item.subtitle}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {item.date}
                    </span>
                    <span
                      className={
                        "text-[10px] font-bold px-2 py-0.5 rounded-full " +
                        getStatusColor(item.status)
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <ChevronRight
                  size={18}
                  className="text-gray-300 flex-shrink-0"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
