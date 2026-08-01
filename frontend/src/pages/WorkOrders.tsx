import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { workOrderService } from '../api/workOrderService';
import type { WoStatus, WoPriority, WorkOrder } from '../api/workOrderService';
import {
  Plus, Search, Calendar, X,
  Check, Clipboard,
  RefreshCw, LayoutGrid, Table as TableIcon, Edit,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { masterDataService } from '../api/masterDataService';
import type { Recipe } from '../api/masterDataService';
import { authService } from '../api/authService';
import type { User } from '../api/authService';

const KANBAN_COLUMNS: WoStatus[] = [
  'DRAFT',
  'PENDING',
  'APPROVED',
  'MATERIAL_ISSUED',
  'PACKING_STARTED',
  'PACKING_COMPLETED',
  'LABELS_PRINTED',
  'QC_PENDING',
  'QC_PASSED',
  'QC_FAILED',
  'REPACKING',
  'FINISHED_GOODS',
  'COMPLETED',
  'CANCELLED'
];

interface TimelineStep {
  status: WoStatus;
  label: string;
  desc: string;
}

export const WorkOrders: React.FC = () => {
  const { } = useApp();

  const [apiWorkOrders, setApiWorkOrders] = useState<WorkOrder[]>([]);
  const workOrders = apiWorkOrders;

  const fetchWorkOrders = async () => {
    try {
      const res = await workOrderService.getWorkOrders();
      setApiWorkOrders(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const [apiOperators, setApiOperators] = useState<User[]>([]);

  React.useEffect(() => {
    fetchWorkOrders();
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const ops = await authService.getOperators();
      setApiOperators(ops);
    } catch(e) {
      console.error(e);
    }
  };

  
  // API Recipes state
  const [apiRecipes, setApiRecipes] = useState<Recipe[]>([]);
  const [apiRecipesLoading, setApiRecipesLoading] = useState(false);
  const [apiRecipesError, setApiRecipesError] = useState('');

  React.useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setApiRecipesLoading(true);
    setApiRecipesError('');
    try {
      const data = await masterDataService.getRecipes();
      setApiRecipes(data);
    } catch (err: any) {
      setApiRecipesError(err.response?.data?.message || 'Failed to load recipes from server.');
    } finally {
      setApiRecipesLoading(false);
    }
  };

  // View mode state
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSupervisor, setFilterSupervisor] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  // Selected KPI Filter
  const [kpiFilter, setKpiFilter] = useState<string>('all');

  // Drawer / Details state
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState<WorkOrder | null>(null);

  // Create Form states
  const [formRecipeId, setFormRecipeId] = useState('');
  const [formQty, setFormQty] = useState(100);
  const [formPriority, setFormPriority] = useState<WoPriority>('MEDIUM');
  const [formOperatorName, setFormOperatorName] = useState<string>('');
  const [formExpectedCompletion, setFormExpectedCompletion] = useState('');

  // Edit Form states
  const [editQty, setEditQty] = useState(100);
  const [editPriority, setEditPriority] = useState<WoPriority>('MEDIUM');
  const [editSupervisor, setEditSupervisor] = useState('');
  const [editExpectedCompletion, setEditExpectedCompletion] = useState('');

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRefresh = () => {
    fetchWorkOrders();
    showToast("Work orders list refreshed successfully!");
  };

  // Derived filter dropdown lists
  const categories = useMemo(() => Array.from(new Set(workOrders.map(wo => wo.product?.category?.name || 'Unknown'))), [workOrders]);
  const supervisors = useMemo(() => Array.from(new Set(workOrders.map(wo => wo.operator?.name || wo.supervisor?.name || wo.supervisorId))), [workOrders]);

  // Derived summaries for KPI Cards
  const summary = useMemo(() => {
    return {
      total: workOrders.length,
      draft: workOrders.filter(w => w.status === 'DRAFT').length,
      pending: workOrders.filter(w => w.status === 'PENDING').length,
      approved: workOrders.filter(w => w.status === 'APPROVED').length,
      packingStarted: workOrders.filter(w => w.status === 'PACKING_STARTED').length,
      qcPending: workOrders.filter(w => w.status === 'QC_PENDING').length,
      completed: workOrders.filter(w => w.status === 'COMPLETED').length
    };
  }, [workOrders]);

  // Filter application
  const filteredWOs = useMemo(() => {
    return workOrders.filter(wo => {
      // 1. Search Query (WO No, Product, Recipe/BOM)
      const matchesSearch =
        (wo.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (wo.woNumber || wo.id).toLowerCase().includes(search.toLowerCase()) ||
        (wo.recipe?.code || wo.recipeId).toLowerCase().includes(search.toLowerCase());

      // 2. Main Filters
      const matchesStatus = filterStatus === 'All' || wo.status === filterStatus;
      const matchesPriority = filterPriority === 'All' || wo.priority === filterPriority;
      const matchesCategory = filterCategory === 'All' || (wo.product?.category?.name || 'Misc') === filterCategory;
      const matchesSupervisor = filterSupervisor === 'All' || (wo.operator?.name || wo.supervisor?.name || '') === filterSupervisor;
      const woDatePrefix = wo.expectedDate ? wo.expectedDate.substring(0, 10) : '';
      const matchesDate = !filterDate || woDatePrefix === filterDate;

      // 3. KPI filter override
      let matchesKpi = true;
      if (kpiFilter === 'draft') {
        matchesKpi = wo.status === 'DRAFT';
      } else if (kpiFilter === 'pending') {
        matchesKpi = wo.status === 'PENDING';
      } else if (kpiFilter === 'approved') {
        matchesKpi = wo.status === 'APPROVED';
      } else if (kpiFilter === 'packing_started') {
        matchesKpi = wo.status === 'PACKING_STARTED';
      } else if (kpiFilter === 'qc_pending') {
        matchesKpi = wo.status === 'QC_PENDING';
      } else if (kpiFilter === 'completed') {
        matchesKpi = wo.status === 'COMPLETED';
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory &&
             matchesSupervisor && matchesDate && matchesKpi;
    });
  }, [workOrders, search, filterStatus, filterPriority, filterCategory, filterSupervisor, filterDate, kpiFilter]);

  // Pagination logic
  const paginatedWOs = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredWOs.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredWOs, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredWOs.length / rowsPerPage);

  const selectedRecipe = apiRecipes.find(r => r.id === formRecipeId);

  // Status colors utility
  const getStatusColor = (status: WorkOrder['status']) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'PENDING': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'APPROVED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MATERIAL_ISSUED': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PACKING_STARTED': return 'bg-green-50 text-green-700 border-green-200';
      case 'QC_PENDING': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'QC_PASSED':
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      
    }
  };

  // Priority colors utility
  const getPriorityStyle = (p: WorkOrder['priority']) => {
    switch (p) {
      case 'URGENT': return 'bg-red-50 text-red-700 border-red-200 font-bold';
      case 'HIGH': return 'bg-orange-50 text-orange-750 border-orange-200';
      case 'MEDIUM': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW': return 'bg-slate-55 text-slate-700 border-slate-200';
    }
  };

  // Create Form Handler
  const handleCreateWO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecipeId) return;
    const recipe = apiRecipes.find(r => r.id === formRecipeId)!;
    try {
      await workOrderService.createWorkOrder({
        productId: recipe.outputProductId,
        recipeId: formRecipeId,
        requiredQty: Number(formQty),
        priority: formPriority as WoPriority,
        expectedDate: formExpectedCompletion ? new Date(formExpectedCompletion).toISOString() : undefined,
        operatorId: formOperatorName
      });
      setIsCreateOpen(false);
      showToast('Work order created successfully.');
      fetchWorkOrders();
      setFormRecipeId('');
      setFormQty(100);
      setFormPriority('MEDIUM');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating Work Order');
    }
  };

  // Edit WO Handler
  const handleOpenEdit = (wo: WorkOrder) => {
    setIsEditOpen(wo);
    setEditQty(wo.requiredQty);
    setEditPriority(wo.priority);
    setEditSupervisor((wo.operator?.name || wo.supervisor?.name || ''));
    setEditExpectedCompletion(wo.expectedDate ? new Date(wo.expectedDate).toISOString().substring(0, 10) : '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditOpen) return;
    try {
      await workOrderService.updateWorkOrderStatus(isEditOpen.id, isEditOpen.rawStatus || isEditOpen.status);
      setIsEditOpen(null);
      showToast('Work order updated successfully.');
      fetchWorkOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating Work Order');
    }
  };

  // Workflow transition helper
  const canTransition = (from: WorkOrder['status'], to: WorkOrder['status']) => {
    if (from === to) return true;
    if (from === 'COMPLETED' || from === 'CANCELLED') return false;

    switch (from) {
      case 'DRAFT':
        return to === 'PENDING' || to === 'APPROVED' || to === 'CANCELLED';
      case 'PENDING':
        return to === 'APPROVED' || to === 'CANCELLED';
      case 'APPROVED':
        return to === 'MATERIAL_ISSUED' || to === 'PACKING_STARTED' || to === 'CANCELLED';
      case 'MATERIAL_ISSUED':
        return to === 'PACKING_STARTED' || to === 'CANCELLED';
      case 'PACKING_STARTED':
        return to === 'QC_PENDING' || to === 'CANCELLED';
      case 'QC_PENDING':
        return to === 'COMPLETED' || to === 'CANCELLED';
      default:
        return false;
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, woId: string) => {
    e.dataTransfer.setData('text/plain', woId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: WorkOrder['status']) => {
    e.preventDefault();
    const woId = e.dataTransfer.getData('text/plain');
    const wo = workOrders.find(w => w.id === woId);

    if (wo) {
      if (canTransition(wo.status, targetStatus)) {
        workOrderService.updateWorkOrderStatus(woId, targetStatus).then(fetchWorkOrders).catch(console.error);
        showToast(`Workflow status updated: ${(wo.woNumber || wo.id)} is now ${targetStatus}.`);
      } else {
        showToast(`Transition not allowed from ${wo.status} to ${targetStatus}.`);
      }
    }
  };

  // Detail Drawer timeline list
  const timelineSteps: TimelineStep[] = useMemo(() => {
    if (!selectedWO) return [];
    return [
      { status: 'DRAFT', label: 'Work Order Drafted', desc: `Created on ${selectedWO.createdAt || 'N/A'}.` },
      { status: 'PENDING', label: 'Submitted for Approval', desc: `Awaiting store manager authorization.` },
      { status: 'APPROVED', label: 'Authorized & Approved', desc: selectedWO.operator?.name ? `Assigned to operator ${selectedWO.operator.name}.` : 'Work order authorized & approved for material issue.' },
      { status: 'MATERIAL_ISSUED', label: 'Raw Materials Issued', desc: `BOM inventory dispatched to packing line.` },
      { status: 'PACKING_STARTED', label: 'Packing Execution Started', desc: `Currently active on floor.` },
      { status: 'QC_PENDING', label: 'QC Audit Verification', desc: `Quality checks pending evaluation.` },
      { status: 'COMPLETED', label: 'COMPLETED', desc: `Finished goods safely posted.` }
    ];
  }, [selectedWO]);

  return (
    <div className="space-y-5 text-left font-sans select-none pb-12">
      
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-55 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg">
          {toastMessage}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clipboard className="text-[#00891D]" size={20} />
            <span>Packing Work Orders</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">Create, approve, assign and monitor packing work orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 bg-[#00891D] hover:bg-[#007518] text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Work Order</span>
          </button>
          <button
            onClick={handleRefresh}
            className="p-2 border border-gray-250 bg-white hover:bg-gray-50 rounded-lg text-gray-500 cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* KPI CARDS (Exactly 7 cards matching status) */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        {[
          { key: 'all', title: 'Total Work Orders', count: summary.total },
          { key: 'draft', title: 'DRAFT', count: summary.draft },
          { key: 'pending', title: 'PENDING', count: summary.pending },
          { key: 'approved', title: 'APPROVED', count: summary.approved },
          { key: 'packing_started', title: 'PACKING_STARTED', count: summary.packingStarted },
          { key: 'qc_pending', title: 'QC_PENDING', count: summary.qcPending },
          { key: 'completed', title: 'COMPLETED', count: summary.completed }
        ].map(card => (
          <div
            key={card.key}
            onClick={() => setKpiFilter(prev => prev === card.key ? 'all' : card.key)}
            className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-gray-50 ${
              kpiFilter === card.key
                ? 'border-[#00891D] bg-green-50/30 ring-1 ring-[#00891D]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate block">{card.title}</span>
            <span className="text-lg font-bold text-gray-900 block mt-1">{card.count}</span>
          </div>
        ))}
      </div>

      {/* SEARCH & FILTERS SECTION */}
      <div className="bg-white p-4 border border-gray-200 rounded-lg space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by WO Number, Product, Recipe/BOM..."
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00891D] focus:border-[#00891D]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* View Switcher */}
          <div className="flex border border-gray-250 rounded-lg p-0.5 bg-gray-50">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-3.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-[#00891D] font-bold' : 'text-gray-505'
              }`}
            >
              <TableIcon size={14} />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-3.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white shadow-xs text-[#00891D] font-bold' : 'text-gray-505'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Kanban</span>
            </button>
          </div>
        </div>

        {/* Filter inputs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#00891D]"
            >
              <option value="All">All Statuses</option>
              {KANBAN_COLUMNS.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full p-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Operator</label>
            <select
              value={filterSupervisor}
              onChange={(e) => setFilterSupervisor(e.target.value)}
              className="w-full p-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none"
            >
              <option value="All">All Operators</option>
              {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full p-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Clear Filters indicator */}
        {(search || filterStatus !== 'All' || filterPriority !== 'All' || filterCategory !== 'All' || filterSupervisor !== 'All' || filterDate || kpiFilter !== 'all') && (
          <div className="flex justify-between items-center text-[11px] text-gray-500 pt-1.5 border-t border-gray-100 font-medium">
            <span>Showing {filteredWOs.length} of {workOrders.length} orders</span>
            <button
              onClick={() => {
                setSearch('');
                setFilterStatus('All');
                setFilterPriority('All');
                setFilterCategory('All');
                setFilterSupervisor('All');
                setFilterDate('');
                setKpiFilter('all');
              }}
              className="text-[#00891D] hover:underline font-bold cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* DATA VIEWS CONTAINER */}
      {filteredWOs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-16 text-center space-y-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-450">
            <Clipboard size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-gray-900">No Work Orders</h3>
            <p className="text-xs text-gray-400">There are no work orders configured.</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#00891D] hover:bg-[#007518] text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Create Work Order
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        // TABLE VIEW
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[60vh] table-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="p-3 font-semibold text-gray-500 uppercase">Work Order No</th>
                  <th className="p-3 font-semibold text-gray-500 uppercase">Product</th>
                  <th className="p-3 font-semibold text-gray-500 uppercase">Recipe/BOM</th>
                  <th className="p-3 font-semibold text-gray-505 uppercase text-right">Required Quantity</th>
                  <th className="p-3 font-semibold text-gray-505 uppercase">Operator</th>
                  <th className="p-3 font-semibold text-gray-500 uppercase">Priority</th>
                  <th className="p-3 font-semibold text-gray-505 uppercase">Status</th>
                  <th className="p-3 font-semibold text-gray-550 uppercase">Expected Completion</th>
                  <th className="p-3 font-semibold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedWOs.map(wo => (
                  <tr
                    key={wo.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-gray-700">{(wo.woNumber || wo.id)}</td>
                    <td className="p-3 font-semibold text-gray-900 truncate max-w-[200px]">{(wo.product?.name || '')}</td>
                    <td className="p-3 text-gray-600 font-medium">{(wo.recipe?.code || wo.recipeId)}</td>
                    <td className="p-3 text-right font-bold text-gray-900">{wo.requiredQty}</td>
                    <td className="p-3 text-gray-600 font-medium">{(wo.operator?.name || '')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityStyle(wo.priority)}`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-normal whitespace-nowrap ${getStatusColor(wo.status)}`}>
                        {wo.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 font-mono">{wo.expectedDate ? new Date(wo.expectedDate).toLocaleDateString() : ''}</td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedWO(wo)}
                        className="text-[#00891D] hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="p-1 border border-gray-200 rounded-md bg-white focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>Showing {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredWOs.length)} of {filteredWOs.length} orders</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-gray-200 rounded-md bg-white disabled:opacity-50 transition-all cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-bold">{currentPage} / {totalPages || 1}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 border border-gray-200 rounded-md bg-white disabled:opacity-50 transition-all cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        
        // KANBAN VIEW
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-[1800px]">
            {KANBAN_COLUMNS.map(column => {
              const columnWOs = filteredWOs.filter(w => w.status === column);

              return (
                <div
                  key={column}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column)}
                  className="flex-1 min-w-[220px] max-w-[260px] bg-gray-50 rounded-xl p-3 border border-gray-200 flex flex-col max-h-[70vh]"
                >
                  <div className="flex justify-between items-center mb-3 px-1 text-left">
                    <span className="font-bold text-[10px] text-gray-500 uppercase tracking-wider">{column}</span>
                    <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {columnWOs.length}
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto flex-1 pr-1 sidebar-scrollbar">
                    {columnWOs.map(wo => (
                      <div
                        key={wo.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, wo.id)}
                        onClick={() => setSelectedWO(wo)}
                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs hover:border-[#00891D] hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex flex-col gap-2 relative text-left"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-[9px] font-bold text-gray-400">{(wo.woNumber || wo.id)}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${getPriorityStyle(wo.priority)}`}>
                            {wo.priority}
                          </span>
                        </div>

                        <div className="text-xs">
                          <h4 className="font-bold text-gray-900 line-clamp-1">{(wo.product?.name || '')}</h4>
                          <span className="text-[9px] text-gray-450 block font-medium mt-0.5">Recipe/BOM: {(wo.recipe?.code || wo.recipeId)}</span>
                        </div>

                        <div className="text-[10px] text-gray-500 space-y-0.5 pt-1 border-t border-gray-100">
                          <div className="flex justify-between">
                            <span>Req Qty:</span>
                            <span className="font-bold text-gray-800">{wo.requiredQty}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Operator:</span>
                            <span className="font-semibold text-gray-700 truncate max-w-[100px]">{(wo.operator?.name || 'Unassigned')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Due Date:</span>
                            <span className="font-mono font-bold text-gray-650">{wo.expectedDate ? new Date(wo.expectedDate).toLocaleDateString() : ''}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {columnWOs.length === 0 && (
                      <div className="text-center py-6 text-[10px] text-gray-450 bg-white/40 border border-dashed border-gray-200 rounded-lg">
                        <span>No orders</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAIL DRAWER (Displays overview details + timeline only) */}
      {selectedWO && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-screen overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <div>
                  <span className="text-[9px] font-mono font-bold text-[#00891D] uppercase tracking-widest">{selectedWO.woNumber}</span>
                  <h3 className="text-sm font-bold text-gray-900">Work Order Details</h3>
                </div>
                <button onClick={() => setSelectedWO(null)} className="p-1 rounded hover:bg-gray-100 text-gray-400 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Work Order Information Grid */}
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-150 overflow-hidden bg-white text-xs">
                <div className="flex justify-between p-2.5">
                  <span className="text-gray-500 font-medium">Work Order No</span>
                  <span className="font-bold text-gray-900">{selectedWO.woNumber}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-gray-505 font-medium">Product</span>
                  <span className="font-bold text-gray-900 text-right max-w-[220px]">{(selectedWO.product?.name || '')}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-gray-505 font-medium">Recipe / BOM</span>
                  <span className="font-semibold text-gray-900">{selectedWO.recipeId}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-gray-505 font-medium">Required Quantity</span>
                  <span className="font-bold text-gray-900">{selectedWO.requiredQty} Units</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-gray-505 font-medium">Operator</span>
                  <span className="font-semibold text-gray-900">{selectedWO.operator?.name || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-gray-505 font-medium">Priority</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityStyle(selectedWO.priority)}`}>
                    {selectedWO.priority}
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-gray-505 font-medium">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(selectedWO.status)}`}>
                    {selectedWO.status}
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-gray-505 font-medium">Expected Completion</span>
                  <span className="font-bold text-gray-900">{selectedWO.expectedDate ? new Date(selectedWO.expectedDate).toLocaleDateString() : ''}</span>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Work Order Timeline</h4>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-200">
                  {timelineSteps.map((step, idx) => {
                    const getTimelineLevel = (s: string): number => {
                      switch (s) {
                        case 'DRAFT': return 0;
                        case 'PENDING': case 'PENDING_APPROVAL': return 1;
                        case 'APPROVED': return 2;
                        case 'MATERIAL_ISSUED': return 3;
                        case 'PACKING_STARTED': case 'PACKING_IN_PROGRESS': return 4;
                        case 'PACKING_COMPLETED': case 'LABELS_PRINTED': case 'QC_PENDING': return 5;
                        case 'QC_PASSED': case 'FINISHED_GOODS': case 'COMPLETED': return 6;
                        default: return 0;
                      }
                    };
                    const woLevel = getTimelineLevel(selectedWO.status);
                    const stepLevel = getTimelineLevel(step.status);
                    const isActive = woLevel === stepLevel;
                    const isPast = woLevel >= stepLevel;

                    return (
                      <div key={idx} className="flex gap-3 relative z-10 text-xs">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white border-2 border-white ${
                          isActive ? 'bg-[#00891D] ring-2 ring-[#00891D]/10' : (isPast ? 'bg-[#00891D]' : 'bg-gray-300')
                        }`}>
                          {isPast ? <Check size={8} /> : <span className="text-[7px]">{idx + 1}</span>}
                        </div>
                        <div>
                          <span className={`font-bold block ${isActive ? 'text-[#00891D]' : 'text-gray-700'}`}>{step.label}</span>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{step.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between items-center bg-gray-50 p-4 -mx-6 -mb-6 rounded-b-lg">
              <div className="flex gap-2">
                {selectedWO.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={() => {
                        handleOpenEdit(selectedWO);
                        setSelectedWO(null);
                      }}
                      className="bg-gray-150 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete draft ${selectedWO.woNumber}?`)) {
                          workOrderService.updateWorkOrderStatus(selectedWO.id, 'CANCELLED').then(() => { showToast('Cancelled work order.'); setSelectedWO(null); fetchWorkOrders(); }).catch(console.error);
                        }
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        workOrderService.updateWorkOrderStatus(selectedWO.id, 'PENDING').then(() => { showToast('Submitted for approval.'); setSelectedWO(null); fetchWorkOrders(); }).catch(console.error);
                      }}
                      className="bg-[#00891D] hover:bg-[#007518] text-white px-2.5 py-1 text-xs rounded-lg font-medium cursor-pointer"
                    >
                      Submit for Approval
                    </button>
                  </>
                )}

                {selectedWO.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                        workOrderService.updateWorkOrderStatus(selectedWO.id, 'APPROVED').then(() => { showToast('Approved work order.'); setSelectedWO(null); fetchWorkOrders(); }).catch(console.error);
                      }}
                      className="bg-[#00891D] hover:bg-[#007518] text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        workOrderService.updateWorkOrderStatus(selectedWO.id, 'CANCELLED').then(() => { showToast('Rejected work order.'); setSelectedWO(null); fetchWorkOrders(); }).catch(console.error);
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold cursor-pointer text-xs"
                    >
                      Reject
                    </button>
                  </>
                )}

                {selectedWO.status === 'APPROVED' && (
                  <>
                    <button
                      onClick={() => {
                        window.location.href = `/material-issue?woId=${selectedWO.id}`;
                      }}
                      className="bg-[#00891D] hover:bg-[#007017] text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer text-xs"
                    >
                      Issue Material
                    </button>
                    <button
                      onClick={() => {
                        workOrderService.startPacking(selectedWO.id).then(() => { showToast('Packing started.'); setSelectedWO(null); fetchWorkOrders(); }).catch(console.error);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer text-xs"
                    >
                      Start Packing
                    </button>
                  </>
                )}

                {selectedWO.status === 'MATERIAL_ISSUED' && (
                  <button
                    onClick={() => {
                      workOrderService.startPacking(selectedWO.id).then(() => { showToast('Packing started.'); setSelectedWO(null); fetchWorkOrders(); }).catch(console.error);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer text-xs"
                  >
                    Start Packing Execution
                  </button>
                )}

                {(selectedWO.status === 'PACKING_STARTED' || selectedWO.status === 'PACKING_IN_PROGRESS') && (
                  <button
                    onClick={() => {
                      window.location.href = `/operator/active-packing`;
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer text-xs"
                  >
                    Go to Active Packing
                  </button>
                )}

                {(selectedWO.status === 'PACKING_COMPLETED' || selectedWO.status === 'QC_PENDING') && (
                  <button
                    onClick={() => {
                      window.location.href = `/qc/quality-check`;
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer text-xs"
                  >
                    Go to Quality Check
                  </button>
                )}

                {(selectedWO.status === 'QC_PASSED' || selectedWO.status === 'FINISHED_GOODS' || selectedWO.status === 'COMPLETED') && (
                  <>
                    <button
                      onClick={() => {
                        window.location.href = `/finished-goods`;
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer text-xs"
                    >
                      Post to Finished Goods
                    </button>
                    {selectedWO.status !== 'COMPLETED' && (
                      <button
                        onClick={() => {
                          workOrderService.updateWorkOrderStatus(selectedWO.id, 'COMPLETED').then(() => { showToast('Work Order completed.'); setSelectedWO(null); fetchWorkOrders(); }).catch(console.error);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold cursor-pointer text-xs"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={() => setSelectedWO(null)}
                className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE WORK ORDER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-900 text-white rounded-t-xl">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Calendar size={16} />
                <span>Create Packing Work Order</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded hover:bg-gray-850 text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWO} className="p-5 space-y-4 flex-1 text-left text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 flex justify-between items-center">
                  <span>Select Recipe/BOM *</span>
                  <button type="button" onClick={fetchRecipes} className="text-[#00891D] hover:underline" disabled={apiRecipesLoading}>
                    {apiRecipesLoading ? 'Loading...' : 'Refresh recipes'}
                  </button>
                </label>
                {apiRecipesError ? (
                  <div className="text-red-600 text-xs py-2">{apiRecipesError}</div>
                ) : apiRecipes.length === 0 && !apiRecipesLoading ? (
                  <div className="text-gray-500 text-xs py-2">No eligible recipes available. Create one in Master Data first.</div>
                ) : (
                  <select
                    required
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-[#00891D] focus:outline-none"
                    value={formRecipeId}
                    onChange={(e) => setFormRecipeId(e.target.value)}
                  >
                    <option value="">{apiRecipesLoading ? 'Loading recipes...' : '-- Choose Recipe Configuration --'}</option>
                    {apiRecipes.filter(r => r.isActive !== false).map(r => (
                      <option key={r.id} value={r.id}>{r.code} - {r.name} - {r.outputProduct?.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Required Quantity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00891D]"
                    value={formQty}
                    onChange={(e) => setFormQty(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Priority *</label>
                  <select
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as WorkOrder['priority'])}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {selectedRecipe && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-150 space-y-1 text-[11px]">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">BOM Raw Materials & Packaging</span>
                  {selectedRecipe.items?.map((item, idx) => {
                    const reqQty = (item.requiredQty / selectedRecipe.outputQty) * formQty;
                    return (
                      <div key={idx} className="flex justify-between text-gray-650 font-medium">
                        <span>{item.inputProduct?.name}</span>
                        <span className="font-bold text-gray-800">{reqQty.toFixed(1)} {item.isPackaging ? 'Units' : 'kg'}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Expected Completion *</label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  value={formExpectedCompletion}
                  onChange={(e) => setFormExpectedCompletion(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Operator</label>
                  <select
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                    value={formOperatorName}
                    onChange={(e) => setFormOperatorName(e.target.value)}
                  >
                    <option value="">Select an operator...</option>
                    {apiOperators.map(op => (
                      <option key={op.id} value={op.id}>{op.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-end gap-2 bg-gray-50 p-3 -mx-5 -mb-5 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-gray-250 text-gray-700 hover:bg-gray-100 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00891D] hover:bg-[#007518] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT WORK ORDER MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-900 text-white rounded-t-xl">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Edit size={16} />
                <span>Edit Work Order {isEditOpen.woNumber}</span>
              </h3>
              <button onClick={() => setIsEditOpen(null)} className="p-1 rounded hover:bg-gray-850 text-gray-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 flex-1 text-left text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Product Configuration</label>
                <input
                  type="text"
                  disabled
                  className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  value={`${(isEditOpen.product?.name || '')} (${isEditOpen.recipeId})`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Required Quantity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00891D]"
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Priority *</label>
                  <select
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as WorkOrder['priority'])}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Expected Completion *</label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                  value={editExpectedCompletion}
                  onChange={(e) => setEditExpectedCompletion(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Operator</label>
                  <select
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                    value={editSupervisor}
                    onChange={(e) => setEditSupervisor(e.target.value)}
                  >
                    <option value="">Select an operator...</option>
                    {apiOperators.map(op => (
                      <option key={op.id} value={op.id}>{op.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex justify-end gap-2 bg-gray-55 p-3 -mx-5 -mb-5 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(null)}
                  className="px-4 py-2 border border-gray-250 text-gray-700 hover:bg-gray-100 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00891D] hover:bg-[#007518] text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
