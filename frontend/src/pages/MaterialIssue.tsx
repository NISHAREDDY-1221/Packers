import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workOrderService } from '../api/workOrderService';
import type { WorkOrder } from '../api/workOrderService';
import DataTable from '../components/ui/Table/DataTable';
import ViewIconButton from '../components/ui/Button/ViewIconButton';
import StatusIcon from '../components/ui/StatusIcon/StatusIcon';

import {
  Package, Search, Filter, RefreshCw, AlertTriangle, Clock, Calendar
} from 'lucide-react';

export const MaterialIssue: React.FC = () => {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchWO = async () => {
    try {
      setLoading(true);
      const res = await workOrderService.getWorkOrders();
      setWorkOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWO(); }, []);

  // Filter to pending issues (APPROVED or MATERIAL_ISSUED)
  const pendingIssues = useMemo(() => {
    return workOrders.filter(w => w.status === 'APPROVED' || w.status === 'MATERIAL_ISSUED');
  }, [workOrders]);

  // KPIs
  const totalRequests = pendingIssues.length;
  const pendingCount = pendingIssues.filter(w => w.status === 'APPROVED').length;
  const issuedToday = pendingIssues.filter(w => w.status === 'MATERIAL_ISSUED').length; // placeholder metric
  const delayed = 0; // placeholder metric

  // Apply filters and search
  const filteredData = useMemo(() => {
    return pendingIssues.filter(item => {
      const matchesSearch = 
        item.woNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.recipe?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [pendingIssues, searchQuery, statusFilter]);

  const columns = [
    { 
      key: 'woNumber',
      label: 'WO No', 
      className: 'w-[12%] text-center',
      render: (row: WorkOrder) => <span className="font-mono text-gray-700 dark:text-gray-300 font-bold">{row.woNumber}</span> 
    },
    { 
      key: 'product',
      label: 'Product', 
      className: 'w-[20%] text-center',
      render: (row: WorkOrder) => row.product?.name || row.productId 
    },
    { 
      key: 'recipe',
      label: 'Recipe', 
      className: 'w-[20%] text-center',
      render: (row: WorkOrder) => row.recipe?.name || row.recipeId 
    },
    { 
      key: 'reqQty',
      label: 'Req Qty', 
      className: 'w-[10%] text-center',
      render: (row: WorkOrder) => <span className="font-mono">{row.requiredQty}</span> 
    },
    { 
      key: 'priority',
      label: 'Priority', 
      className: 'w-[10%] text-center',
      render: (row: WorkOrder) => (
        <div className="flex justify-center">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            row.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
            row.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {row.priority}
          </span>
        </div>
      ) 
    },
    { 
      key: 'status',
      label: 'Status', 
      className: 'w-[10%] text-center',
      render: (row: WorkOrder) => (
        <div className="flex justify-center">
          <StatusIcon status={row.status === 'COMPLETED' ? 'success' : row.status === 'MATERIAL_ISSUED' ? 'info' : row.status === 'APPROVED' ? 'pending' : row.status === 'DRAFT' ? 'warning' : 'pending'} />
        </div>
      )
    },
    { 
      key: 'expectedDate',
      label: 'Expected Date', 
      className: 'w-[12%] text-center',
      render: (row: WorkOrder) => <span className="font-mono text-gray-500">{row.expectedDate ? new Date(row.expectedDate).toLocaleDateString() : 'N/A'}</span> 
    },
    {
      key: 'action',
      label: 'Action',
      className: 'w-[6%] text-center',
      render: (row: WorkOrder) => (
        <div className="flex justify-center gap-2">
          <ViewIconButton onClick={() => navigate(`/material-issue/${row.id}`)} title="View Material Issue Details" />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Material Issue</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Home &gt; Operations &gt; Material Issue</p>
        </div>
        <button onClick={fetchWO} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalRequests}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Package size={20} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Pending Issues</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock size={20} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Issued Today</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{issuedToday}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Calendar size={20} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Delayed Requests</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{delayed}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search by WO No, Product, or Recipe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00891D] focus:border-transparent dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-gray-700 rounded-lg text-sm appearance-none bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00891D]"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Pending (APPROVED)</option>
                <option value="MATERIAL_ISSUED">Issued</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredData} 
          keyExtractor={(row: WorkOrder) => row.id} 
        />
      </div>
    </div>
  );
};
