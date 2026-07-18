import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { WorkOrder } from '../context/AppContext';
import {
  AlertCircle, CheckCircle, Timer, Layers, Clipboard,
  X, Eye, BarChart3, ArrowRight
} from 'lucide-react';

export const PackingExecution: React.FC = () => {
  const { workOrders, recipes } = useApp();
  const [activeWO, setActiveWO] = useState<WorkOrder | null>(null);

  // Read-only timer states for active job monitoring
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Secondary views drawer states
  const [selectedDrawerTab, setSelectedDrawerTab] = useState<'wo' | 'recipe' | 'material' | 'production' | null>(null);

  // Filter queue jobs: Approved, Material Issued, Packing Started, QC Pending
  const activeQueueWOs = useMemo(() => {
    return workOrders.filter(w =>
      w.status === 'Approved' ||
      w.status === 'Material Issued' ||
      w.status === 'Packing Started' ||
      w.status === 'QC Pending'
    );
  }, [workOrders]);

  // Keep state synced with context updates
  const selectedWO = useMemo(() => {
    if (!activeWO) return null;
    return workOrders.find(w => w.id === activeWO.id) || activeWO;
  }, [workOrders, activeWO]);

  // Helper: Calculate progress percentage
  const getWorkOrderProgress = (wo: WorkOrder) => {
    if (wo.status === 'Material Issued' || wo.status === 'Approved') return 0;
    if (wo.status === 'QC Pending' || wo.status === 'QC Passed' || wo.status === 'Completed') return 100;
    const req = wo.requiredQuantity;
    const packed = wo.actualProduced || Math.round(req * 0.45);
    return Math.min(100, Math.round((packed / req) * 100));
  };

  // Auto-running timer for visual representation of packing elapsed time
  useEffect(() => {
    let interval: any;
    if (selectedWO?.status === 'Packing Started' && getWorkOrderProgress(selectedWO) < 100) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedWO?.status, selectedWO]);

  // Reset or set initial timer when job selection changes
  useEffect(() => {
    if (selectedWO) {
      setTimerSeconds(selectedWO.packingTimeSeconds || 1240); // default mock starting seconds
    } else {
      setTimerSeconds(0);
    }
  }, [selectedWO?.id]);

  const handleSelectWO = (wo: WorkOrder) => {
    setActiveWO(wo);
  };

  const formatTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${hrs}:${m}:${s}`;
  };

  const getPriorityStyle = (p: WorkOrder['priority']) => {
    switch (p) {
      case 'Urgent': return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'Low': return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400 dark:border-slate-700/50';
    }
  };

  const getStatusColor = (status: WorkOrder['status']) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'Pending': return 'bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30';
      case 'Approved': return 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30';
      case 'Material Issued': return 'bg-blue-50 text-blue-805 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'Packing Started': return 'bg-indigo-50 text-indigo-805 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
      case 'QC Pending': return 'bg-orange-50 text-orange-850 border border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30';
      case 'QC Passed': return 'bg-green-100 text-green-905 border border-green-300 dark:bg-green-900/20 dark:text-green-450 dark:border-green-800/30';
      case 'Completed': return 'bg-[#00891D] text-white border border-[#00891D]';
      case 'Cancelled': return 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30';
      case 'Labels Printed': return 'bg-green-600 text-white border border-green-700';
    }
  };

  // Progress metrics
  const mockProgressMetrics = useMemo(() => {
    if (!selectedWO) return null;
    const req = selectedWO.requiredQuantity;
    const completionPct = getWorkOrderProgress(selectedWO);
    const packed = selectedWO.actualProduced || 0;
    const rejected = selectedWO.actualRejected || 0;
    const remaining = Math.max(0, req - packed);
    const waste = 0;

    return { req, packed, remaining, rejected, waste, completionPct };
  }, [selectedWO]);

  // Materials Consumption List
  const mockMaterialsList = useMemo(() => {
    if (!selectedWO) return [];
    const recipe = recipes.find(r => r.id === selectedWO.recipeId);
    if (!recipe) return [];

    return [
      ...recipe.bomItems.map((item) => {
        return {
          material: item.inputItem,
          issued: 0,
          consumed: 0,
          remaining: 0,
          unit: 'kg',
          batch: ''
        };
      }),
      ...recipe.packagingMaterials.map((pkg) => {
        return {
          material: pkg.material,
          issued: 0,
          consumed: 0,
          remaining: 0,
          unit: 'units',
          batch: ''
        };
      })
    ];
  }, [selectedWO, recipes]);

  const activeRecipe = useMemo(() => {
    if (!selectedWO) return null;
    return recipes.find(r => r.id === selectedWO.recipeId);
  }, [selectedWO, recipes]);

  const getStageClass = (stage: string) => {
    if (!selectedWO) return '';
    const status = selectedWO.status;
    const stages = ['Material Issued', 'Packing Started', 'Packing In Progress', 'Packing Completed'];
    
    let currentIdx = 0;
    if (status === 'Approved' || status === 'Material Issued') {
      currentIdx = 0;
    } else if (status === 'Packing Started') {
      const progress = getWorkOrderProgress(selectedWO);
      currentIdx = progress === 100 ? 3 : 2;
    } else if (status === 'QC Pending' || status === 'QC Passed' || status === 'Completed') {
      currentIdx = 3;
    }

    const stageIdx = stages.indexOf(stage);

    if (stageIdx < currentIdx) {
      return 'bg-green-50 border-green-200 text-green-700 font-semibold dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30';
    } else if (stageIdx === currentIdx) {
      return 'bg-blue-50 border-blue-300 text-blue-700 font-bold dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
    } else {
      return 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/40 dark:text-slate-500 dark:border-slate-700/50';
    }
  };

  // Mock Active Alerts
  const activeAlerts = useMemo(() => {
    return [] as { type: 'danger' | 'warning' | 'info'; message: string }[];
  }, [selectedWO]);

  // Production Activity Log
  const activityLog = useMemo(() => {
    return [] as { title: string; time: string; desc: string }[];
  }, [selectedWO]);

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Left List of active jobs */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl p-4 shadow-xs">
            <h3 className="font-bold text-slate-800 dark:text-gray-100 text-sm mb-3">Active Packing Jobs</h3>

            <div className="space-y-3 max-h-[75vh] overflow-y-auto sidebar-scrollbar pr-1">
              {activeQueueWOs.map(wo => {
                const isSelected = selectedWO?.id === wo.id;
                const progress = getWorkOrderProgress(wo);
                return (
                  <div
                    key={wo.id}
                    onClick={() => handleSelectWO(wo)}
                    className={`p-3.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#00891D] bg-[#00891D]/5 dark:bg-[#00891D]/10 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold mb-1.5">
                      <span className="text-slate-400 dark:text-gray-500">{wo.woNo}</span>
                      <span className={`px-2 py-0.5 rounded-full ${getStatusColor(wo.status)}`}>
                        {progress === 100 ? 'Packing Completed' : wo.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 dark:text-gray-200 mb-2">{wo.productName}</div>
                    
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] text-slate-500 dark:text-gray-400 pt-2 border-t border-slate-100 dark:border-gray-750">
                      <div><span className="text-slate-400 dark:text-gray-500">Team:</span> <span className="font-medium text-slate-700 dark:text-gray-300">{wo.assignedTeam}</span></div>
                      <div><span className="text-slate-400 dark:text-gray-500">Operator:</span> <span className="font-medium text-slate-700 dark:text-gray-300">Ramesh P.</span></div>
                      <div><span className="text-slate-400 dark:text-gray-500">Supervisor:</span> <span className="font-medium text-slate-700 dark:text-gray-300">{wo.supervisor.split(' ').pop()}</span></div>
                      <div><span className="text-slate-400 dark:text-gray-500">Req Qty:</span> <span className="font-bold text-slate-750 dark:text-gray-300">{wo.requiredQuantity}</span></div>
                      <div><span className="text-slate-400 dark:text-gray-505">Progress:</span> <span className="font-bold text-[#00891D] dark:text-green-400">{progress}%</span></div>
                      <div>
                        <span className="text-slate-400 dark:text-gray-500">Priority:</span>{' '}
                        <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${getPriorityStyle(wo.priority)}`}>
                          {wo.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {activeQueueWOs.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-gray-700 rounded-lg">
                  No active packing jobs found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Dashboard Area */}
        <div className="xl:col-span-3 space-y-6">
          {selectedWO ? (
            <div className="space-y-6">

              {/* Status Success Banner */}
              {mockProgressMetrics && mockProgressMetrics.completionPct === 100 && (
                <div className="bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900/30 text-green-800 dark:text-green-400 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle className="text-green-600 dark:text-green-400 shrink-0" size={20} />
                  <div>
                    <span className="font-bold block text-sm">Packing completed successfully.</span>
                  </div>
                </div>
              )}

              {/* Workspace Context Header */}
              <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 p-5 rounded-xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-gray-750 pb-3">
                  <div>
                    <span className="text-xs font-mono text-[#00891D] font-bold uppercase">{selectedWO.woNo}</span>
                    <h3 className="font-bold text-lg text-slate-850 dark:text-gray-150">{selectedWO.productName}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-900 text-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border dark:border-gray-700">
                      <Timer className="text-green-500" size={16} />
                      <span className="font-mono text-sm font-bold tracking-widest">{formatTime(timerSeconds)}</span>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getStatusColor(selectedWO.status)}`}>
                      {mockProgressMetrics?.completionPct === 100 ? 'Packing Completed' : selectedWO.status}
                    </span>
                  </div>
                </div>

                {/* Header Grid Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 text-xs">
                  <div>
                    <span className="block font-semibold text-slate-400 dark:text-gray-500">Work Order Number</span>
                    <span className="font-bold text-slate-700 dark:text-gray-300 font-mono">{selectedWO.woNo}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-400 dark:text-gray-500">Product</span>
                    <span className="font-bold text-slate-700 dark:text-gray-300">{selectedWO.productName}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-400 dark:text-gray-500">Recipe/BOM</span>
                    <span className="font-bold text-slate-700 dark:text-gray-300">{selectedWO.recipeId}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-400 dark:text-gray-500">Assigned Team</span>
                    <span className="font-bold text-slate-700 dark:text-gray-300">{selectedWO.assignedTeam}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-400 dark:text-gray-500">Assigned Operator</span>
                    <span className="font-bold text-slate-700 dark:text-gray-300">Ramesh Patel (Op #3)</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-400 dark:text-gray-500">Supervisor</span>
                    <span className="font-bold text-slate-700 dark:text-gray-300">{selectedWO.supervisor}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-400 dark:text-gray-500">Machine</span>
                    <span className="font-bold text-slate-700 dark:text-gray-300">H-Speed Packer M4</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-400 dark:text-gray-500">Priority</span>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold border mt-0.5 ${getPriorityStyle(selectedWO.priority)}`}>
                      {selectedWO.priority}
                    </span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-400 dark:text-gray-500">Start Time</span>
                    <span className="font-bold text-slate-700 dark:text-gray-300">08:30 AM</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-400 dark:text-gray-500">Expected Completion</span>
                    <span className="font-bold text-slate-700 dark:text-gray-300">{selectedWO.expectedCompletion}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-400 dark:text-gray-500">Elapsed Time</span>
                    <span className="font-bold text-slate-700 dark:text-gray-300 font-mono">{formatTime(timerSeconds)}</span>
                  </div>
                  <div>
                    <span className="block font-semibold text-slate-400 dark:text-gray-500">Current Status</span>
                    <span className="font-bold text-slate-750 dark:text-gray-300">{mockProgressMetrics?.completionPct === 100 ? 'Packing Completed' : selectedWO.status}</span>
                  </div>
                </div>
              </div>

              {/* Progress Summary KPIs */}
              {mockProgressMetrics && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 p-4 rounded-xl shadow-xs text-center">
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider block font-semibold">Required Quantity</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-gray-100 block mt-1">{mockProgressMetrics.req}</span>
                  </div>
                  <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 p-4 rounded-xl shadow-xs text-center border-l-4 border-l-[#00891D]">
                    <span className="text-[10px] text-green-700 dark:text-green-400 font-bold uppercase tracking-wider block font-semibold">Packed Quantity</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-gray-100 block mt-1">{mockProgressMetrics.packed}</span>
                  </div>
                  <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 p-4 rounded-xl shadow-xs text-center">
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider block font-semibold">Remaining Quantity</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-gray-100 block mt-1">{mockProgressMetrics.remaining}</span>
                  </div>
                  <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 p-4 rounded-xl shadow-xs text-center border-l-4 border-l-rose-500">
                    <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block font-semibold">Rejected Quantity</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-gray-100 block mt-1">{mockProgressMetrics.rejected}</span>
                  </div>
                  <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 p-4 rounded-xl shadow-xs text-center">
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider block font-semibold">Completion %</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-gray-100 block mt-1">{mockProgressMetrics.completionPct}%</span>
                  </div>
                </div>
              )}

              {/* Progress Stage Tracker */}
              <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 p-5 rounded-xl shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Packing Stages Tracker</h4>
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs">
                  {['Material Issued', 'Packing Started', 'Packing In Progress', 'Packing Completed'].map((stage, idx, arr) => (
                    <React.Fragment key={stage}>
                      <div className={`flex-1 p-3 rounded-lg border text-center font-medium ${getStageClass(stage)}`}>
                        {stage === 'Material Issued' || stage === 'Packing Started' || (stage === 'Packing Completed' && getWorkOrderProgress(selectedWO) === 100) ? '✓ ' : ''}
                        {stage === 'Packing In Progress' && getWorkOrderProgress(selectedWO) > 0 && getWorkOrderProgress(selectedWO) < 100 ? '● ' : ''}
                        {stage}
                      </div>
                      {idx < arr.length - 1 && (
                        <ArrowRight className="text-slate-350 dark:text-gray-600 shrink-0 hidden sm:block" size={14} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Compact Quick Action Buttons Row */}
              <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 p-4 rounded-xl shadow-xs flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedDrawerTab('wo')}
                  className="flex-1 min-w-[140px] px-4 py-2.5 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-650 text-slate-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all border border-slate-200 dark:border-gray-600 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye size={14} />
                  <span>View Work Order</span>
                </button>
                <button
                  onClick={() => setSelectedDrawerTab('recipe')}
                  className="flex-1 min-w-[140px] px-4 py-2.5 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-650 text-slate-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all border border-slate-200 dark:border-gray-600 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Clipboard size={14} />
                  <span>View Recipe / BOM</span>
                </button>
                <button
                  onClick={() => setSelectedDrawerTab('material')}
                  className="flex-1 min-w-[140px] px-4 py-2.5 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-650 text-slate-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all border border-slate-200 dark:border-gray-600 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Layers size={14} />
                  <span>View Material Issue</span>
                </button>
                <button
                  onClick={() => setSelectedDrawerTab('production')}
                  className="flex-1 min-w-[140px] px-4 py-2.5 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-650 text-slate-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all border border-slate-200 dark:border-gray-600 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BarChart3 size={14} />
                  <span>View Production Details</span>
                </button>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Material Consumption (Takes 2 columns) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 p-5 rounded-xl shadow-xs space-y-4">
                  <h4 className="font-bold text-slate-805 dark:text-gray-200 text-sm flex items-center gap-2">
                    <Layers size={16} className="text-[#00891D]" />
                    <span>Material Consumption</span>
                  </h4>
                  <div className="overflow-x-auto table-scrollbar border border-slate-100 dark:border-gray-750 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-gray-750 border-b border-slate-100 dark:border-gray-700 font-bold text-slate-500 dark:text-gray-400">
                          <th className="p-3">Material</th>
                          <th className="p-3">Issued Qty</th>
                          <th className="p-3">Consumed Qty</th>
                          <th className="p-3">Remaining Qty</th>
                          <th className="p-3">Consumption %</th>
                          <th className="p-3">Unit</th>
                          <th className="p-3">Batch Number</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-gray-750">
                        {mockMaterialsList.map((item, idx) => {
                          const issued = item.issued;
                          const consumed = item.consumed;
                          const consPct = issued > 0 ? Math.round((consumed / issued) * 100) : 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/30 text-slate-700 dark:text-gray-300">
                              <td className="p-3 font-semibold text-slate-805 dark:text-gray-200">{item.material}</td>
                              <td className="p-3">{issued}</td>
                              <td className="p-3 font-bold">{consumed}</td>
                              <td className="p-3">{item.remaining}</td>
                              <td className="p-3 font-semibold text-[#00891D]">{consPct}%</td>
                              <td className="p-3">{item.unit}</td>
                              <td className="p-3 font-mono text-[10px] text-slate-400 dark:text-gray-500">{item.batch}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Stack: Alerts, Waste Summary & Activity Log */}
                <div className="lg:col-span-1 space-y-6">

                  {/* Production Alerts */}
                  {activeAlerts.length > 0 && (
                    <div className="bg-white border border-rose-105 dark:bg-gray-800 dark:border-rose-950 p-5 rounded-xl shadow-xs space-y-3">
                      <h4 className="font-bold text-slate-805 dark:text-gray-200 text-sm flex items-center gap-2 text-rose-650">
                        <AlertCircle size={16} />
                        <span>Production Alerts</span>
                      </h4>
                      <div className="space-y-2 text-xs">
                        {activeAlerts.map((alert, index) => (
                          <div
                            key={index}
                            className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                              alert.type === 'danger'
                                ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'
                                : alert.type === 'warning'
                                ? 'bg-amber-50 border-amber-100 text-amber-805 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400'
                                : 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400'
                            }`}
                          >
                            <span className="font-medium">{alert.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Waste Summary */}
                  {mockProgressMetrics && (
                    <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 p-5 rounded-xl shadow-xs space-y-4">
                      <h4 className="font-bold text-slate-850 dark:text-gray-200 text-sm flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-500" />
                        <span>Waste Summary</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 dark:bg-gray-750 border border-slate-100 dark:border-gray-700 rounded-lg">
                          <span className="text-slate-400 dark:text-gray-500 block text-[10px] font-semibold">Weight Loss</span>
                          <span className="font-bold text-slate-800 dark:text-gray-150 mt-1 block">0.45 kg</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-gray-750 border border-slate-100 dark:border-gray-700 rounded-lg">
                          <span className="text-slate-400 dark:text-gray-500 block text-[10px] font-semibold">Packaging Waste</span>
                          <span className="font-bold text-slate-800 dark:text-gray-150 mt-1 block">12 units</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-gray-750 border border-slate-100 dark:border-gray-700 rounded-lg">
                          <span className="text-slate-400 dark:text-gray-500 block text-[10px] font-semibold font-medium">Rejected Units</span>
                          <span className="font-bold text-rose-600 mt-1 block">{mockProgressMetrics.rejected} units</span>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-gray-750 border border-slate-100 dark:border-gray-700 rounded-lg">
                          <span className="text-slate-400 dark:text-gray-500 block text-[10px] font-semibold font-medium">Recoverable Quantity</span>
                          <span className="font-bold text-green-700 mt-1 block">2 units</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Production Activity Log */}
                  <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 p-5 rounded-xl shadow-xs space-y-4 flex flex-col">
                    <h4 className="font-bold text-slate-805 dark:text-gray-200 text-sm flex items-center gap-2">
                      <Clipboard size={16} className="text-[#00891D]" />
                      <span>Production Activity Log</span>
                    </h4>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] sidebar-scrollbar text-xs pr-1">
                      {activityLog.map((log, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-gray-750 rounded-lg border border-slate-100 dark:border-gray-700">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-slate-800 dark:text-gray-250">{log.title}</span>
                            <span className="font-bold text-slate-400 dark:text-gray-500 text-[9px] font-mono">{log.time}</span>
                          </div>
                          <p className="text-slate-500 dark:text-gray-400 text-[10px]">{log.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl p-12 shadow-xs text-center flex flex-col items-center justify-center min-h-[450px]">
              <div className="w-12 h-12 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-slate-400 dark:text-gray-500 mb-4">
                <AlertCircle size={24} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-gray-100 mb-1">No Active Packing Job Selected</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 max-w-sm">Select an active packing job from the list on the left to monitor production yield, consumption, alerts, and log events.</p>
            </div>
          )}
        </div>

      </div>

      {/* Right-Side Secondary Details Drawer */}
      {selectedWO && selectedDrawerTab && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full max-w-xl h-screen overflow-hidden flex flex-col shadow-2xl">

            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center bg-slate-900 text-white">
              <div>
                <span className="text-xs font-mono font-bold text-green-400 uppercase tracking-widest">{selectedWO.woNo}</span>
                <h3 className="text-lg font-bold">Operational Workspace</h3>
              </div>
              <button
                onClick={() => setSelectedDrawerTab(null)}
                className="p-1 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-gray-700 overflow-x-auto bg-slate-50 dark:bg-gray-750 tabs-scrollbar text-xs font-bold uppercase tracking-wider">
              {([
                { id: 'wo', label: 'Work Order' },
                { id: 'recipe', label: 'Recipe / BOM' },
                { id: 'material', label: 'Material Issue' },
                { id: 'production', label: 'Production Details' }
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedDrawerTab(tab.id)}
                  className={`px-4 py-3 border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                    selectedDrawerTab === tab.id
                      ? 'border-[#00891D] text-[#00891D] bg-white dark:bg-gray-800 font-bold'
                      : 'border-transparent text-slate-500 dark:text-gray-405 hover:text-slate-800 dark:hover:text-gray-250 hover:bg-slate-100/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700 dark:text-gray-300 text-left">

              {selectedDrawerTab === 'wo' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Work Order Details</h4>
                  <div className="border border-slate-200 dark:border-gray-700 rounded-xl divide-y divide-slate-100 dark:divide-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                    <div className="flex justify-between p-3.5">
                      <span className="text-slate-500 dark:text-gray-400">Assigned Team</span>
                      <span className="font-bold text-slate-800 dark:text-gray-200">{selectedWO.assignedTeam}</span>
                    </div>
                    <div className="flex justify-between p-3.5">
                      <span className="text-slate-500 dark:text-gray-400">Supervisor</span>
                      <span className="font-bold text-slate-800 dark:text-gray-200">{selectedWO.supervisor}</span>
                    </div>
                    <div className="flex justify-between p-3.5">
                      <span className="text-slate-500 dark:text-gray-400">Expected Completion</span>
                      <span className="font-bold text-slate-800 dark:text-gray-200">{selectedWO.expectedCompletion}</span>
                    </div>
                    <div className="flex justify-between p-3.5">
                      <span className="text-slate-500 dark:text-gray-400">Requested By</span>
                      <span className="font-bold text-slate-800 dark:text-gray-200">{selectedWO.requestedBy}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedDrawerTab === 'recipe' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recipe Specifications</h4>
                    <div className="border border-slate-200 dark:border-gray-700 rounded-xl p-4 bg-slate-50/50 dark:bg-gray-750 space-y-3">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-505">Recipe ID / BOM:</span>
                        <span className="font-bold text-slate-800 dark:text-gray-200">{selectedWO.recipeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-505">Category:</span>
                        <span className="font-bold text-slate-800 dark:text-gray-200">{selectedWO.category}</span>
                      </div>
                    </div>
                  </div>

                  {activeRecipe && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Config Sheet Details</h4>
                      <div className="border border-slate-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 space-y-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">Expected Loss:</span>
                          <span className="font-bold text-slate-800 dark:text-gray-200">{activeRecipe.bomItems[0]?.expectedLoss || 1.0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">Tolerance Limit:</span>
                          <span className="font-bold text-slate-800 dark:text-gray-200">±{activeRecipe.bomItems[0]?.tolerance || 0.5}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-500">Barcode Format:</span>
                          <span className="font-bold text-slate-800 dark:text-gray-200">{activeRecipe.defaultBarcodeFormat}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-505 block">Batch Formula:</span>
                          <span className="font-mono text-xs bg-slate-50 dark:bg-gray-750 p-2 rounded block border border-slate-100 dark:border-gray-700">{activeRecipe.defaultBatchFormula}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedDrawerTab === 'material' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Material Issue Summary</h4>
                  <div className="border border-slate-200 dark:border-gray-700 rounded-xl divide-y divide-slate-100 dark:divide-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                    {mockMaterialsList.map((item, idx) => (
                      <div key={idx} className="p-3.5 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-808 block">{item.material}</span>
                          <span className="text-xs text-slate-400">Batch: {item.batch}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-750 dark:text-gray-205 block">{item.issued} {item.unit}</span>
                          <span className="text-[10px] text-slate-400">Issued Quantity</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDrawerTab === 'production' && (
                <div className="space-y-6">
                  {/* Operator Performance */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operator Performance</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 dark:bg-gray-750 border border-slate-100 dark:border-gray-700 rounded-lg">
                        <span className="text-slate-400 dark:text-gray-500 block text-[10px]">Operator Name</span>
                        <span className="font-bold text-slate-750 dark:text-gray-205">Ramesh Patel</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-gray-750 border border-slate-100 dark:border-gray-700 rounded-lg">
                        <span className="text-slate-400 dark:text-gray-500 block text-[10px]">Operator Efficiency</span>
                        <span className="font-bold text-[#00891D] dark:text-green-400 font-bold">96.5%</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-gray-750 border border-slate-100 dark:border-gray-700 rounded-lg">
                        <span className="text-slate-400 dark:text-gray-500 block text-[10px]">Active Since</span>
                        <span className="font-bold text-slate-700 dark:text-gray-300 font-medium">08:30 AM</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-gray-750 border border-slate-100 dark:border-gray-700 rounded-lg">
                        <span className="text-slate-400 dark:text-gray-500 block text-[10px]">Idle Time</span>
                        <span className="font-bold text-slate-700 dark:text-gray-300 font-medium">05 mins</span>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instructions & Checklist</h4>
                    <div className="bg-slate-50 dark:bg-gray-750 border border-slate-150 dark:border-gray-700 p-4 rounded-xl space-y-3">
                      <div className="text-xs text-slate-600 dark:text-gray-305 space-y-1">
                        <span className="font-bold text-slate-800 dark:text-gray-200 block mb-1">Standard Packaging Checklist</span>
                        <div>1. Check sealing heat level before start.</div>
                        <div>2. Affix labels centrally on top flat surface.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Actions Bar Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-750 flex justify-end">
              <button
                onClick={() => setSelectedDrawerTab(null)}
                className="bg-slate-800 hover:bg-slate-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
