import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workOrderService, type WorkOrder } from '../../api/workOrderService';
import { ArrowLeft, Package, CheckCircle, AlertTriangle, Activity } from 'lucide-react';

export const PackingHistoryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<WorkOrder | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const woRes = await workOrderService.getWorkOrders();
        const found = woRes.data.find(wo => wo.id === id);
        setJob(found || null);

        if (found) {
          const logsRes = await workOrderService.getWorkOrderAuditLogs(found.id);
          setLogs(logsRes);
        }
      } catch (err) {
        console.error('Failed to fetch details', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!job) {
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Job not found</div>;
  }

  const expected = job.expectedDate ? new Date(job.expectedDate).getTime() : 0;
  const completed = job.completedAt ? new Date(job.completedAt).getTime() : new Date().getTime();
  
  // Fallback if startedAt is missing: use the earliest log's date, or createdAt
  const fallbackStart = logs.length > 0 ? new Date(logs[logs.length - 1].createdAt).getTime() : new Date(job.createdAt).getTime();
  const started = job.startedAt ? new Date(job.startedAt).getTime() : fallbackStart;
  
  const isOnTime = expected === 0 || completed <= expected;
  const durationMins = Math.round((completed - started) / 60000);
  const durationText = durationMins > 60 ? `${Math.floor(durationMins/60)}h ${durationMins%60}m` : `${durationMins}m`;
  
  const completionPercentage = job.requiredQty > 0 ? Math.min(100, Math.round(((job.actualProduced || 0) / job.requiredQty) * 100)) : 0;

  return (
    <div className="max-w-md mx-auto md:max-w-5xl pb-20 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <button onClick={() => navigate('/operator/history')} className="p-2 bg-slate-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-lg border border-slate-200 dark:border-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{job.woNumber}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Packing History Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Main Details */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{job.product?.name || 'Product'}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">SKU: {job.product?.sku || 'N/A'} • Batch: {job.batchNumber || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 dark:bg-gray-900 p-3 rounded-xl border border-slate-100 dark:border-gray-700">
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Recipe</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{job.recipe?.name || 'Standard'}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">SLA Result</p>
            <p className={`text-sm font-bold flex items-center ${isOnTime ? 'text-green-700' : 'text-red-700'}`}>
              {isOnTime ? <CheckCircle size={14} className="mr-1" /> : <AlertTriangle size={14} className="mr-1" />}
              {isOnTime ? 'On Time' : 'Delayed'}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-gray-700 pt-4">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Quantities</h3>
            <span className="text-xs font-bold text-green-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-slate-50 dark:bg-gray-900 rounded-lg border border-slate-100 dark:border-gray-700">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Required</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{job.requiredQty}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg border border-green-100">
              <p className="text-[10px] text-green-700 font-bold uppercase">Packed</p>
              <p className="text-sm font-bold text-green-700">{job.actualProduced || 0}</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg border border-red-100">
              <p className="text-[10px] text-red-700 font-bold uppercase">Rejected</p>
              <p className="text-sm font-bold text-red-700">{job.actualRejected || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3">Timings</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
            <span className="text-gray-500 dark:text-gray-400">Started</span>
            <span className="font-bold text-gray-800 dark:text-gray-100">{new Date(started).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
            <span className="text-gray-500 dark:text-gray-400">Completed</span>
            <span className="font-bold text-gray-800 dark:text-gray-100">{job.completedAt ? new Date(job.completedAt).toLocaleString() : 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 dark:text-gray-400">Total Duration</span>
            <span className="font-bold text-gray-800 dark:text-gray-100">{durationText}</span>
          </div>
          </div>
        </div>
        </div>

        <div className="space-y-6">
          {/* Activity Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-3">
          <Activity size={18} className="text-gray-400" />
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Activity Timeline</h3>
        </div>
        
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No activity logs found.</p>
        ) : (
          <div className="space-y-4 pl-2 border-l-2 border-gray-100 dark:border-gray-700 ml-2">
            {logs.map((log, index) => (
              <div key={log.id || index} className="relative pl-4">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                <div className="text-xs text-gray-400 font-medium mb-0.5">
                  {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{log.action.replace(/_/g, ' ')}</p>
                {log.action === 'PAUSE_PACKING' && log.newData?.pauseReason && (
                  <p className="text-xs text-orange-600 font-medium mt-1 bg-orange-50 inline-block px-2 py-0.5 rounded">Reason: {log.newData.pauseReason}</p>
                )}
                {log.action === 'UPDATE_QUANTITY' && log.newData && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    Packed: {log.newData.actualProduced || 0} | Rejected: {log.newData.actualRejected || 0}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};
