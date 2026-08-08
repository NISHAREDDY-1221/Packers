import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  X, 
  Check, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { approvalService } from '../api/approvalService';
import type { ApprovalRequest, ApprovalType, ApprovalStatus, Priority, InventoryValidationItem } from '../types/approvals';
import toast from 'react-hot-toast';

export const Approvals: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await approvalService.getApprovals();
      setApprovals(data);
    } catch (err: any) {
      console.error('Failed to fetch approvals:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter] = useState<ApprovalType | 'ALL'>('ALL');
  const [statusFilter] = useState<ApprovalStatus | 'ALL'>('PENDING');

  // Selected Request for Full Page Approval Review (Opens ONLY when 'Review' button is clicked)
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [lastCheckedTime, setLastCheckedTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filtered approvals list
  const filteredApprovals = useMemo(() => {
    return approvals.filter(a => {
      const woNum = a.woDetails?.woNumber || a.relatedEntityName || a.id;
      const prodName = a.woDetails?.outputProduct || a.productName || '';
      const reqBy = a.woDetails?.requestedBy || a.requestedBy || '';

      const matchesSearch = 
        woNum.toLowerCase().includes(searchTerm.toLowerCase()) || 
        prodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reqBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'ALL' || a.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [approvals, searchTerm, typeFilter, statusFilter]);

  // If currently selected request is no longer pending/filtered, return to list
  useEffect(() => {
    if (selectedRequest && !filteredApprovals.find(a => a.id === selectedRequest.id)) {
      setSelectedRequest(null);
    }
  }, [filteredApprovals, selectedRequest]);

  const paginatedApprovals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApprovals.slice(start, start + pageSize);
  }, [filteredApprovals, currentPage]);

  const totalPages = Math.ceil(filteredApprovals.length / pageSize);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      await approvalService.processApproval(selectedRequest.id, 'APPROVE');
      toast.success(`Work Order ${selectedRequest.woDetails?.woNumber || selectedRequest.relatedEntityName} approved!`);
      const updated = approvals.filter(a => a.id !== selectedRequest.id);
      setApprovals(updated);
      setSelectedRequest(null);
    } catch (err: any) {
      console.error('Failed to approve request:', err);
      toast.error(`Failed to approve: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    try {
      await approvalService.processApproval(selectedRequest.id, 'REJECT', rejectionReason);
      toast.error(`Work Order ${selectedRequest.woDetails?.woNumber || selectedRequest.relatedEntityName} rejected.`);
      setRejectionReason('');
      const updated = approvals.filter(a => a.id !== selectedRequest.id);
      setApprovals(updated);
      setSelectedRequest(null);
    } catch (err: any) {
      console.error('Failed to reject request:', err);
      toast.error(`Failed to reject: ${err.response?.data?.message || err.message}`);
    }
  };

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'URGENT':
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 whitespace-nowrap inline-flex items-center">High</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 whitespace-nowrap inline-flex items-center">High</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 whitespace-nowrap inline-flex items-center">Medium</span>;
      default:
        return <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap inline-flex items-center">Low</span>;
    }
  };

  const renderInventoryStatusDot = (req: ApprovalRequest) => {
    const status = req.inventoryStatus || 'NOT_CHECKED';
    if (status === 'STOCK_AVAILABLE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 whitespace-nowrap shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          Stock Available
        </span>
      );
    }
    if (status === 'STOCK_SHORTAGE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 whitespace-nowrap shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          Stock Shortage
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-gray-750 text-gray-500 dark:text-gray-400 border border-slate-200 dark:border-gray-700 whitespace-nowrap shrink-0">
        <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
        Not Checked
      </span>
    );
  };

  // ----------------------------------------------------------------------
  // FULL PAGE VIEW 2: Work Order Approval Review (Triggered by Review button)
  // ----------------------------------------------------------------------
  if (selectedRequest) {
    const validationItems = selectedRequest.inventoryValidation || [];
    const shortageItems = validationItems.filter((item: InventoryValidationItem) => item.shortage > 0);
    const totalShortageQty = shortageItems.reduce((sum, item) => sum + item.shortage, 0);
    const shortageUnit = shortageItems[0]?.uom || 'PCS';
    const hasShortage = shortageItems.length > 0;

    return (
      <div className="space-y-6 text-left select-none pb-12">
        {/* Top Action Bar */}
        <div className="flex flex-wrap justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-xs gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <button 
              onClick={() => setSelectedRequest(null)}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-gray-700 px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-gray-750 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft size={16} />
              <span>Back to Pending Work Orders</span>
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>Work Order Approval</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">({selectedRequest.woDetails?.woNumber || selectedRequest.relatedEntityName})</span>
              </h1>
            </div>
          </div>
          <button 
            onClick={() => setSelectedRequest(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 p-1.5 rounded-lg cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Full Page Review Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (5 cols): Work Order Details & Decision Card */}
          <div className="xl:col-span-5 space-y-6">
            
            {/* Details Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-xs p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider border-b border-slate-100 dark:border-gray-700 pb-3">
                Work Order Details
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block mb-1">WO Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {selectedRequest.woDetails?.woNumber || selectedRequest.relatedEntityName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block mb-1">Requested By</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-sm truncate block">
                    {selectedRequest.woDetails?.requestedBy || selectedRequest.requestedBy}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block mb-1">Output Product</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedRequest.woDetails?.outputProduct || selectedRequest.productName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block mb-1">Requested On</span>
                  <span className="font-medium text-slate-800 dark:text-gray-200 text-xs whitespace-nowrap">
                    {new Date(selectedRequest.woDetails?.requestedDate || selectedRequest.requestedDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block mb-1">Recipe / BOM</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedRequest.woDetails?.recipeCode || 'REC-BOM'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block mb-1">Target Yield Qty</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedRequest.woDetails?.targetYieldQty || 1}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block mb-1">Planned Quantity</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                    {selectedRequest.woDetails?.targetQty || 100} Packs
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block mb-1">UOM</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedRequest.woDetails?.uomName || 'Pack'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block mb-1">Priority</span>
                  <div>{getPriorityBadge(selectedRequest.priority)}</div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-gray-400 block mb-1">Status</span>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 inline-flex items-center whitespace-nowrap">
                    Pending Approval
                  </span>
                </div>
              </div>
            </div>

            {/* Decision Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-xs p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider border-b border-slate-100 dark:border-gray-700 pb-3">
                Approval Decision
              </h3>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300">
                  Rejection Reason <span className="text-slate-400 font-normal">(Required if rejecting)</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full border border-slate-200 dark:border-gray-700 rounded-xl p-3 text-xs bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 h-24 shadow-2xs resize-none"
                />
              </div>
              <div className="flex justify-end items-center gap-3 pt-2">
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-750 rounded-xl text-xs font-bold transition-colors shadow-2xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  <X size={16} />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  <Check size={16} />
                  Approve
                </button>
              </div>
            </div>

          </div>

          {/* Right Column (7 cols): Inventory Validation Table & Shortage Banner */}
          <div className="xl:col-span-7 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-xs p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-gray-700 pb-3 flex-wrap gap-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-gray-300 uppercase tracking-wider">
                  Inventory Validation
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400">
                  <span>Last Checked: {lastCheckedTime}</span>
                  <button 
                    onClick={() => {
                      setLastCheckedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                      fetchApprovals();
                      toast.success('Stock levels refreshed!');
                    }}
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw size={13} />
                    Refresh Stock
                  </button>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="border border-slate-200 dark:border-gray-700 rounded-xl overflow-x-auto w-full shadow-2xs table-scrollbar">
                <table className="w-full text-left text-xs border-collapse min-w-[640px]">
                  <thead className="bg-slate-50 dark:bg-gray-700/50 border-b border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5 whitespace-nowrap">MATERIAL</th>
                      <th className="p-3.5 whitespace-nowrap">TYPE</th>
                      <th className="p-3.5 text-center whitespace-nowrap">REQUIRED QTY</th>
                      <th className="p-3.5 whitespace-nowrap">UOM</th>
                      <th className="p-3.5 text-center whitespace-nowrap">AVAILABLE STOCK</th>
                      <th className="p-3.5 text-center whitespace-nowrap">SHORTAGE</th>
                      <th className="p-3.5 text-center whitespace-nowrap">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                    {validationItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500 font-medium">
                          No materials listed in recipe.
                        </td>
                      </tr>
                    ) : (
                      validationItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-750">
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {item.materialName}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap inline-block ${
                              item.type === 'PACKAGING' 
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {item.type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {item.requiredQty}
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-gray-400 font-mono text-xs whitespace-nowrap">
                            {item.uom}
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {item.availableStock}
                          </td>
                          <td className={`p-3.5 text-center font-bold text-sm whitespace-nowrap ${item.shortage > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                            {item.shortage}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            {item.shortage === 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 whitespace-nowrap shrink-0">
                                <Check size={12} /> Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 whitespace-nowrap shrink-0">
                                <AlertTriangle size={12} /> Insufficient
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Shortage Warning Box */}
              {hasShortage && (
                <div className="bg-orange-50/90 dark:bg-amber-950/30 border border-orange-200 dark:border-amber-800 rounded-xl p-5 flex items-start gap-4 text-orange-900 dark:text-amber-300">
                  <AlertTriangle className="text-orange-600 dark:text-amber-400 shrink-0 mt-0.5" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-orange-800 dark:text-amber-300">
                      Cannot approve this work order
                    </h4>
                    <p className="text-xs mt-1 text-orange-700 dark:text-amber-400 font-medium">
                      Insufficient stock for {shortageItems.length} item(s). Total shortage: {totalShortageQty} {shortageUnit}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // FULL PAGE VIEW 1: Pending Work Orders List Page (Default View)
  // ----------------------------------------------------------------------
  return (
    <div className="space-y-4 text-left select-none pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Approvals</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Review and approve pending work orders</p>
      </div>

      {/* Pending Work Orders Table (Full Page) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-xs overflow-hidden flex flex-col">
        
        {/* Table Header */}
        <div className="p-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
          <h2 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            Pending Work Orders ({filteredApprovals.length})
          </h2>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-gray-850 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search work orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 shadow-xs"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 shadow-xs cursor-pointer whitespace-nowrap">
            <Filter size={14} className="text-slate-500" />
            <span>Filters</span>
          </button>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto w-full min-h-[420px] table-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[840px]">
            <thead className="bg-slate-50 dark:bg-gray-700/50 border-b border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4 whitespace-nowrap">WO NUMBER</th>
                <th className="p-4 whitespace-nowrap">OUTPUT PRODUCT</th>
                <th className="p-4 whitespace-nowrap">RECIPE / BOM</th>
                <th className="p-4 text-center whitespace-nowrap">TARGET QTY</th>
                <th className="p-4 whitespace-nowrap">PRIORITY</th>
                <th className="p-4 whitespace-nowrap">INVENTORY STATUS</th>
                <th className="p-4 whitespace-nowrap">REQUESTED ON</th>
                <th className="p-4 text-center whitespace-nowrap">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Loading pending work orders...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-red-500">
                    ⚠️ {error}
                  </td>
                </tr>
              ) : paginatedApprovals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No pending work orders found.
                  </td>
                </tr>
              ) : (
                paginatedApprovals.map(req => {
                  const woNo = req.woDetails?.woNumber || req.relatedEntityName || req.id;
                  const prodName = req.woDetails?.outputProduct || req.productName || 'Standard Product';
                  const recipeCode = req.woDetails?.recipeCode || 'REC-BOM';
                  const targetQty = req.woDetails?.targetQty || 100;
                  const requestedDate = req.woDetails?.requestedDate || req.requestedDate;

                  return (
                    <tr 
                      key={req.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {woNo}
                      </td>
                      <td className="p-4 font-semibold text-slate-800 dark:text-gray-200 whitespace-nowrap">
                        {prodName}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-gray-400 font-mono text-xs whitespace-nowrap">
                        {recipeCode}
                      </td>
                      <td className="p-4 text-center font-semibold text-slate-800 dark:text-gray-200 whitespace-nowrap">
                        {targetQty} Packs
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {getPriorityBadge(req.priority)}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {renderInventoryStatusDot(req)}
                      </td>
                      <td className="p-4 text-slate-500 dark:text-gray-400 text-xs whitespace-nowrap">
                        {new Date(requestedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="px-4 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="p-4 border-t border-slate-100 dark:border-gray-700 flex justify-between items-center text-xs text-slate-500 dark:text-gray-400 bg-slate-50/50 dark:bg-gray-800 flex-wrap gap-2">
          <span>
            Showing {filteredApprovals.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredApprovals.length)} of {filteredApprovals.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2.5 py-1 border border-emerald-600 bg-emerald-50 text-emerald-700 font-bold rounded">
              {currentPage}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages === 0}
              className="p-1.5 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
