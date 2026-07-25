import React, { useEffect } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { NavLink, useNavigate } from "react-router-dom";
import {
  User,
  BarChart3,
  AlertTriangle,
  Layers,
  Package,
  ShieldCheck,
  Flame,
  Clock,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  UserCheck,
  PlayCircle,
  ClipboardList,
  Bell,
  Moon,
  AlertOctagon,
  CheckSquare,
  XCircle,
  ArrowRight,
} from "lucide-react";

const MetricCard = ({
  title,
  value,
  icon: Icon,
  colorClass,
  bgColorClass,
}: any) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center gap-2 border border-slate-100 z-20 relative">
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${bgColorClass} ${colorClass}`}
    >
      <Icon size={20} />
    </div>
    <h3 className="text-2xl font-bold text-gray-800 leading-none">{value}</h3>
    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
      {title}
    </p>
  </div>
);

export const Dashboard: React.FC = () => {
  const { qualityChecks, finishedGoods, repackings, workOrders, materialIssues, refreshGlobalData } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userRole =
    typeof user?.role === "string"
      ? user.role
      : (user?.role as any)?.name || "OPERATOR";

  useEffect(() => {
    refreshGlobalData();
  }, []);

  const pendingWOs = workOrders.filter(
    (w) =>
      w.status === "Pending" ||
      w.status === "Approved" ||
      w.status === "Material Issued" ||
      w.status === "Packing Started" ||
      w.status === "QC Pending",
  ).length;
  const completedWOs = workOrders.filter(
    (w) => w.status === "Completed" || w.status === "QC Printed",
  ).length;
  const qcRejects = qualityChecks.filter(
    (q) => q.result === "Reject" || q.result === "Rework",
  ).length;
  const todayOutput = finishedGoods.reduce(
    (sum, item) => sum + item.postedQty,
    0,
  );
  const todayRepacking = repackings.reduce(
    (sum, item) => sum + item.recoverableQuantity,
    0,
  );
  const activeWOs = workOrders
    .filter(
      (w) =>
        w.status !== "Completed" &&
        w.status !== "QC Printed" &&
        w.status !== "Cancelled",
    )
    .slice(0, 4);

  const todayDate = new Date().toISOString().split("T")[0];
  const todaysQCs = qualityChecks.filter((qc) => qc.date === todayDate);
  const pendingQCWOs = workOrders.filter((w) => w.status === "QC Pending");
  const qcPassed = todaysQCs.filter((qc) => qc.result === "Pass").length;
  const qcRejected = todaysQCs.filter((qc) => qc.result === "Reject").length;
  const qcRework = todaysQCs.filter((qc) => qc.result === "Rework").length;

  const passedUnitsToday = todaysQCs
    .filter((qc) => qc.result === "Pass" || qc.result === "Partial Pass")
    .reduce((sum, qc) => {
      const passed = qc.checks && typeof qc.checks === 'object' && 'passedQty' in qc.checks 
        ? Number((qc.checks as any).passedQty) 
        : qc.checkedQty;
      return sum + (passed || 0);
    }, 0);

  // Additional Admin KPI Calculations
  const avgPackingCost = finishedGoods.length > 0
    ? (finishedGoods.reduce((sum, fg) => sum + (fg.costs?.costPerUnit ?? 0), 0) / finishedGoods.length).toFixed(2)
    : "0.00";

  const totalWaste = repackings.reduce((sum, r) => sum + (r.wasteQuantity || 0), 0);
  const totalRecoverable = repackings.reduce((sum, r) => sum + (r.recoverableQuantity || 0), 0);
  const wastagePercent = totalRecoverable + totalWaste > 0 ? Math.round((totalWaste / (totalRecoverable + totalWaste)) * 100) : 0;

  const barcodeGenCount = workOrders
    .filter((w) => w.status === "QC Printed" || w.status === "Completed")
    .reduce((sum, w) => sum + (w.actualProduced || w.requiredQuantity || 0), 0);

  const activeHours = Math.max(1, new Date().getHours() - 8);
  const empProductivity = Math.round(todayOutput / activeHours);
  
  const packingEfficiency = workOrders.length > 0 
    ? Math.round((completedWOs / workOrders.length) * 100) 
    : 0;
    
  const machineUtil = workOrders.length > 0 ? Math.min(100, Math.round((activeWOs.length / workOrders.length) * 100) + 15) : 0;
  
  // -- Dynamic Panel Data (Admin) --
  const activeWOsAdmin = workOrders.filter(
    (w) => w.status !== "Completed" && w.status !== "QC Printed" && w.status !== "Cancelled"
  );

  const activeLines = workOrders
    .filter((w) => w.status === "Packing Started")
    .map((w) => ({
      lineId: w.assignedTeam || w.operator || "Line 1",
      productName: w.productName,
      progress: Math.round(((w.actualProduced || 0) / w.requiredQuantity) * 100),
      status: "Running"
    }));

  const materialShortages = materialIssues
    .flatMap((mi) => 
      mi.materials
        .filter((m) => (m.issued || 0) < m.required || mi.status === "Pending")
        .map((m) => ({
          woId: mi.woId,
          materialName: m.name,
          required: m.required,
          issued: m.issued || 0,
        }))
    )
    .slice(0, 3);

  const activeBatchesCount = new Set(activeWOsAdmin.map((w) => w.batchNumber)).size;
  const shiftTargetProgress = Math.round((completedWOs / Math.max(1, activeWOsAdmin.length + completedWOs)) * 100);

  const dailyProduction = finishedGoods.reduce((acc, fg) => {
    acc[fg.productName] = (acc[fg.productName] || 0) + fg.postedQty;
    return acc;
  }, {} as Record<string, number>);
  const dailyProductionArr = Object.entries(dailyProduction).map(([name, qty]) => ({ name, qty }));

  const categoryWise = workOrders.reduce((acc, wo) => {
    const cat = wo.productName.split(" ")[0] || "General";
    acc[cat] = (acc[cat] || 0) + (wo.actualProduced || 0);
    return acc;
  }, {} as Record<string, number>);
  const categoryWiseArr = Object.entries(categoryWise).map(([name, qty]) => ({ name, qty }));

  const employeePerformanceList = workOrders
    .filter((w) => w.status === "Completed" || w.status === "QC Printed")
    .reduce((acc, wo) => {
      const emp = wo.operator || wo.assignedTeam || "Unknown";
      acc[emp] = (acc[emp] || 0) + (wo.actualProduced || 0);
      return acc;
    }, {} as Record<string, number>);
  const employeePerformanceArr = Object.entries(employeePerformanceList).map(([name, qty]) => ({ name, qty }));

  const rmConsumption = materialIssues.reduce((acc, mi) => {
    mi.materials.forEach((m) => {
      acc[m.name] = (acc[m.name] || 0) + (m.issued || 0);
    });
    return acc;
  }, {} as Record<string, number>);
  const rmConsumptionArr = Object.entries(rmConsumption)
    .filter(([_, qty]) => qty > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, qty]) => ({ name, qty }));

  const rejectedItemsList = qualityChecks
    .filter((qc) => qc.result === "Reject" || qc.result === "Rework")
    .map((qc) => ({
      batchNo: qc.batchNo,
      product: qc.productName,
      status: qc.result,
    }))
    .slice(0, 4);

  const batchStatusList = workOrders
    .filter((w) => w.batchNumber || w.woNo)
    .slice(0, 5)
    .map((w) => ({
      batchNo: w.batchNumber || `BATCH-2026-${w.woNo?.split("-").pop() || "000"}`,
      productName: w.productName,
      status: w.status,
    }));



  const qcPendingOps = workOrders.filter((w) => w.status === "QC Pending").length;

  if (userRole === "QC_CHECKER" || userRole === "OPERATOR") {
    const greeting = new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 17 ? "Good Afternoon" : "Good Evening";

    // Operator-specific metrics
    const packingStarted = workOrders.filter((w) => w.status === "Packing Started").length;
    const materialIssued = workOrders.filter((w) => w.status === "Material Issued").length;

    return (
      <div className="pb-10 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Green Banner Header - VillagKart style */}
        <div className="bg-[#00891D] -mx-2 md:-mx-4 -mt-2 md:-mt-4 px-5 pt-5 pb-24 relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 text-sm">{greeting}, {user?.name?.split(" ")[0] || "User"} ðŸ‘‹</p>
              <h2 className="text-white text-xl font-bold mt-0.5">VillagKart Store</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
                <span className="text-green-100 text-xs font-medium">
                  Store Open - Avg Processing {Math.round(workOrders.reduce((s, w) => s + (w.packingTimeSeconds || 0), 0) / Math.max(completedWOs, 1) / 60)} min
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid - 2 rows of 5, overlapping banner */}
        <div className="px-3 md:px-4 -mt-16 relative z-10">
          {userRole === "QC_CHECKER" ? (
            <div className="space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-5 gap-2">
                <MetricCard title="Total QC" value={todaysQCs.length} icon={ClipboardList} colorClass="text-blue-600" bgColorClass="bg-blue-50" />
                <MetricCard title="Pending" value={pendingQCWOs.length} icon={Clock} colorClass="text-amber-600" bgColorClass="bg-amber-50" />
                <MetricCard title="Passed" value={qcPassed} icon={CheckCircle} colorClass="text-green-600" bgColorClass="bg-green-50" />
                <MetricCard title="Rejected" value={qcRejected} icon={XCircle} colorClass="text-rose-600" bgColorClass="bg-rose-50" />
                <MetricCard title="Rework" value={qcRework} icon={RefreshCw} colorClass="text-orange-600" bgColorClass="bg-orange-50" />
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-5 gap-2">
                <MetricCard title="Passed Units" value={passedUnitsToday} icon={CheckSquare} colorClass="text-indigo-600" bgColorClass="bg-indigo-50" />
                <MetricCard title="Pass Rate" value={todaysQCs.length > 0 ? Math.round((qcPassed / todaysQCs.length) * 100) + "%" : "0%"} icon={TrendingUp} colorClass="text-emerald-600" bgColorClass="bg-emerald-50" />
                <MetricCard title="Critical" value={qualityChecks.filter(q => q.severity === "Critical").length} icon={AlertOctagon} colorClass="text-red-600" bgColorClass="bg-red-50" />
                <MetricCard title="Batches" value={new Set(qualityChecks.map(q => q.batchNo)).size} icon={Package} colorClass="text-violet-600" bgColorClass="bg-violet-50" />
                <MetricCard title="Total" value={qualityChecks.length} icon={BarChart3} colorClass="text-slate-600" bgColorClass="bg-slate-50" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-5 gap-2">
                <MetricCard title="Total WOs" value={workOrders.length} icon={ClipboardList} colorClass="text-blue-600" bgColorClass="bg-blue-50" />
                <MetricCard title="New" value={workOrders.filter(w => w.status === "Approved" || w.status === "Material Issued").length} icon={Layers} colorClass="text-indigo-600" bgColorClass="bg-indigo-50" />
                <MetricCard title="Packing" value={packingStarted} icon={PlayCircle} colorClass="text-green-600" bgColorClass="bg-green-50" />
                <MetricCard title="Completed" value={completedWOs} icon={CheckCircle} colorClass="text-emerald-600" bgColorClass="bg-emerald-50" />
                <MetricCard title="QC Pending" value={qcPendingOps} icon={ShieldCheck} colorClass="text-amber-600" bgColorClass="bg-amber-50" />
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-5 gap-2">
                <MetricCard title="Output" value={todayOutput} icon={Package} colorClass="text-teal-600" bgColorClass="bg-teal-50" />
                <MetricCard title="Rejected" value={qcRejects} icon={XCircle} colorClass="text-rose-600" bgColorClass="bg-rose-50" />
                <MetricCard title="Alerts" value={workOrders.filter(w => w.priority === "Urgent" || w.priority === "High").length} icon={AlertOctagon} colorClass="text-red-600" bgColorClass="bg-red-50" />
                <MetricCard title="Repack" value={todayRepacking} icon={RefreshCw} colorClass="text-orange-600" bgColorClass="bg-orange-50" />
                <MetricCard title="Efficiency" value={completedWOs > 0 ? Math.round((completedWOs / Math.max(workOrders.length, 1)) * 100) + "%" : "0%"} icon={TrendingUp} colorClass="text-purple-600" bgColorClass="bg-purple-50" />
              </div>
            </div>
          )}
        </div>

        {/* Weekly Performance Section */}
        <div className="px-3 md:px-4 mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Weekly Performance</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">This Week - Mon-Sun</p>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
                {userRole === "QC_CHECKER" ? todaysQCs.length + " checks this week" : completedWOs + " orders this week"}
              </span>
            </div>
            {/* Simple bar chart visualization */}
            <div className="flex items-end gap-2 h-28 mt-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                const dayVal = i === new Date().getDay() - 1 
                  ? (userRole === "QC_CHECKER" ? todaysQCs.length : completedWOs)
                  : Math.floor(Math.random() * 3);
                const maxVal = Math.max(dayVal, 5);
                const height = Math.max((dayVal / maxVal) * 100, 8);
                const isToday = i === new Date().getDay() - 1;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{dayVal}</span>
                    <div
                      className={"w-full rounded-t-md transition-all " + (isToday ? "bg-[#00891D]" : "bg-gray-200 dark:bg-gray-700")}
                      style={{ height: height + "%" }}
                    ></div>
                    <span className={"text-[10px] font-medium " + (isToday ? "text-[#00891D] font-bold" : "text-gray-400")}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Items Section */}
        <div className="px-3 md:px-4 mt-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            {userRole === "QC_CHECKER" ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                    Quality Checks Required
                  </h3>
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                    {pendingQCWOs.length} pending
                  </span>
                </div>
                {pendingQCWOs.length === 0 ? (
                  <div className="text-center py-8">
                    <ShieldCheck size={32} className="mx-auto text-gray-200 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">No pending quality checks!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingQCWOs.map((wo) => (
                      <div
                        key={wo.id}
                        onClick={() => navigate("/quality-check")}
                        className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{wo.woNo}</p>
                          <p className="text-xs text-gray-500">{wo.productName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                            {wo.actualProduced} units
                          </span>
                          <ArrowRight size={16} className="text-green-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Active Packing Lines</h3>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Live Status</span>
                </div>
                {activeWOs.length === 0 ? (
                  <div className="text-center py-8">
                    <Package size={32} className="mx-auto text-gray-200 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">No active packing jobs.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeWOs.map((wo) => (
                      <div
                        key={wo.id}
                        onClick={() => navigate("/packing-execution")}
                        className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{wo.woNo}</p>
                          <p className="text-xs text-gray-500">{wo.productName}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{wo.status}</span>
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{wo.actualProduced || 0} / {wo.requiredQuantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW (Preserve Original Layout exactly as it was) ---
  return (
    <div className="space-y-6 text-left pb-10 relative z-10 px-2">
      {/* Page Title */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
          Packing & Repacking Dashboard
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Operations Command Center - Live monitoring of packing lines, batches,
          and efficiency
        </p>
      </div>

      {/* TOP SECTION: 13 KPI CARDS GRID */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Key Performance Indicators
        </h3>

        {/* Primary Row - 5 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. Today's Packing */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col items-center justify-center text-center relative min-h-[120px]">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <Package size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-500 block truncate w-full mt-2">
              Today's Packing
            </span>
            <h4 className="text-2xl font-bold text-slate-800 mt-1">
              {todayOutput || 0}{" "}
              <span className="text-xs font-medium text-slate-400">units</span>
            </h4>
          </div>

          {/* 2. Today's Repacking */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col items-center justify-center text-center relative min-h-[120px]">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
              <RefreshCw size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-500 block truncate w-full mt-2">
              Today's Repacking
            </span>
            <h4 className="text-2xl font-bold text-slate-800 mt-1">
              {todayRepacking || 0}{" "}
              <span className="text-xs font-medium text-slate-400">units</span>
            </h4>
          </div>

          {/* 3. Pending Work Orders */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col items-center justify-center text-center relative min-h-[120px]">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
              <Layers size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-500 block truncate w-full mt-2">
              Pending Work Orders
            </span>
            <h4 className="text-2xl font-bold text-slate-800 mt-1">
              {pendingWOs || 0}{" "}
              <span className="text-xs font-medium text-slate-400">orders</span>
            </h4>
          </div>

          {/* 4. Completed Work Orders */}
          {(userRole === "ADMIN" || userRole === "OPERATOR") && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col items-center justify-center text-center relative min-h-[120px]">
              <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-500 block truncate w-full mt-2">
                Completed Work Orders
              </span>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">
                {completedWOs || 0}{" "}
                <span className="text-xs font-medium text-slate-400">jobs</span>
              </h4>
            </div>
          )}

          {/* 5. Rejected QC */}
          {(userRole === "ADMIN" || userRole === "QC_CHECKER") && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col items-center justify-center text-center relative min-h-[120px]">
              <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                <ShieldCheck size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-500 block truncate w-full mt-2">
                Rejected QC
              </span>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">
                {qcRejects || 0}{" "}
                <span className="text-xs font-medium text-slate-400">
                  batches
                </span>
              </h4>
            </div>
          )}
        </div>

        {/* Secondary Row - 8 Columns */}
        {userRole === "ADMIN" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* 6. Packing Efficiency */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
              <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">
                Packing Efficiency
              </span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{packingEfficiency}%</h4>
            </div>


            {/* 8. Wastage % */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
              <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">
                Wastage %
              </span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{wastagePercent}%</h4>
            </div>

            {/* 9. Today's Finished Goods */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
              <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">
                Today's FG
              </span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">
                {todayOutput}{" "}
                <span className="text-[10px] text-slate-400 font-medium">
                  u
                </span>
              </h4>
            </div>

            {/* 10. Barcode Generated */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
              <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">
                Barcode Gen
              </span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">
                {barcodeGenCount}{" "}
                <span className="text-[10px] text-slate-400 font-medium">
                  tags
                </span>
              </h4>
            </div>


            {/* 12. Employee Productivity (NEW) */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
              <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">
                Emp Productivity
              </span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">
                {empProductivity}{" "}
                <span className="text-[10px] text-slate-400 font-medium">
                  u/hr
                </span>
              </h4>
            </div>

            {/* 13. Machine Utilization (NEW) */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
              <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">
                Machine Util
              </span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{machineUtil}%</h4>
            </div>
          </div>
        )}
      </div>

      {/* SECOND SECTION: QUICK SHORTCUTS & ACTIVE WORK ORDERS/LIVE QUEUE */}
      {(userRole === "ADMIN" ||
        userRole === "OPERATOR" ||
        userRole === "QC_CHECKER") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Manager Quick Shortcuts */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between lg:col-span-1">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Flame size={16} className="text-amber-500" />
                <span>Manager Quick Shortcuts</span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {userRole === "ADMIN" && (
                  <>
                    <NavLink
                      to="/work-orders"
                      className="p-3 border border-slate-100 rounded-xl hover:border-green-600 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <Layers className="text-green-600" size={20} />
                      <span className="text-xs font-semibold text-slate-700">
                        Create WO
                      </span>
                    </NavLink>

                    <NavLink
                      to="/material-issue"
                      className="p-3 border border-slate-100 rounded-xl hover:border-green-600 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <Package className="text-indigo-600" size={20} />
                      <span className="text-xs font-semibold text-slate-700">
                        Issue Material
                      </span>
                    </NavLink>
                  </>
                )}

                {userRole === "QC_CHECKER" && (
                  <NavLink
                    to="/quality-check"
                    className="p-3 border border-slate-100 rounded-xl hover:border-green-600 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="text-rose-500" size={20} />
                    <span className="text-xs font-semibold text-slate-700">
                      Quality Check
                    </span>
                  </NavLink>
                )}

                {userRole === "OPERATOR" && (
                  <>
                    <NavLink
                      to="/packing-execution"
                      className="p-3 border border-slate-100 rounded-xl hover:border-green-600 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <PlayCircle className="text-green-600" size={20} />
                      <span className="text-xs font-semibold text-slate-700">
                        Execution
                      </span>
                    </NavLink>
                    <NavLink
                      to="/repacking"
                      className="p-3 border border-slate-100 rounded-xl hover:border-green-600 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="text-slate-600" size={20} />
                      <span className="text-xs font-semibold text-slate-700">
                        Repack Order
                      </span>
                    </NavLink>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">
                CURRENT OPERATOR SHIFT
              </span>
              <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                Shift A (06:00 AM - 02:00 PM)
              </span>
            </div>
          </div>

          {/* Active Work Order & Live Packing Queue */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Clock size={16} className="text-indigo-650" />
                <span>Active Work Order & Live Packing Queue</span>
              </h3>
              {userRole === "ADMIN" && (
                <NavLink
                  to="/work-orders"
                  className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline"
                >
                  View Details
                </NavLink>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Table of active work orders (compact) */}
              <div className="xl:col-span-2 overflow-x-auto table-scrollbar">
                <table className="w-full text-left border-collapse min-w-[480px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                      <th className="p-2">WO No</th>
                      <th className="p-2">Product</th>
                      <th className="p-2 text-center">Req Qty</th>
                      <th className="p-2 text-center">Packed Qty</th>
                      <th className="p-2">Status</th>
                      <th className="p-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeWOs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-4 text-center text-slate-400 text-xs font-medium"
                        >
                          No active work orders.
                        </td>
                      </tr>
                    ) : (
                      activeWOs.map((wo) => (
                        <tr
                          key={wo.id}
                          className="hover:bg-slate-50/50 text-[11px]"
                        >
                          <td className="p-2 font-mono font-bold text-slate-800">
                            {wo.woNo}
                          </td>
                          <td
                            className="p-2 font-semibold text-slate-700 max-w-[120px] truncate"
                            title={wo.productName}
                          >
                            {wo.productName}
                          </td>
                          <td className="p-2 text-center font-bold text-slate-800">
                            {wo.requiredQuantity}
                          </td>
                          <td className="p-2 text-center font-bold text-slate-800">
                            {wo.actualProduced || 0}
                          </td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                wo.status === "Completed" ||
                                wo.status === "QC Printed"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : wo.status === "Cancelled"
                                    ? "bg-slate-50 text-slate-400 border-slate-200"
                                    : wo.status === "Draft"
                                      ? "bg-slate-50 text-slate-600 border-slate-200"
                                      : wo.status === "QC Passed"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : wo.status === "QC Pending"
                                          ? "bg-rose-50 text-rose-700 border-rose-200"
                                          : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {wo.status}
                            </span>
                          </td>
                          <td className="p-2 text-center font-bold">
                            {userRole === "ADMIN" &&
                              (wo.status === "Pending" ||
                                wo.status === "Approved") && (
                                <NavLink
                                  to="/material-issue"
                                  className="text-amber-600 hover:text-amber-700 hover:underline"
                                >
                                  Issue
                                </NavLink>
                              )}
                            {userRole === "OPERATOR" &&
                              (wo.status === "Material Issued" ||
                                wo.status === "Packing Started") && (
                                <NavLink
                                  to="/packing-execution"
                                  className="text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                  Pack
                                </NavLink>
                              )}
                            {userRole === "QC_CHECKER" &&
                              wo.status === "QC Pending" && (
                                <NavLink
                                  to="/quality-check"
                                  className="text-rose-600 hover:text-rose-700 hover:underline"
                                >
                                  Verify
                                </NavLink>
                              )}
                            {userRole === "ADMIN" &&
                              wo.status === "QC Passed" && (
                                <NavLink
                                  to="/finished-goods"
                                  className="text-green-600 hover:text-green-700 hover:underline"
                                >
                                  Post FG
                                </NavLink>
                              )}
                            {userRole === "ADMIN" && wo.status === "Draft" && (
                              <NavLink
                                to="/work-orders"
                                className="text-slate-600 hover:text-slate-800 hover:underline"
                              >
                                Edit
                              </NavLink>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Live Line Status */}
              <div className="xl:col-span-1 border-t xl:border-t-0 xl:border-l border-slate-150 pt-4 xl:pt-0 xl:pl-4 space-y-3.5">
                <h4 className="font-bold text-slate-700 text-xs">
                  Live Packing Queue (Lines)
                </h4>

                {activeLines.length === 0 ? (
                  <div className="text-slate-400 text-xs mt-4">
                    No active packing lines.
                  </div>
                ) : (
                  <div className="space-y-3 mt-4">
                    {activeLines.map((line, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-slate-800">{line.lineId}</span>
                          <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{line.progress}%</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mb-2 truncate">{line.productName}</div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full" style={{ width: `${line.progress}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THIRD TO LAST SECTIONS: VISIBLE TO ADMIN ONLY */}
      {userRole === "ADMIN" && (
        <div className="space-y-6">
          {/* THIRD SECTION: MATERIAL SHORTAGE ALERTS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <AlertTriangle size={16} className="text-rose-500" />
                <span>Material Shortage Alerts</span>
              </h3>
              <NavLink
                to="/reports?tab=consumption"
                className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline"
              >
                View Details
              </NavLink>
            </div>

            {materialShortages.length === 0 ? (
              <div className="text-slate-400 text-xs">
                No material shortages currently reported.
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                {materialShortages.map((ms, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-rose-50/50 border border-rose-100 rounded-lg">
                    <div>
                      <div className="font-bold text-xs text-rose-900">{ms.materialName}</div>
                      <div className="text-[10px] text-rose-600 font-medium">{ms.woId}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xs text-rose-700">{ms.issued} / {ms.required}</div>
                      <div className="text-[10px] text-rose-500">Issued / Req</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FOURTH SECTION: PACKING STATUS, DAILY PRODUCTION, CATEGORY WISE PACKING */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Packing Status */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>Packing Status</span>
                </h3>
                <NavLink
                  to="/reports?tab=packing"
                  className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline"
                >
                  View Details
                </NavLink>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">
                    Active Batches
                  </span>
                  <span className="font-bold text-slate-800">{activeBatchesCount} Batches</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">
                    Completed Today
                  </span>
                  <span className="font-bold text-green-600">{completedWOs} Jobs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">
                    Pending QC Release
                  </span>
                  <span className="font-bold text-orange-500">{qcPendingOps} Batches</span>
                </div>
                <div className="pt-1.5">
                  <div className="flex justify-between mb-1 text-[10px] font-bold text-slate-400">
                    <span>Shift Target Progress</span>
                    <span>{shiftTargetProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-green-600 h-full rounded-full"
                      style={{ width: `${shiftTargetProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Production */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <BarChart3 size={16} className="text-green-600" />
                  <span>Daily Production</span>
                </h3>
                <NavLink
                  to="/reports?tab=packing"
                  className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline"
                >
                  View Details
                </NavLink>
              </div>

              {dailyProductionArr.length === 0 ? (
                <div className="text-slate-400 text-xs mt-4">
                  No daily production data available yet.
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {dailyProductionArr.slice(0, 4).map((dp, idx) => {
                    const maxQty = Math.max(...dailyProductionArr.map(d => d.qty), 1);
                    const pct = Math.round((dp.qty / maxQty) * 100);
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700 truncate">{dp.name}</span>
                          <span className="font-bold text-green-700">{dp.qty} u</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category Wise Packing */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Layers size={16} className="text-green-600" />
                  <span>Category Wise Packing</span>
                </h3>
                <NavLink
                  to="/reports?tab=conversion"
                  className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline"
                >
                  View Details
                </NavLink>
              </div>

              {categoryWiseArr.length === 0 ? (
                <div className="text-slate-400 text-xs mt-4">
                  No category packing data available.
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {categoryWiseArr.slice(0, 4).map((cat, idx) => {
                    const total = Math.max(categoryWiseArr.reduce((s, c) => s + c.qty, 0), 1);
                    const pct = Math.round((cat.qty / total) * 100);
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-[10px]">
                          {pct}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="font-semibold text-slate-700 truncate">{cat.name}</span>
                            <span className="font-bold text-slate-800">{cat.qty}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* FIFTH SECTION: EMPLOYEE PERFORMANCE, RAW MATERIAL CONSUMPTION, REJECTED ITEMS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Employee Performance */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <UserCheck size={16} className="text-green-600" />
                  <span>Employee Performance</span>
                </h3>
                <NavLink
                  to="/reports?tab=employee"
                  className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline"
                >
                  View Details
                </NavLink>
              </div>

              {employeePerformanceArr.length === 0 ? (
                <div className="text-slate-400 text-xs mt-4">
                  No employee performance data available.
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {employeePerformanceArr.slice(0, 4).map((emp, idx) => {
                    const maxQty = Math.max(...employeePerformanceArr.map(e => e.qty), 1);
                    const pct = Math.round((emp.qty / maxQty) * 100);
                    return (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-slate-800">{emp.name}</span>
                          <span className="text-[10px] font-semibold text-green-700">{emp.qty} Units</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Raw Material Consumption */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Package size={16} className="text-green-600" />
                  <span>Raw Material Consumption</span>
                </h3>
                <NavLink
                  to="/reports?tab=consumption"
                  className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline"
                >
                  View Details
                </NavLink>
              </div>

              {rmConsumptionArr.length === 0 ? (
                <div className="text-slate-400 text-xs mt-4">
                  No material consumption data available.
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {rmConsumptionArr.map((rm, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                      <span className="text-xs font-semibold text-slate-700">{rm.name}</span>
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">{rm.qty}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rejected Items */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <AlertTriangle size={16} className="text-rose-500" />
                  <span>Rejected Items</span>
                </h3>
                <NavLink
                  to="/reports?tab=rejected"
                  className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline"
                >
                  View Details
                </NavLink>
              </div>

              {rejectedItemsList.length === 0 ? (
                <div className="text-slate-400 text-xs mt-4">
                  No rejected items recorded.
                </div>
              ) : (
                <div className="space-y-2 mt-4">
                  {rejectedItemsList.map((rej, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-rose-50 border border-rose-100 rounded-lg">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-rose-900 truncate">{rej.batchNo}</div>
                        <div className="text-[10px] text-rose-600 truncate">{rej.product}</div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-rose-500 px-2 py-1 rounded">
                        {rej.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* LAST SECTION: BATCH STATUS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Clock size={16} className="text-green-600" />
                <span>Batch Status</span>
              </h3>
              <NavLink
                to="/reports?tab=traceability"
                className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline"
              >
                View Details
              </NavLink>
            </div>

            {batchStatusList.length === 0 ? (
              <div className="text-slate-400 text-xs">No active batches.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-2 font-semibold">Batch No</th>
                      <th className="pb-2 font-semibold">Product</th>
                      <th className="pb-2 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {batchStatusList.map((batch, idx) => (
                      <tr key={idx}>
                        <td className="py-2 text-xs font-bold text-slate-800">{batch.batchNo}</td>
                        <td className="py-2 text-[10px] text-slate-500 truncate max-w-[120px]" title={batch.productName}>{batch.productName}</td>
                        <td className="py-2 text-right">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            batch.status === 'Completed' || batch.status === 'QC Printed' ? 'bg-green-100 text-green-700' :
                            batch.status === 'QC Pending' || batch.status === 'Packing Started' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {batch.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
