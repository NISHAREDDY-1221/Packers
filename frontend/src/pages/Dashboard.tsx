import React from 'react';
import { useApp } from '../context/AppContext';
import { NavLink } from 'react-router-dom';
import {
  BarChart3, AlertTriangle,
  Layers, Package, ShieldCheck, Flame, Clock,
  TrendingUp, RefreshCw, CheckCircle,
  UserCheck, QrCode, Cpu, DollarSign, Activity
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { qualityChecks, finishedGoods, repackings } = useApp();
  const [apiWorkOrders, setApiWorkOrders] = React.useState<any[]>([]);

  React.useEffect(() => {
    import('../api/workOrderService').then(({ workOrderService }) => {
      workOrderService.getWorkOrders({ limit: 500 }).then(res => setApiWorkOrders(res.data || [])).catch(console.error);
    });
  }, []);

  const workOrders = apiWorkOrders;

  // DERIVE PACKING & REPACKING ERP DATA FROM GLOBAL STATE
  const pendingWOs = workOrders.filter(w => ['PENDING', 'APPROVED', 'MATERIAL_ISSUED', 'PACKING_STARTED', 'PACKING_IN_PROGRESS', 'LABEL_APPLICATION_ASSIGNED', 'LABEL_APPLICATION_IN_PROGRESS', 'LABELS_APPLIED', 'QC_PENDING'].includes(w.status)).length;
  const completedWOs = workOrders.filter(w => w.status === 'COMPLETED' || w.status === 'QC_PASSED').length;
  const qcRejects = qualityChecks.filter(q => ['REJECT', 'REWORK', 'DISCARD', 'FAIL', 'Reject', 'Rework'].includes(q.result)).length + workOrders.filter(w => (w.actualRejected || 0) > 0).length;

  // Calculate yield & repacking
  const totalProducedWO = workOrders.reduce((sum, item) => sum + (item.actualProduced || 0), 0);
  const totalFGPosted = finishedGoods.reduce((sum, item) => sum + (item.postedQty || 0), 0);
  const todayOutput = Math.max(totalProducedWO, totalFGPosted);
  const todayRepacking = repackings.reduce((sum, item) => sum + (item.recoverableQuantity || item.recoverableQty || 0), 0);

  // Efficiency & Wastage
  const totalReq = workOrders.reduce((sum, item) => sum + (item.requiredQty || item.requiredQuantity || 0), 0);
  const totalProd = workOrders.reduce((sum, item) => sum + (item.actualProduced || 0), 0);
  const totalRej = workOrders.reduce((sum, item) => sum + (item.actualRejected || 0), 0);

  const packingEfficiency = totalReq > 0 ? Math.min(100, Math.round((totalProd / totalReq) * 100)) : (workOrders.length > 0 ? 85 : 0);
  const wastagePct = (totalProd + totalRej) > 0 ? ((totalRej / (totalProd + totalRej)) * 100).toFixed(1) : '0.0';
  const packingCost = todayOutput > 0 ? '₹2.45' : '₹0.00';
  const barcodeGenCount = workOrders.reduce((sum, item) => sum + (item.labelsPrinted || item.labelsApplied || (item.batchNumber ? (item.actualProduced || item.requiredQty || 0) : 0)), 0);
  const nearExpiryCount = workOrders.filter(w => w.expectedDate && new Date(w.expectedDate).getTime() - Date.now() < 30 * 86400000).length;
  const empProductivity = completedWOs > 0 ? Math.round(todayOutput / (completedWOs * 1.5 || 1)) : (todayOutput > 0 ? Math.round(todayOutput / 4) : 0);
  const activeLinesCount = workOrders.filter(w => ['PACKING_STARTED', 'PACKING_IN_PROGRESS', 'LABEL_APPLICATION_IN_PROGRESS'].includes(w.status)).length;
  const machineUtil = Math.min(100, Math.round((activeLinesCount / Math.max(1, workOrders.length)) * 100)) || (pendingWOs > 0 ? 65 : 0);

  // Active work orders (excluding cancelled for the compact queue widget, but keeping COMPLETED so user can see status update)
  const activeWOs = workOrders.filter(w => w.status !== 'CANCELLED').slice(0, 5);

  // Group by category for category-wise packing
  const categoriesMap: Record<string, number> = {};
  workOrders.forEach(w => {
    const cat = w.product?.category?.name || w.category || 'General';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + (w.actualProduced || w.requiredQty || 0);
  });
  const categoriesList = Object.entries(categoriesMap);

  // Group by operator / supervisor for employee performance
  const empMap: Record<string, { produced: number; count: number }> = {};
  workOrders.forEach(w => {
    const emp = w.operator?.name || w.supervisor?.name || w.supervisor || 'Operator Team';
    if (!empMap[emp]) empMap[emp] = { produced: 0, count: 0 };
    empMap[emp].produced += (w.actualProduced || 0);
    empMap[emp].count += 1;
  });
  const empList = Object.entries(empMap);

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
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-500">Today's Packing</span>
                <h4 className="text-xl font-bold text-slate-800 mt-1">{todayOutput || 0} <span className="text-xs font-medium text-slate-400">units</span></h4>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                <Package size={20} />
              </div>
            </div>
          </div>

          {/* 2. Today's Repacking */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-500">Today's Repacking</span>
                <h4 className="text-xl font-bold text-slate-800 mt-1">{todayRepacking || 0} <span className="text-xs font-medium text-slate-400">units</span></h4>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                <RefreshCw size={20} />
              </div>
            </div>
          </div>

          {/* 3. Pending Work Orders */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-500">Pending Work Orders</span>
                <h4 className="text-xl font-bold text-slate-800 mt-1">{pendingWOs || 0} <span className="text-xs font-medium text-slate-400">jobs</span></h4>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                <Layers size={20} />
              </div>
            </div>
          </div>

          {/* 4. Completed Work Orders */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-500">Completed Work Orders</span>
                <h4 className="text-xl font-bold text-slate-800 mt-1">{completedWOs || 0} <span className="text-xs font-medium text-slate-400">jobs</span></h4>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                <CheckCircle size={20} />
              </div>
            </div>
          </div>

          {/* 5. Rejected QC */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-slate-500">Rejected QC</span>
                <h4 className="text-xl font-bold text-slate-800 mt-1">{qcRejects || 0} <span className="text-xs font-medium text-slate-400">batches</span></h4>
              </div>
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <ShieldCheck size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Row - 8 Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {/* 6. Packing Efficiency */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block truncate">Packing Efficiency</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{packingEfficiency}%</h4>
            </div>
          </div>

          {/* 7. Packing Cost */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block truncate">Packing Cost</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{packingCost} <span className="text-[10px] text-slate-400 font-medium">/u</span></h4>
            </div>
          </div>

          {/* 8. Wastage % */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block truncate">Wastage %</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{wastagePct}%</h4>
            </div>
          </div>

          {/* 9. Today's Finished Goods */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block truncate">Today's FG</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{totalFGPosted || todayOutput} <span className="text-[10px] text-slate-400 font-medium">u</span></h4>
            </div>
          </div>

          {/* 10. Barcode Generated */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block truncate">Barcode Gen</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{barcodeGenCount} <span className="text-[10px] text-slate-400 font-medium">tags</span></h4>
            </div>
          </div>

          {/* 11. Near Expiry */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block truncate">Near Expiry</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{nearExpiryCount} <span className="text-[10px] text-slate-400 font-medium">batches</span></h4>
            </div>
          </div>

          {/* 12. Employee Productivity */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block truncate">Emp Productivity</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{empProductivity} <span className="text-[10px] text-slate-400 font-medium">u/hr</span></h4>
            </div>
          </div>

          {/* 13. Machine Utilization */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block truncate">Machine Util</span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{machineUtil}%</h4>
            </div>
          </div>
        </div>
      </div>

      {/* SECOND SECTION: QUICK SHORTCUTS & ACTIVE WORK ORDERS/LIVE QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Manager Quick Shortcuts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between lg:col-span-1">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Flame size={16} className="text-amber-500" />
              <span>Manager Quick Shortcuts</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
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

              <NavLink
                to="/quality-check"
                className="p-3 border border-slate-100 rounded-xl hover:border-green-600 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="text-rose-500" size={20} />
                <span className="text-xs font-semibold text-slate-700">Quality Check</span>
              </NavLink>

              <NavLink
                to="/repacking"
                className="p-3 border border-slate-100 rounded-xl hover:border-green-600 hover:bg-slate-50 transition-all text-center flex flex-col items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="text-slate-600" size={20} />
                <span className="text-xs font-semibold text-slate-700">Repack Order</span>
              </NavLink>
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
            <NavLink to="/work-orders" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
              View Details
            </NavLink>
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
                    activeWOs.slice(0, 5).map((wo) => (
                      <tr key={wo.id} className="hover:bg-slate-50/50 text-[11px]">
                        <td className="p-2 font-mono font-bold text-slate-800">{wo.woNumber || wo.woNo}</td>
                        <td className="p-2 font-semibold text-slate-700 max-w-[120px] truncate" title={wo.product?.name || wo.productName}>{wo.product?.name || wo.productName}</td>
                        <td className="p-2 text-center font-bold text-slate-800">{wo.requiredQty || wo.requiredQuantity}</td>
                        <td className="p-2 text-center font-bold text-slate-800">{wo.actualProduced || 0}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${wo.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                              wo.status === 'CANCELLED' ? 'bg-slate-50 text-slate-400 border-slate-200' :
                                wo.status === 'DRAFT' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                                  wo.status === 'QC_PASSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    wo.status === 'QC_PENDING' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                            {wo.status}
                          </span>
                        </td>
                        <td className="p-2 text-center font-bold">
                          {(wo.status === 'PENDING' || wo.status === 'APPROVED') && (
                            <NavLink to="/material-issue" className="text-amber-600 hover:text-amber-700 hover:underline">Issue</NavLink>
                          )}
                          {(wo.status === 'MATERIAL_ISSUED' || wo.status === 'PACKING_STARTED' || wo.status === 'PACKING_IN_PROGRESS') && (
                            <NavLink to="/packing-execution" className="text-blue-600 hover:text-blue-700 hover:underline">Pack</NavLink>
                          )}
                          {wo.status === 'QC_PENDING' && (
                            <NavLink to="/quality-check" className="text-rose-600 hover:text-rose-700 hover:underline">Verify</NavLink>
                          )}
                          {wo.status === 'QC_PASSED' && (
                            <NavLink to="/finished-goods" className="text-green-600 hover:text-green-700 hover:underline">Post FG</NavLink>
                          )}
                          {wo.status === 'DRAFT' && (
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
              {activeWOs.filter(w => ['PACKING_STARTED', 'PACKING_IN_PROGRESS', 'LABEL_APPLICATION_IN_PROGRESS'].includes(w.status)).length === 0 ? (
                <div className="text-slate-400 text-xs mt-4">
                  No active packing lines running.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeWOs.filter(w => ['PACKING_STARTED', 'PACKING_IN_PROGRESS', 'LABEL_APPLICATION_IN_PROGRESS'].includes(w.status)).slice(0, 3).map(lineWO => (
                    <div key={lineWO.id} className="p-2.5 bg-green-50/60 border border-green-200 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between items-center font-bold text-slate-800">
                        <span>{lineWO.woNumber || lineWO.woNo}</span>
                        <span className="text-[10px] text-green-700 font-bold bg-green-100 px-1.5 py-0.5 rounded">Active</span>
                      </div>
                      <p className="text-slate-600 text-[11px] font-medium truncate">{lineWO.product?.name || lineWO.productName}</p>
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold pt-1">
                        <span>Produced: {lineWO.actualProduced || 0} / {lineWO.requiredQty || lineWO.requiredQuantity}</span>
                        <span>{lineWO.progress ? Math.round(lineWO.progress) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* THIRD SECTION: MATERIAL SHORTAGE ALERTS */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-150 pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <AlertTriangle size={16} className="text-rose-500" />
            <span>Material Shortage Alerts</span>
          </h3>
          <NavLink to="/material-issue" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
            View Details
          </NavLink>
        </div>

        {workOrders.filter(w => w.status === 'APPROVED' || w.status === 'PENDING').length === 0 ? (
          <div className="text-slate-400 text-xs">
            No material shortages currently reported.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {workOrders.filter(w => w.status === 'APPROVED' || w.status === 'PENDING').slice(0, 3).map(mWO => (
              <div key={mWO.id} className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-800">{mWO.woNumber || mWO.woNo}</span>
                  <p className="text-slate-600 font-medium text-[11px] truncate">{mWO.product?.name || mWO.productName}</p>
                </div>
                <NavLink to="/material-issue" className="px-2.5 py-1 bg-amber-600 text-white rounded text-[10px] font-bold hover:bg-amber-700">
                  Issue BOM
                </NavLink>
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
            <NavLink to="/reports?tab=packing" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
              View Details
            </NavLink>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Active Batches</span>
              <span className="font-bold text-slate-800">{workOrders.filter(w => w.batchNumber).length || workOrders.length} Batches</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Completed Today</span>
              <span className="font-bold text-green-600">{completedWOs} Jobs</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Pending QC Release</span>
              <span className="font-bold text-orange-500">{workOrders.filter(w => ['QC_PENDING', 'LABELS_APPLIED', 'PACKING_COMPLETED'].includes(w.status)).length} Batches</span>
            </div>
            <div className="pt-1.5">
              <div className="flex justify-between mb-1 text-[10px] font-bold text-slate-400">
                <span>Shift Target Progress</span>
                <span>{packingEfficiency}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-green-600 h-full rounded-full transition-all" style={{ width: `${packingEfficiency}%` }}></div>
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

          {workOrders.length === 0 ? (
            <div className="text-slate-400 text-xs mt-4">
              No daily production data available yet.
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {workOrders.slice(0, 4).map((wo) => (
                <div key={wo.id} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                    <span className="truncate max-w-[140px]">{wo.product?.name || wo.productName}</span>
                    <span>{wo.actualProduced || 0} / {wo.requiredQty || wo.requiredQuantity}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full" 
                      style={{ width: `${Math.min(100, Math.round(((wo.actualProduced || 0) / (wo.requiredQty || wo.requiredQuantity || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
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
            <NavLink to="/reports?tab=conversion" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
              View Details
            </NavLink>
          </div>

          {categoriesList.length === 0 ? (
            <div className="text-slate-400 text-xs mt-4">
              No category packing data available.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {categoriesList.slice(0, 4).map(([cat, qty]) => (
                <div key={cat} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="font-semibold text-slate-700">{cat}</span>
                  <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded text-[11px]">{qty} units</span>
                </div>
              ))}
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
            <NavLink to="/reports?tab=employee" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
              View Details
            </NavLink>
          </div>

          {empList.length === 0 ? (
            <div className="text-slate-400 text-xs mt-4">
              No employee performance data available.
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              {empList.slice(0, 4).map(([name, data]) => (
                <div key={name} className="flex justify-between items-center p-2 border border-slate-100 rounded-lg">
                  <div>
                    <span className="font-bold text-slate-800 block">{name}</span>
                    <span className="text-[10px] text-slate-400">{data.count} Assigned Jobs</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-600 text-xs">{data.produced} units</span>
                </div>
              ))}
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
            <NavLink to="/reports?tab=consumption" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
              View Details
            </NavLink>
          </div>

          {workOrders.length === 0 ? (
            <div className="text-slate-400 text-xs mt-4">
              No material consumption data available.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {workOrders.slice(0, 4).map((wo) => (
                <div key={wo.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-[11px]">
                  <span className="font-medium text-slate-700 truncate max-w-[130px]">{wo.product?.name || wo.productName} Materials</span>
                  <span className="font-bold text-slate-800">{Math.round((wo.requiredQty || wo.requiredQuantity || 100) * 1.05)} kg/units</span>
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
            <NavLink to="/reports?tab=rejected" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
              View Details
            </NavLink>
          </div>

          {qcRejects === 0 && qualityChecks.filter(q => q.result === 'Reject' || q.result === 'Rework').length === 0 ? (
            <div className="text-slate-400 text-xs mt-4">
              No rejected items recorded.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {qualityChecks.filter(q => q.result === 'Reject' || q.result === 'Rework').slice(0, 4).map((qc) => (
                <div key={qc.id} className="flex justify-between items-center p-2 bg-rose-50/60 border border-rose-200 rounded-lg text-[11px]">
                  <div>
                    <span className="font-bold text-rose-800">{qc.woNo || qc.batchNo}</span>
                    <p className="text-rose-600 text-[10px] truncate">{qc.failureReason || 'Failed Checkpoint'}</p>
                  </div>
                  <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[10px]">{qc.result}</span>
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
          <NavLink to="/reports?tab=traceability" className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline">
            View Details
          </NavLink>
        </div>

        {workOrders.length === 0 ? (
          <div className="text-slate-400 text-xs">
            No active batches.
          </div>
        ) : (
          <div className="overflow-x-auto table-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                  <th className="p-2.5">Batch Number</th>
                  <th className="p-2.5">WO Number</th>
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5 text-center">Qty Produced</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workOrders.slice(0, 6).map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-mono font-bold text-slate-800">{wo.batchNumber || `BATCH-${wo.woNumber || wo.woNo}`}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-600">{wo.woNumber || wo.woNo}</td>
                    <td className="p-2.5 font-semibold text-slate-700">{wo.product?.name || wo.productName}</td>
                    <td className="p-2.5 text-center font-bold text-slate-800">{wo.actualProduced || 0} / {wo.requiredQty || wo.requiredQuantity}</td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                        {wo.status}
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
  );
};
