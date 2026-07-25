import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, ChevronDown, RotateCcw, Package, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { StatCard, DataTable, SearchInput, SelectInput, ViewIconButton } from '../components/ui';

import { workOrderService } from '../api/workOrderService';

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'DRAFT': return 'bg-gray-100 text-gray-700';
    case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'APPROVED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'MATERIAL_ISSUED':
    case 'MATERIAL ISSUED': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'PACKING_STARTED':
    case 'PACKING STARTED': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    case 'PACKING IN PROGRESS': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'PACKING COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toUpperCase()) {
    case 'LOW': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
    case 'MEDIUM': return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'HIGH': return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
    case 'URGENT': return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300';
    default: return 'bg-gray-50 text-gray-700';
  }
};

export const PackingExecution: React.FC = () => {
  const navigate = useNavigate();
  const [apiWorkOrders, setApiWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    setLoading(true);
    workOrderService.getWorkOrders().then(res => {
      const formatStatus = (s: string) => {
        if (!s) return 'Draft';
        if (s === 'QC_PENDING') return 'QC Pending';
        if (s === 'QC_PASSED') return 'QC Passed';
        if (s === 'COMPLETED') return 'Packing Completed';
        return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      };
      
      const getSupervisorName = (supervisor: any) => {
        if (!supervisor) return 'Unassigned';
        if (typeof supervisor === 'string') return supervisor;
        return supervisor.name || 'Unassigned';
      };

      const mapped = (res.data || []).map((wo: any) => ({
        ...wo,
        statusLabel: formatStatus(wo.status),
        supervisorName: getSupervisorName(wo.supervisor),
        productName: wo.product?.name || 'Unknown Product',
        progress: wo.actualProduced ? Math.round((wo.actualProduced / wo.requiredQty) * 100) : 0
      }));
      setApiWorkOrders(mapped);
    }).catch(console.error).finally(() => setLoading(false));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  const filteredOrders = useMemo(() => {
    const allowedStatuses = ['Material Issued', 'Packing Started', 'Packing In Progress', 'Packing Completed'];
    return apiWorkOrders.filter(wo => {
      if (!allowedStatuses.includes(wo.statusLabel)) return false;
      if (statusFilter && wo.statusLabel !== statusFilter) return false;
      if (priorityFilter && wo.priority !== priorityFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !wo.woNumber?.toLowerCase().includes(term) &&
          !wo.productName?.toLowerCase().includes(term) &&
          !wo.supervisorName?.toLowerCase().includes(term)
        ) return false;
      }
      return true;
    });
  }, [apiWorkOrders, statusFilter, priorityFilter, searchTerm]);

  const sortedOrders = useMemo(() => {
    if (!sortField || !sortDirection) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });
  }, [filteredOrders, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const columns = [
    {
      key: 'woNumber', label: 'WORK ORDER NO.', sortable: true,
      render: (wo: any) => <div className="text-center font-medium text-xs">{wo.woNumber}</div>
    },
    {
      key: 'productName', label: 'PRODUCT', sortable: true,
      render: (wo: any) => <div className="text-center text-xs line-clamp-1">{wo.productName}</div>
    },
    {
      key: 'assignedTeam', label: 'ASSIGNED TEAM',
      render: () => <div className="text-center text-xs text-gray-500">Packing A</div>
    },
    {
      key: 'supervisorName', label: 'OPERATOR', sortable: true,
      render: (wo: any) => <div className="text-center text-xs">{wo.supervisorName}</div>
    },

    {
      key: 'requiredQty', label: 'REQ. QTY', sortable: true,
      render: (wo: any) => <div className="text-center text-xs font-semibold">{wo.requiredQty}</div>
    },
    {
      key: 'actualProduced', label: 'PACKED QTY', sortable: true,
      render: (wo: any) => <div className="text-center text-xs font-semibold">{wo.actualProduced || 0}</div>
    },
    {
      key: 'progress', label: 'PROGRESS', sortable: true,
      render: (wo: any) => (
        <div className="flex items-center justify-center gap-2">
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#00891D]" style={{ width: `${wo.progress}%` }}></div>
          </div>
          <span className="text-xs text-gray-500">{wo.progress}%</span>
        </div>
      )
    },
    {
      key: 'priority', label: 'PRIORITY', sortable: true,
      render: (wo: any) => (
        <div className="text-center">
          <span className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${getPriorityColor(wo.priority)}`}>
            {wo.priority}
          </span>
        </div>
      )
    },
    {
      key: 'status', label: 'STATUS', sortable: true,
      render: (wo: any) => (
        <div className="text-center">
          <span className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${getStatusColor(wo.statusLabel)}`}>
            {wo.statusLabel}
          </span>
        </div>
      )
    },
    {
      key: 'startedAt', label: 'START DATE & TIME', sortable: true,
      render: (wo: any) => (
        <div className="text-center text-xs text-gray-500">
          {wo.startedAt ? new Date(wo.startedAt).toLocaleString() : '-'}
        </div>
      )
    },
    {
      key: 'actions', label: 'ACTION', sortable: false,
      render: (wo: any) => (
        <div className="flex items-center justify-center">
          <ViewIconButton 
            onClick={() => navigate(`/packing-execution/${wo.id}`)}
            size={14}
            tooltip="View Details"
            className="text-[#00891D] hover:bg-green-50"
          />
        </div>
      )
    }
  ];

  const totalJobs = apiWorkOrders.length;
  const inProgress = apiWorkOrders.filter(w => w.status === 'PACKING_STARTED').length;
  const completedToday = apiWorkOrders.filter(w => {
    if (w.status !== 'COMPLETED') return false;
    const date = new Date(w.updatedAt || w.createdAt || Date.now());
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }).length;
  const delayed = apiWorkOrders.filter(w => w.priority === 'URGENT' || w.priority === 'HIGH').length;

  return (
    <div className="w-full px-1 sm:px-2 md:px-3 pb-4">
      <div className="mb-2 mt-3">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
          Packing Execution
        </h1>
        <Breadcrumbs />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-full mb-6">
        <StatCard title="Total Packing Jobs" value={totalJobs} icon={Package} variant="purple" />
        <StatCard title="In Progress" value={inProgress} icon={Clock} variant="yellow" />
        <StatCard title="Completed Today" value={completedToday} icon={CheckCircle} variant="green" />
        <StatCard title="Delayed Jobs" value={delayed} icon={AlertTriangle} variant="red" />
      </div>

      <div className="mt-2 mb-6 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-gray-300 dark:divide-gray-600 w-full sm:w-auto overflow-hidden">
          <div className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-center flex-shrink-0">
            <Filter size={18} className="text-gray-700" />
          </div>

          <div className="px-3 sm:px-4 py-3 sm:py-4 w-[150px] relative flex-shrink-0">
            <div className="[&_select]:border-0 [&_select]:bg-transparent [&_select]:focus:ring-0 [&_select]:text-xs sm:text-sm [&_select]:font-bold [&_select]:text-gray-900 [&_select]:w-full">
              <SelectInput
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'Status' },
                  { value: 'Material Issued', label: 'Material Issued' },
                  { value: 'Packing Started', label: 'Packing Started' },
                  { value: 'Packing In Progress', label: 'Packing In Progress' },
                  { value: 'Packing Completed', label: 'Packing Completed' }
                ]}
              />
            </div>
            <ChevronDown size={16} className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
          </div>

          <div className="px-3 sm:px-4 py-3 sm:py-4 w-[150px] relative flex-shrink-0">
            <div className="[&_select]:border-0 [&_select]:bg-transparent [&_select]:focus:ring-0 [&_select]:text-xs sm:text-sm [&_select]:font-bold [&_select]:text-gray-900 [&_select]:w-full">
              <SelectInput
                value={priorityFilter}
                onChange={(e: any) => setPriorityFilter(e.target.value)}
                options={[
                  { value: '', label: 'Priority' },
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'URGENT', label: 'Urgent' }
                ]}
              />
            </div>
            <ChevronDown size={16} className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
          </div>

          <div className="px-3 sm:px-4 py-3 sm:py-4 flex-shrink-0">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap hover:opacity-80 text-orange-600 dark:text-orange-400 w-full sm:w-auto justify-center"
            >
              <RotateCcw size={14} className="sm:w-4 sm:h-4 text-orange-600 dark:text-orange-400" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        <div className="w-full lg:w-auto lg:min-w-[200px] lg:flex-shrink-0">
          <SearchInput
            placeholder="Search"
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            className="h-10 w-full"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <DataTable
            data={sortedOrders}
            columns={columns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            keyExtractor={(wo: any) => wo.id}
            emptyMessage="No work orders found"
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
