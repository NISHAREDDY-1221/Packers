import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { NavLink } from 'react-router-dom';
import {
  BarChart3, AlertTriangle,
  Layers, Package, ShieldCheck, Flame, Clock,
  TrendingUp, RefreshCw, CheckCircle,
  UserCheck, PlayCircle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { qualityChecks, finishedGoods, repackings, workOrders } = useApp();
  const { user } = useAuth();
  const userRole = typeof user?.role === 'string' ? user.role : (user?.role as any)?.name || 'OPERATOR';

  // workOrders now comes directly from context; no local API fetch needed

  // DERIVE PACKING & REPACKING ERP DATA FROM GLOBAL STATE
  const pendingWOs = workOrders.filter(w => w.status === 'Pending' || w.status === 'Approved' || w.status === 'Material Issued' || w.status === 'Packing Started' || w.status === 'QC Pending').length;
  const completedWOs = workOrders.filter(w => w.status === 'Completed').length;
  const qcRejects = qualityChecks.filter(q => q.result === 'Reject' || q.result === 'Rework').length;

  // Calculate today's yield
  const todayOutput = finishedGoods.reduce((sum, item) => sum + item.postedQty, 0);
  const todayRepacking = repackings.reduce((sum, item) => sum + item.recoverableQuantity, 0);

  // Active work orders (excluding completed and cancelled for the compact queue widget)
  const activeWOs = workOrders.filter(w => w.status !== 'Completed' && w.status !== 'Cancelled').slice(0, 4);

  return (
    <div className="space-y-6 text-left pb-10">

      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Packing & Repacking Dashboard</h2>
        <p className="text-xs text-slate-500 mt-1">Operations Command Center — Live monitoring of packing lines, batches, and efficiency</p>
      </div>

      {/* TOP SECTION: 13 KPI CARDS GRID */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Performance Indicators</h3>

        {/* Primary Row - 5 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. Today's Packing */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col items-center justify-center text-center relative min-h-[120px]">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <Package size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-500 block truncate w-full mt-2">Today's Packing</span>
            <h4 className="text-2xl font-bold text-slate-800 mt-1">{todayOutput || 0} <span className="text-xs font-medium text-slate-400">units</span></h4>
            <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold mt-1">
              <TrendingUp size={10} />
              <span>-</span>
            </div>
          </div>

          {/* 2. Today's Repacking */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col items-center justify-center text-center relative min-h-[120px]">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
              <RefreshCw size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-500 block truncate w-full mt-2">Today's Repacking</span>
            <h4 className="text-2xl font-bold text-slate-800 mt-1">{todayRepacking || 0} <span className="text-xs font-medium text-slate-400">units</span></h4>
            <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold mt-1">
              <TrendingUp size={10} />
              <span>-</span>
            </div>
          </div>

          {/* 3. Pending Work Orders */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col items-center justify-center text-center relative min-h-[120px]">
            <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
              <Layers size={16} />
            </div>
            <span className="text-xs font-semibold text-slate-500 block truncate w-full mt-2">Pending Work Orders</span>
            <h4 className="text-2xl font-bold text-slate-800 mt-1">{pendingWOs || 0} <span className="text-xs font-medium text-slate-400">orders</span></h4>
            <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold mt-1">
              <TrendingUp size={10} />
              <span>-</span>
            </div>
          </div>

          {/* 4. Completed Work Orders */}
          {(userRole === 'ADMIN' || userRole === 'OPERATOR') && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col items-center justify-center text-center relative min-h-[120px]">
              <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                <CheckCircle size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-500 block truncate w-full mt-2">Completed Work Orders</span>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{completedWOs || 0} <span className="text-xs font-medium text-slate-400">jobs</span></h4>
              <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold mt-1">
                <TrendingUp size={10} />
                <span>-</span>
              </div>
            </div>
          )}

          {/* 5. Rejected QC */}
          {(userRole === 'ADMIN' || userRole === 'QC_CHECKER') && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col items-center justify-center text-center relative min-h-[120px]">
              <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                <ShieldCheck size={16} />
              </div>
              <span className="text-xs font-semibold text-slate-500 block truncate w-full mt-2">Rejected QC</span>
              <h4 className="text-2xl font-bold text-slate-800 mt-1">{qcRejects || 0} <span className="text-xs font-medium text-slate-400">batches</span></h4>
              <div className="flex items-center gap-1 text-[10px] text-green-600 font-semibold mt-1">
                <span>-</span>
              </div>
            </div>
          )}
        </div>

        {/* Secondary Row - 8 Columns */}
        {userRole === 'ADMIN' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {/* 6. Packing Efficiency */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
            <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">Packing Efficiency</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">0%</h4>
            <div className="flex items-center gap-0.5 text-[9px] text-slate-400 font-semibold mt-2">
              <span>-</span>
            </div>
          </div>

          {/* 7. Packing Cost */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
            <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">Packing Cost</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">₹0.00 <span className="text-[10px] text-slate-400 font-medium">/u</span></h4>
            <div className="flex items-center gap-0.5 text-[9px] text-slate-400 font-semibold mt-2">
              <span>-</span>
            </div>
          </div>

          {/* 8. Wastage % */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
            <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">Wastage %</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">0%</h4>
            <div className="text-[9px] text-slate-400 font-semibold mt-2 truncate">
              <span>-</span>
            </div>
          </div>

          {/* 9. Today's Finished Goods */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
            <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">Today's FG</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">0 <span className="text-[10px] text-slate-400 font-medium">u</span></h4>
            <div className="text-[9px] text-slate-400 font-semibold mt-2 truncate">
              <span>-</span>
            </div>
          </div>

          {/* 10. Barcode Generated */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
            <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">Barcode Gen</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">0 <span className="text-[10px] text-slate-400 font-medium">tags</span></h4>
            <div className="flex items-center justify-center gap-0.5 text-[9px] text-slate-400 font-semibold mt-2 truncate w-full">
              <span>-</span>
            </div>
          </div>

          {/* 11. Near Expiry (NEW) */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
            <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">Near Expiry</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">0 <span className="text-[10px] text-slate-400 font-medium">batches</span></h4>
            <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 font-semibold mt-2 truncate w-full">
              <span>-</span>
            </div>
          </div>

          {/* 12. Employee Productivity (NEW) */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
            <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">Emp Productivity</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">0 <span className="text-[10px] text-slate-400 font-medium">u/hr</span></h4>
            <div className="flex items-center gap-0.5 text-[9px] text-slate-400 font-semibold mt-2 truncate">
              <span>-</span>
            </div>
          </div>

          {/* 13. Machine Utilization (NEW) */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col items-center justify-center text-center min-h-[100px]">
            <span className="text-[10px] font-semibold text-slate-500 block truncate w-full">Machine Util</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">0%</h4>
            <div className="flex items-center gap-0.5 text-[9px] text-slate-400 font-semibold mt-2 truncate">
              <span>-</span>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* SECOND SECTION: QUICK SHORTCUTS & ACTIVE WORK ORDERS/LIVE QUEUE */}
      {(userRole === 'ADMIN' || userRole === 'OPERATOR' || userRole === 'QC_CHECKER') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Manager Quick Shortcuts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between lg:col-span-1">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Flame size={16} className="text-amber-500" />
              <span>Manager Quick Shortcuts</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {userRole === 'ADMIN' && (
                <>
                  <NavLink
                    to="/work-orders"
                    className="p-3 border border-slate-100 rounded-xl hover:border-green-600 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <Layers className="text-green-600" size={20} />
                    <span className="text-xs font-semibold text-slate-700">Create WO</span>
                  </NavLink>

                  <NavLink
                    to="/material-issue"
                    className="p-3 border border-slate-100 rounded-xl hover:border-green-600 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <Package className="text-indigo-600" size={20} />
                    <span className="text-xs font-semibold text-slate-700">Issue Material</span>
                  </NavLink>
                </>
              )}

              {userRole === 'QC_CHECKER' && (
                <NavLink
                  to="/quality-check"
                  className="p-3 border border-slate-100 rounded-xl hover:border-green-600 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="text-rose-500" size={20} />
                  <span className="text-xs font-semibold text-slate-700">Quality Check</span>
                </NavLink>
              )}

              {userRole === 'OPERATOR' && (
                <>
                  <NavLink
                    to="/packing-execution"
                    className="p-3 border border-slate-100 rounded-xl hover:border-green-600 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <PlayCircle className="text-green-600" size={20} />
                    <span className="text-xs font-semibold text-slate-700">Execution</span>
                  </NavLink>
                  <NavLink
                    to="/repacking"
                    className="p-3 border border-slate-100 rounded-xl hover:border-green-600 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="text-slate-600" size={20} />
                    <span className="text-xs font-semibold text-slate-700">Repack Order</span>
                  </NavLink>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold block">CURRENT OPERATOR SHIFT</span>
            <span className="text-xs font-semibold text-slate-700 block mt-0.5">Shift A (06:00 AM - 02:00 PM)</span>
          </div>
        </div>

        {/* Active Work Order & Live Packing Queue */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-150 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Clock size={16} className="text-indigo-650" />
              <span>Active Work Order & Live Packing Queue</span>
            </h3>
            {userRole === 'ADMIN' && (
              <NavLink to="/work-orders" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
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
                      <td colSpan={6} className="p-4 text-center text-slate-400 text-xs font-medium">No active work orders.</td>
                    </tr>
                  ) : (
                    activeWOs.map((wo) => (
                      <tr key={wo.id} className="hover:bg-slate-50/50 text-[11px]">
                        <td className="p-2 font-mono font-bold text-slate-800">{wo.woNo}</td>
                        <td className="p-2 font-semibold text-slate-700 max-w-[120px] truncate" title={wo.productName}>{wo.productName}</td>
                        <td className="p-2 text-center font-bold text-slate-800">{wo.requiredQuantity}</td>
                        <td className="p-2 text-center font-bold text-slate-800">{wo.actualProduced || 0}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${wo.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                              wo.status === 'Cancelled' ? 'bg-slate-50 text-slate-400 border-slate-200' :
                                wo.status === 'Draft' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                                  wo.status === 'QC Passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    wo.status === 'QC Pending' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                            {wo.status}
                          </span>
                        </td>
                        <td className="p-2 text-center font-bold">
                          {userRole === 'ADMIN' && (wo.status === 'Pending' || wo.status === 'Approved') && (
                            <NavLink to="/material-issue" className="text-amber-600 hover:text-amber-700 hover:underline">Issue</NavLink>
                          )}
                          {userRole === 'OPERATOR' && (wo.status === 'Material Issued' || wo.status === 'Packing Started') && (
                            <NavLink to="/packing-execution" className="text-blue-600 hover:text-blue-700 hover:underline">Pack</NavLink>
                          )}
                          {userRole === 'QC_CHECKER' && wo.status === 'QC Pending' && (
                            <NavLink to="/quality-check" className="text-rose-600 hover:text-rose-700 hover:underline">Verify</NavLink>
                          )}
                          {userRole === 'ADMIN' && wo.status === 'QC Passed' && (
                            <NavLink to="/finished-goods" className="text-green-600 hover:text-green-700 hover:underline">Post FG</NavLink>
                          )}
                          {userRole === 'ADMIN' && wo.status === 'Draft' && (
                            <NavLink to="/work-orders" className="text-slate-600 hover:text-slate-800 hover:underline">Edit</NavLink>
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
              <h4 className="font-bold text-slate-700 text-xs">Live Packing Queue (Lines)</h4>

              <div className="text-slate-400 text-xs mt-4">
                No active packing lines.
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* THIRD TO LAST SECTIONS: VISIBLE TO ADMIN ONLY */}
      {userRole === 'ADMIN' && (
        <div className="space-y-6">
          {/* THIRD SECTION: MATERIAL SHORTAGE ALERTS */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-150 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <AlertTriangle size={16} className="text-rose-500" />
            <span>Material Shortage Alerts</span>
          </h3>
          <NavLink to="/reports?tab=consumption" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
            View Details
          </NavLink>
        </div>

        <div className="text-slate-400 text-xs">
          No material shortages currently reported.
        </div>
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
            <NavLink to="/reports?tab=packing" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
              View Details
            </NavLink>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Active Batches</span>
              <span className="font-bold text-slate-800">0 Batches</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Completed Today</span>
              <span className="font-bold text-green-600">0 Jobs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Pending QC Release</span>
              <span className="font-bold text-orange-500">0 Batches</span>
            </div>
            <div className="pt-1.5">
              <div className="flex justify-between mb-1 text-[10px] font-bold text-slate-400">
                <span>Shift Target Progress</span>
                <span>0%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-green-600 h-full rounded-full" style={{ width: '0%' }}></div>
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
            <NavLink to="/reports?tab=packing" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
              View Details
            </NavLink>
          </div>

          <div className="text-slate-400 text-xs mt-4">
            No daily production data available yet.
          </div>
        </div>

        {/* Category Wise Packing */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Layers size={16} className="text-green-600" />
              <span>Category Wise Packing</span>
            </h3>
            <NavLink to="/reports?tab=conversion" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
              View Details
            </NavLink>
          </div>

          <div className="text-slate-400 text-xs mt-4">
            No category packing data available.
          </div>
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
            <NavLink to="/reports?tab=employee" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
              View Details
            </NavLink>
          </div>

          <div className="text-slate-400 text-xs mt-4">
            No employee performance data available.
          </div>
        </div>

        {/* Raw Material Consumption */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Package size={16} className="text-green-600" />
              <span>Raw Material Consumption</span>
            </h3>
            <NavLink to="/reports?tab=consumption" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
              View Details
            </NavLink>
          </div>

          <div className="text-slate-400 text-xs mt-4">
            No material consumption data available.
          </div>
        </div>

        {/* Rejected Items */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <AlertTriangle size={16} className="text-rose-500" />
              <span>Rejected Items</span>
            </h3>
            <NavLink to="/reports?tab=rejected" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
              View Details
            </NavLink>
          </div>

          <div className="text-slate-400 text-xs mt-4">
            No rejected items recorded.
          </div>
        </div>

      </div>

      {/* LAST SECTION: BATCH STATUS */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-150 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Clock size={16} className="text-green-600" />
            <span>Batch Status</span>
          </h3>
          <NavLink to="/reports?tab=traceability" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
            View Details
          </NavLink>
        </div>

        <div className="text-slate-400 text-xs">
          No active batches.
        </div>
      </div>

      </div>
      )}
    </div>
  );
};
