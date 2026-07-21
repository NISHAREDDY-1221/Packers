import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { workOrderService } from '../api/workOrderService';
import type { WorkOrder } from '../api/workOrderService';



import {
  Package, CheckCircle, HelpCircle, Clock, AlertTriangle, X, Info,
  Scan, RefreshCw, CornerUpLeft, ArrowLeftRight
} from 'lucide-react';

export const MaterialIssue: React.FC = () => {
  const { materialIssues: _mi, issueMaterials: _im, workOrders: _wo, refreshGlobalData } = useApp();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const fetchWO = async () => {
    try {
      const res = await workOrderService.getWorkOrders();
      setWorkOrders(res.data);
    } catch (e) { }
  };
  useEffect(() => { fetchWO(); }, []);

  // Compute pending issues from APPROVED work orders
  const pendingIssues = useMemo(() => {
    return workOrders.filter(w => w.status === 'APPROVED').map(w => ({
      id: 'MI-PEND-' + w.woNumber,
      woId: w.id,
      woNumber: w.woNumber,
      status: 'Pending',
      materials: w.recipe?.items?.map(item => ({
        item: item.inputProduct?.name || 'Unknown',
        required: item.requiredQty * w.requiredQty,
        available: 0, 
        issued: 0,
        batchNo: '',
        location: '',
        type: item.isPackaging ? 'Packaging' : 'Raw'
      })) || []
    }));
  }, [workOrders]);

  // Compute completed issues from MATERIAL_ISSUED work orders
  const completedIssues = useMemo(() => {
    return workOrders.filter(w => w.status === 'MATERIAL_ISSUED' || w.status === 'PACKING_STARTED' || w.status === 'COMPLETED').map(w => ({
      id: 'MI-COMP-' + w.woNumber,
      woId: w.id,
      woNumber: w.woNumber,
      status: 'Issued',
      issuedAt: w.updatedAt,
      materials: []
    }));
  }, [workOrders]);

  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);

  // Form states for each material row
  const [batches, setBatches] = useState<Record<string, string>>({});
  const [defaultBatches, setDefaultBatches] = useState<Record<string, string>>({});
  const [mfgDates, setMfgDates] = useState<Record<string, string>>({});
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [issuedQuantities, setIssuedQuantities] = useState<Record<string, number>>({});

  // Expanded batch details toggles
  const [expandedBatches, setExpandedBatches] = useState<Record<string, boolean>>({});

  // Override / Partial states
  const [partialIssueChecked, setPartialIssueChecked] = useState(false);
  const [supervisorOverride, setSupervisorOverride] = useState(false);

  // Barcode / Scanner simulation modal
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Lists



  // Find linked Work Order
  const linkedWO = useMemo(() => {
    if (!selectedIssue) return null;
    return workOrders.find(w => w.id === selectedIssue.woId || w.woNumber === selectedIssue.woNumber) || null;
  }, [selectedIssue, workOrders]);

  const handleSelectIssue = (issue: any) => {
    setSelectedIssue(issue);
    setPartialIssueChecked(false);
    setSupervisorOverride(false);
    setExpandedBatches({});

    const newBatches: Record<string, string> = {};
    const newMfgDates: Record<string, string> = {};
    const newExpiryDates: Record<string, string> = {};
    const newLocations: Record<string, string> = {};
    const newIssued: Record<string, number> = {};

    const today = new Date().toISOString().split('T')[0];
    const expiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    issue.materials.forEach(m => {
      newBatches[m.item] = '';
      newMfgDates[m.item] = today;
      newExpiryDates[m.item] = expiry;
      newLocations[m.item] = '';
      newIssued[m.item] = m.required;
    });

    setBatches(newBatches);
    setDefaultBatches(newBatches);
    setMfgDates(newMfgDates);
    setExpiryDates(newExpiryDates);
    setLocations(newLocations);
    setIssuedQuantities(newIssued);
  };

  // Determine material status
  const getMaterialStatus = (required: number, available: number, item: string) => {
    if (available < required) {
      return 'Shortage';
    }
    if (available < required * 1.3) {
      return 'Low Stock';
    }
    // Simulation of a Reserved status for specific elements
    if (item.toLowerCase().includes('box') || item.toLowerCase().includes('carton')) {
      return 'Reserved';
    }
    return 'Available';
  };

  // Summary Metrics calculations
  const summaryMetrics = useMemo(() => {
    if (!selectedIssue) return null;

    let availableCount = 0;
    let shortageCount = 0;
    let totalCost = 0;

    selectedIssue.materials.forEach(m => {
      const status = getMaterialStatus(m.required, m.available, m.item);
      if (status === 'Shortage') {
        shortageCount++;
      } else {
        availableCount++;
      }
      totalCost += 0; // Cost removed for API integration
    });

    return {
      total: selectedIssue.materials.length,
      available: availableCount,
      shortage: shortageCount,
      cost: '0.00',
      batches: selectedIssue.materials.length
    };
  }, [selectedIssue]);

  // Determine if shortages exist
  const hasShortage = useMemo(() => {
    return (summaryMetrics?.shortage || 0) > 0;
  }, [summaryMetrics]);

  // Supervisor Override Trigger Check
  const showSupervisorOverride = useMemo(() => {
    if (!selectedIssue) return false;

    // Check if low stock exists
    const hasLowStock = selectedIssue.materials.some(m => getMaterialStatus(m.required, m.available, m.item) === 'Low Stock');

    // Check if any batch was overridden
    const hasBatchOverride = selectedIssue.materials.some(m => batches[m.item] !== defaultBatches[m.item]);

    return hasLowStock || hasBatchOverride || partialIssueChecked;
  }, [selectedIssue, batches, defaultBatches, partialIssueChecked]);

  // Handle Form Submission Confirm Trigger
  const handleIssueSubmit = () => {
    if (!selectedIssue) return;
    setShowConfirmModal(true);
  };

  // Confirm Dispatch Execute
  const handleConfirmIssue = () => {
    if (!selectedIssue) return;

    const updatedMaterials = selectedIssue.materials.map(m => ({
      ...m,
      issued: issuedQuantities[m.item],
      batchNo: batches[m.item],
      location: locations[m.item]
    }));

    workOrderService.issueMaterials(selectedIssue.woId, updatedMaterials).then(() => {
      setShowConfirmModal(false);
      setSelectedIssue(null);
      fetchWO();
      refreshGlobalData();
      showToast('Materials issued successfully.');
    }).catch((e: any) => {
      alert(e.response?.data?.message || 'Error issuing materials');
    });
  };

  const handleBarcodeScanSim = (barcode: string) => {
    if (!selectedIssue) return;
    const found = selectedIssue.materials.find(m => m.item.toLowerCase().includes(barcode.toLowerCase()));
    if (found) {
      setScanMessage(`✓ Barcode recognized: ${found.item} allocated to batch.`);
    } else {
      setScanMessage(`✕ Barcode not found in current list.`);
    }
  };

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Priority Styles helper
  const getPriorityStyle = (p: string | undefined) => {
    switch (p) {
      case 'Urgent': return 'bg-red-50 text-red-700 border-red-200 font-bold';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-6 text-left select-none font-sans">

      {/* Toast notifications */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-55 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="text-[#00891D]" size={20} />
          <span>Material Issue Workspace</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">Deduct inventory raw materials, allocate batches, and verify storage dispatch paths.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN: Pending & History */}
        <div className="space-y-6 lg:col-span-1">

          {/* Pending Material Issues */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="text-amber-500" size={16} />
              <span>Pending Material Issues ({pendingIssues.length})</span>
            </h3>

            <div className="space-y-3">
              {pendingIssues.map(issue => {
                const wo = workOrders.find(w => w.id === issue.woId || w.woNumber === issue.woNumber);
                return (
                  <div
                    key={issue.id}
                    onClick={() => handleSelectIssue(issue)}
                    className={`p-3.5 rounded-lg border text-xs transition-all cursor-pointer space-y-2 ${selectedIssue?.id === issue.id
                      ? 'border-[#00891D] bg-green-50/20 shadow-xs ring-1 ring-[#00891D]'
                      : 'border-slate-200 hover:bg-slate-50 bg-white'
                      }`}
                  >
                    <div className="flex justify-between font-mono font-bold text-slate-400">
                      <span>{issue.id}</span>
                      {wo && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] border font-bold ${getPriorityStyle(wo.priority)}`}>
                          {wo.priority}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-800">Work Order No: {issue.woNumber}</div>
                    {wo && (
                      <div className="text-slate-700 font-semibold truncate">{wo.product?.name}</div>
                    )}
                    <div className="flex justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <span>Materials:</span>
                      <span className="font-bold text-slate-700">{issue.materials.length} Items</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Requested:</span>
                      <span className="font-mono">{wo?.createdAt ? new Date(wo.createdAt).toLocaleDateString() : '2026-07-17'}</span>
                    </div>
                  </div>
                );
              })}
              {pendingIssues.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-450">No pending issues.</div>
              )}
            </div>
          </div>

          {/* History */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <CheckCircle className="text-emerald-600" size={16} />
              <span>Recently Issued History ({completedIssues.length})</span>
            </h3>
            <div className="space-y-2.5">
              {completedIssues.map(issue => (
                <div key={issue.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs">
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>Issue ID: {issue.id}</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase text-[9px]">Issued</span>
                  </div>
                  <div className="font-semibold text-slate-850 mt-1.5">Linked WO: {issue.woNumber}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{issue.issuedAt}</div>
                </div>
              ))}
              {completedIssues.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-450">No issued logs.</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Table Workspace */}
        <div className="lg:col-span-2 space-y-5">
          {selectedIssue ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-full space-y-4 p-5">

              {/* Context card */}
              {linkedWO && (
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                      <span>Work Order Context</span>
                    </span>
                    <span className="font-mono text-slate-500 font-bold">{linkedWO.woNumber}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-600 font-medium">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Work Order No</span>
                      <span className="text-slate-850 font-bold font-mono">{linkedWO.woNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Product</span>
                      <span className="text-slate-850 font-bold truncate block max-w-[130px]">{(linkedWO.product?.name || '')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Recipe/BOM</span>
                      <span className="text-slate-850 font-bold">{linkedWO.recipe ? `${linkedWO.recipe.code} - ${linkedWO.recipe.name}` : linkedWO.recipeId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Required Quantity</span>
                      <span className="text-slate-850 font-bold">{linkedWO.requiredQty} Units</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Assigned Team</span>
                      <span className="text-slate-850 font-semibold block truncate max-w-[120px]">{('Team Alpha')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Supervisor</span>
                      <span className="text-slate-850 font-semibold">{linkedWO.supervisor?.name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Priority</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border inline-block mt-0.5 ${getPriorityStyle(linkedWO.priority)}`}>
                        {linkedWO.priority}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Expected Completion</span>
                      <span className="text-slate-850 font-bold font-mono block mt-0.5">{linkedWO.expectedDate}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Material Summary Header Card */}
              {summaryMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Total Materials</span>
                    <span className="text-base font-bold text-slate-800 mt-1 block">{summaryMetrics.total} Items</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wide block">Available</span>
                    <span className="text-base font-bold text-emerald-600 mt-1 block">{summaryMetrics.available} Stocked</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wide block">Shortage</span>
                    <span className={`text-base font-bold mt-1 block ${summaryMetrics.shortage > 0 ? 'text-red-650' : 'text-slate-500'}`}>
                      {summaryMetrics.shortage} Short
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wide block">Estimated Cost</span>
                    <span className="text-base font-bold text-slate-800 mt-1 block">${summaryMetrics.cost}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wide block">Auto Batches</span>
                    <span className="text-base font-bold text-blue-600 mt-1 block">{summaryMetrics.batches} Assigned</span>
                  </div>
                </div>
              )}

              {/* Checklist Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-150 py-2.5">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsScanning(prev => !prev)}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Scan size={13} />
                    <span>Scan Barcode</span>
                  </button>
                  <button
                    onClick={() => showToast("Inventory stock levels refreshed.")}
                    className="flex items-center gap-1 border border-slate-250 bg-white hover:bg-slate-50 text-slate-650 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span>Refresh Stock</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => showToast("Return Material form opened.")}
                    className="flex items-center gap-1 border border-slate-250 bg-white hover:bg-slate-50 text-slate-650 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    <CornerUpLeft size={13} />
                    <span>Return Material</span>
                  </button>
                  <button
                    onClick={() => showToast("Material Transfer request created.")}
                    className="flex items-center gap-1 border border-slate-250 bg-white hover:bg-slate-50 text-slate-655 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    <ArrowLeftRight size={13} />
                    <span>Transfer Material</span>
                  </button>
                </div>
              </div>

              {/* Barcode scan simulator block */}
              {isScanning && (
                <div className="bg-slate-50 p-3 border border-slate-200 rounded-lg space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">Barcode Scanner Simulator</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter SKU/Name (e.g. Rice, Box)..."
                      className="border border-slate-200 p-1.5 rounded-md flex-1 focus:outline-none focus:border-[#00891D]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleBarcodeScanSim((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => { setIsScanning(false); setScanMessage(null); }}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {scanMessage && <p className="text-[10px] font-bold text-emerald-700">{scanMessage}</p>}
                </div>
              )}

              {/* Table Title and Options */}
              <div className="flex justify-between items-center text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide">Materials to Issue</h4>

                {/* Override & Partial Controls */}
                <div className="flex items-center gap-4 font-bold text-slate-600">
                  {/* Enable Partial Issue only when shortages exist */}
                  <label className={`flex items-center gap-1.5 cursor-pointer ${!hasShortage ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      disabled={!hasShortage}
                      checked={partialIssueChecked}
                      onChange={(e) => setPartialIssueChecked(e.target.checked)}
                      className="rounded border-slate-350 text-[#00891D] focus:ring-[#00891D]"
                    />
                    <span>Partial Issue</span>
                  </label>

                  {/* Show Supervisor Override toggle only under special conditions */}
                  {showSupervisorOverride && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-orange-700">
                      <input
                        type="checkbox"
                        checked={supervisorOverride}
                        onChange={(e) => setSupervisorOverride(e.target.checked)}
                        className="rounded border-slate-350 text-orange-600 focus:ring-orange-600"
                      />
                      <span>Supervisor Override</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Checklist Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5 text-center">Required Qty</th>
                      <th className="p-2.5 text-center">Available Stock</th>
                      <th className="p-2.5">Batch No</th>
                      <th className="p-2.5">Storage Location</th>
                      <th className="p-2.5 text-center">Issue Qty</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-705">
                    {selectedIssue.materials.map(m => {
                      const matStatus = getMaterialStatus(m.required, m.available, m.item);
                      const isQtyEditable = partialIssueChecked || supervisorOverride;
                      const isExpanded = !!expandedBatches[m.item];

                      // Stock status styling
                      let badgeColor = '';
                      switch (matStatus) {
                        case 'Available': badgeColor = 'text-green-600 font-semibold'; break;
                        case 'Low Stock': badgeColor = 'text-amber-600 font-bold'; break;
                        case 'Reserved': badgeColor = 'text-blue-600 font-semibold'; break;
                        case 'Shortage': badgeColor = 'text-red-600 font-bold'; break;
                      }

                      return (
                        <React.Fragment key={m.item}>
                          <tr className="hover:bg-slate-50/45">
                            <td className="p-2.5 font-bold text-slate-900">{m.item}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${m.type === 'Raw' ? 'bg-indigo-50 text-indigo-755 border border-indigo-100' : 'bg-slate-100 text-slate-705 border border-slate-200'}`}>
                                {m.type}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-bold text-slate-900">{m.required}</td>
                            <td className="p-2.5 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-slate-800">{m.available}</span>
                                <span className={`text-[8px] uppercase tracking-wide mt-0.5 ${badgeColor}`}>
                                  {matStatus === 'Available' ? 'Available' :
                                    matStatus === 'Low Stock' ? 'Low Stock' :
                                      matStatus === 'Reserved' ? 'Reserved' : 'Shortage'}
                                </span>
                              </div>
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  className="border border-slate-200 p-1 rounded font-mono text-[10px] w-28 bg-white focus:outline-none focus:border-[#00891D]"
                                  value={batches[m.item] || ''}
                                  onChange={(e) => setBatches({ ...batches, [m.item]: e.target.value })}
                                />
                                <button
                                  type="button"
                                  onClick={() => setExpandedBatches({ ...expandedBatches, [m.item]: !isExpanded })}
                                  className="text-slate-400 hover:text-slate-600 p-0.5"
                                  title="MFG / EXP details"
                                >
                                  <Info size={12} />
                                </button>
                              </div>
                              {/* MFG & EXP collapsible sub-row detail */}
                              {isExpanded && (
                                <div className="mt-1 bg-slate-50 border border-slate-200 rounded p-1.5 space-y-1 w-28">
                                  <div>
                                    <label className="text-[7px] text-slate-400 font-bold block uppercase">MFG Date</label>
                                    <input
                                      type="date"
                                      className="border border-slate-200 p-0.5 rounded text-[8px] w-full focus:outline-none bg-white"
                                      value={mfgDates[m.item] || ''}
                                      onChange={(e) => setMfgDates({ ...mfgDates, [m.item]: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[7px] text-slate-400 font-bold block uppercase">EXP Date</label>
                                    <input
                                      type="date"
                                      className="border border-slate-200 p-0.5 rounded text-[8px] w-full focus:outline-none bg-white"
                                      value={expiryDates[m.item] || ''}
                                      onChange={(e) => setExpiryDates({ ...expiryDates, [m.item]: e.target.value })}
                                    />
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                className="border border-slate-200 p-1 rounded text-[10px] w-28 bg-white focus:outline-none focus:border-[#00891D]"
                                value={locations[m.item] || ''}
                                onChange={(e) => setLocations({ ...locations, [m.item]: e.target.value })}
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                disabled={!isQtyEditable}
                                className={`border border-slate-200 p-1 rounded text-center w-12 font-bold text-slate-800 focus:outline-none ${!isQtyEditable ? 'bg-slate-100 text-slate-500' : 'bg-white focus:border-[#00891D]'
                                  }`}
                                value={issuedQuantities[m.item] || 0}
                                onChange={(e) => setIssuedQuantities({ ...issuedQuantities, [m.item]: Number(e.target.value) })}
                              />
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setIssuedQuantities({ ...issuedQuantities, [m.item]: m.required });
                                  setBatches({ ...batches, [m.item]: defaultBatches[m.item] });
                                  showToast(`Reset allocation for ${m.item}.`);
                                }}
                                className="text-slate-450 hover:text-[#00891D] hover:underline font-bold text-[10px]"
                              >
                                Reset
                              </button>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Confirmation Summary */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1.5">Confirmation Summary</span>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-slate-650 font-medium">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Materials to Issue</span>
                    <span className="text-slate-850 font-bold block truncate max-w-[150px]">
                      {selectedIssue.materials.map(m => m.item).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Quantity</span>
                    <span className="text-slate-850 font-bold block">
                      {Object.values(issuedQuantities).reduce((a, b) => a + b, 0)} Units
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Estimated Cost</span>
                    <span className="text-slate-850 font-bold block">${summaryMetrics?.cost || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Warehouse</span>
                    <span className="text-slate-850 font-bold block">Main Warehouse A</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Selected Batches</span>
                    <span className="text-slate-850 font-bold block">{summaryMetrics?.batches || 0} Batches</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-4.5 py-2 border border-slate-250 text-slate-600 hover:bg-slate-55 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast("Draft material issue saved successfully.");
                  }}
                  className="px-4.5 py-2 border border-slate-250 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleIssueSubmit}
                  disabled={hasShortage && !partialIssueChecked}
                  className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer ${hasShortage && !partialIssueChecked
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-[#00891D] hover:bg-[#007518]'
                    }`}
                >
                  Issue Materials
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 bg-slate-105 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <HelpCircle size={24} />
              </div>
              <h3 className="font-bold text-slate-800 mb-1 text-sm">No Pending Issue Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm">Select an approved work order issue transaction from the left panel to review raw and packaging stock allocations.</p>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {showConfirmModal && selectedIssue && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-xs">
            <div className="p-4 bg-gray-900 text-white font-bold text-sm flex justify-between items-center">
              <span>Confirm Material Dispatch</span>
              <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-left text-slate-700">
              <p className="font-bold text-slate-805">Please verify the final allocations before confirming deduction:</p>

              <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-lg space-y-2 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Linked Work Order:</span>
                  <span className="font-bold text-slate-900">{selectedIssue.woNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Materials Checked:</span>
                  <span className="font-bold text-slate-900">{selectedIssue.materials.length} Items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deduction Warehouse:</span>
                  <span className="font-bold text-slate-900">Main Warehouse A</span>
                </div>

                <div className="border-t border-slate-200 pt-2 space-y-1 text-[11px]">
                  <span className="text-slate-400 block font-bold uppercase text-[9px]">Inventory Deductions & Batches:</span>
                  {selectedIssue.materials.map(m => (
                    <div key={m.item} className="flex justify-between font-mono">
                      <span className="truncate max-w-[200px]">{m.item}</span>
                      <span className="font-bold text-slate-800">{issuedQuantities[m.item]} units ({batches[m.item]})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-semibold flex gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>This action will deduct inventory and move the work order to Material Issued.</span>
              </div>
            </div>

            <div className="p-4 bg-slate-55 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-250 text-slate-655 font-bold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmIssue}
                className="px-4 py-2 bg-[#00891D] hover:bg-[#007518] text-white rounded-lg font-bold cursor-pointer"
              >
                Confirm Issue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
