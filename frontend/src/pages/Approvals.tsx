import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye,
  X,
  Check,
  Clock
} from 'lucide-react';
import { approvalService } from '../api/approvalService';
import type { ApprovalRequest, ApprovalType, ApprovalStatus, Priority } from '../types/approvals';

import toast from 'react-hot-toast';

export const Approvals: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

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
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ApprovalType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'ALL'>('ALL');
  
  // Modal State
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // KPIs
  const pendingCount = approvals.filter(a => a.status === 'PENDING').length;
  const approvedTodayCount = approvals.filter(a => a.status === 'APPROVED').length; // Mocking today logic
  const rejectedTodayCount = approvals.filter(a => a.status === 'REJECTED').length;
  const highPriorityCount = approvals.filter(a => a.status === 'PENDING' && (a.priority === 'HIGH' || a.priority === 'CRITICAL')).length;

  // Filtered Data
  const filteredApprovals = useMemo(() => {
    return approvals.filter(a => {
      const reqByStr = typeof a.requestedBy === 'string' ? a.requestedBy : (a.requestedBy as any)?.name || '';
      const matchesSearch = 
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.relatedEntityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reqByStr.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === 'ALL' || a.type === typeFilter;
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [approvals, searchTerm, typeFilter, statusFilter]);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      const updated = await approvalService.processApproval(selectedRequest.id, 'APPROVE');
      setApprovals(prev => prev.map(a => a.id === updated.id ? { ...a, status: updated.status, history: updated.history } : a));
      setSelectedRequest(null);
      toast.success('Request approved successfully!');
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      toast.error(`Failed to approve: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return;
    try {
      const updated = await approvalService.processApproval(selectedRequest.id, 'REJECT', rejectionReason);
      setApprovals(prev => prev.map(a => a.id === updated.id ? { ...a, status: updated.status, history: updated.history } : a));
      setRejectionReason('');
      setSelectedRequest(null);
      toast.error('Request rejected.');
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      toast.error(`Failed to reject: ${error.response?.data?.message || error.message}`);
    }
  };

  const getTypeLabel = (type: ApprovalType) => {
    return type.replace(/_/g, ' ');
  };

  const getPriorityBadge = (priority: Priority) => {
    const styles = {
      LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      MEDIUM: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      HIGH: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      CRITICAL: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${styles[priority]}`}>{priority}</span>;
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    const styles = {
      PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Approvals Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage and review operational requests.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1">{pendingCount}</p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-500">
            <Clock size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Approved Today</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-500 mt-1">{approvedTodayCount}</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-500">
            <CheckCircle size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rejected Today</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-500 mt-1">{rejectedTodayCount}</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-500">
            <XCircle size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">High Priority</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-500 mt-1">{highPriorityCount}</p>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-500">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Filters and Table Area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col h-[500px]">
        
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between bg-slate-50 dark:bg-gray-800/50">
          <div className="flex gap-4 flex-wrap">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search requests..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="ALL">All Types</option>
                <option value="WORK_ORDER">Work Order</option>
                <option value="MATERIAL_ISSUE">Material Issue</option>
                <option value="PACKING_VARIANCE">Packing Variance</option>
                <option value="QC_REWORK">QC Rework</option>
                <option value="REPACKING">Repacking</option>
              </select>
            </div>

            <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 table-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-gray-800 shadow-sm z-10">
              <tr className="border-b border-slate-200 dark:border-gray-700 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase">
                <th className="p-4 whitespace-nowrap">Request ID</th>
                <th className="p-4 whitespace-nowrap">Type</th>
                <th className="p-4 whitespace-nowrap">Related To</th>
                <th className="p-4 whitespace-nowrap">Product Name</th>
                <th className="p-4 whitespace-nowrap">Requested By</th>
                <th className="p-4 whitespace-nowrap">Date</th>
                <th className="p-4 whitespace-nowrap">Priority</th>
                <th className="p-4 whitespace-nowrap">Status</th>
                <th className="p-4 text-center whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-700 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    Loading approvals...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-red-500">
                    ⚠️ {error}
                  </td>
                </tr>
              ) : filteredApprovals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No approval requests found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredApprovals.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-gray-750 transition-colors">
                    <td className="p-4 font-mono font-medium text-slate-700 dark:text-gray-200">{req.id}</td>
                    <td className="p-4 text-slate-600 dark:text-gray-300 font-medium">{getTypeLabel(req.type)}</td>
                    <td className="p-4 text-slate-600 dark:text-gray-300">{req.relatedEntityName}</td>
                    <td className="p-4 text-slate-600 dark:text-gray-300 font-medium">{req.productName && req.productName !== '-' ? req.productName : 'Standard Product'}</td>
                    <td className="p-4 text-slate-600 dark:text-gray-300">{req.requestedBy}</td>
                    <td className="p-4 text-slate-600 dark:text-gray-400">{new Date(req.requestedDate).toLocaleDateString()}</td>
                    <td className="p-4">{getPriorityBadge(req.priority)}</td>
                    <td className="p-4">{getStatusBadge(req.status)}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setSelectedRequest(req)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ClipboardCheck size={20} className="text-green-600" />
                Approval Request: {selectedRequest.id}
              </h3>
              <button 
                onClick={() => { setSelectedRequest(null); setRejectionReason(''); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 sidebar-scrollbar space-y-6">
              
              {/* Header Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Type</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{getTypeLabel(selectedRequest.type)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Related Entity</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{selectedRequest.relatedEntityName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Requested By</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{selectedRequest.requestedBy}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-slate-50 dark:bg-gray-700/50 p-4 rounded-lg border border-slate-100 dark:border-gray-600">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Reason for Request</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{selectedRequest.reason}</p>
                {selectedRequest.remarks && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">"{selectedRequest.remarks}"</p>
                )}
              </div>

              {/* Values Diff */}
              {(selectedRequest.existingValues || selectedRequest.proposedValues) && (
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Requested Changes</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10 rounded-lg p-4">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2 uppercase">Current Value</p>
                      <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                        {JSON.stringify(selectedRequest.existingValues || {}, null, 2)}
                      </pre>
                    </div>
                    <div className="border border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10 rounded-lg p-4">
                      <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-2 uppercase">Proposed Value</p>
                      <pre className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
                        {JSON.stringify(selectedRequest.proposedValues || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* History */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">History</h4>
                <div className="space-y-3">
                  {selectedRequest.history.map((h, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                        {i !== selectedRequest.history.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {h.action} <span className="font-normal text-gray-500 text-xs ml-2">{new Date(h.actionDate).toLocaleString()}</span>
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">by {h.actionBy}</p>
                        {h.comments && <p className="text-gray-700 dark:text-gray-300 mt-1 italic">"{h.comments}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Actions (Only if PENDING) */}
            {selectedRequest.status === 'PENDING' && (
              <div className="p-5 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 rounded-b-xl space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-gray-400 mb-1">Rejection Reason (Required for Reject)</label>
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason if rejecting..."
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 dark:bg-gray-700 dark:text-white h-20"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    <X size={16} />
                    Reject Request
                  </button>
                  <button 
                    onClick={handleApprove}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                  >
                    <Check size={16} />
                    Approve Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
