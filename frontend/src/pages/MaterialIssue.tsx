import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workOrderService } from '../api/workOrderService';
import type { WorkOrder } from '../api/workOrderService';
import DataTable from '../components/ui/Table/DataTable';
import ViewIconButton from '../components/ui/Button/ViewIconButton';


import {
  Package, Search, Filter, RefreshCw, AlertTriangle, Clock, Calendar, RotateCcw
} from 'lucide-react';

export const MaterialIssue: React.FC = () => {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('APPROVED');

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
        (item.operator?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
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
      key: 'operator',
      label: 'Operator', 
      className: 'w-[20%] text-center',
      render: (row: WorkOrder) => <span className="font-medium text-gray-700">{row.operator?.name || row.supervisor?.name || row.operatorId || 'Unassigned'}</span> 
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
      render: (row: WorkOrder) => {
        let displayStatus = 'PENDING';
        let colorClass = 'bg-orange-50 text-orange-600 border-orange-200';
        
        if (row.status === 'MATERIAL_ISSUED') {
          displayStatus = 'ISSUED';
          colorClass = 'bg-[#00891D]/10 text-[#00891D] border-[#00891D]/20';
        } else if (row.status === 'COMPLETED') {
          displayStatus = 'COMPLETED';
          colorClass = 'bg-[#00891D]/10 text-[#00891D] border-[#00891D]/20';
        }

        return (
          <div className="flex justify-center">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-normal whitespace-nowrap ${colorClass}`}>
              {displayStatus}
            </span>
          </div>
        );
      }
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

      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        {/* Filters Group */}
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm h-10 overflow-hidden w-full xl:w-auto">
          <div className="px-3 flex items-center justify-center text-slate-500 shrink-0">
            <Filter size={16} />
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-gray-700 shrink-0" />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-gray-300 bg-transparent border-none focus:ring-0 outline-none cursor-pointer appearance-none min-w-[140px] shrink-0"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Pending</option>
            <option value="MATERIAL_ISSUED">Issued</option>
          </select>

          <div className="w-px h-6 bg-slate-200 dark:bg-gray-700 shrink-0" />

          <button
            onClick={() => {
              setStatusFilter('APPROVED');
              setSearchQuery('');
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors bg-transparent cursor-pointer shrink-0"
          >
            <RotateCcw size={14} />
            Reset Filter
          </button>
        </div>

        {/* Search bar */}
        <div className="relative w-full xl:w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search by WO No, Product, or Operator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00891D]/20 focus:border-[#00891D] dark:text-white transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <DataTable 
          columns={columns} 
          data={filteredData} 
          keyExtractor={(row: WorkOrder) => row.id} 
        />
      </div>
    </div>
  );
};
