import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, ArrowRight, Play, AlertCircle, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { qcTasksService } from '../services/qcTasksService';
import type { QCInspection } from '../../../shared/types';

import { qualityCheckService } from '../../../api/qualityCheckService';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    pending: 0,
    ready: 0,
    inProgress: 0,
    completed: 0,
    delayed: 0,
    issues: 0
  });

  const [activeJob, setActiveJob] = useState<QCInspection | null>(null);

  const QC_STATUSES = ['PACKING_COMPLETED', 'LABEL_APPLICATION_ASSIGNED', 'LABEL_APPLICATION_IN_PROGRESS', 'LABELS_APPLIED', 'QC_PENDING'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [woRes, qcRes] = await Promise.all([
          qcTasksService.getWorkOrders(),
          qualityCheckService.getQualityChecks()
        ]);
        const orders = woRes.data || [];
        const qcs = qcRes.data || [];
        
        const qcPendingOrders = orders.filter((o: any) => QC_STATUSES.includes(o.status));
        const passedTodayCount = qcs.filter((q: any) => q.result === 'PASS' || q.result === 'PARTIAL_PASS').length;
        const failedTodayCount = qcs.filter((q: any) => q.result === 'REJECT' || q.result === 'DISCARD' || q.result === 'REWORK').length;

        setStats({
          pending: qcPendingOrders.length,
          ready: qcPendingOrders.length,
          inProgress: 0, 
          completed: passedTodayCount,
          delayed: failedTodayCount,
          issues: 0
        });
        const active = orders.find((o: any) => QC_STATUSES.includes(o.status));
        setActiveJob(active || null);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const kpis = [
    { 
      title: 'Pending Inspection', 
      value: stats.pending.toString(), 
      icon: Clock, 
      color: 'text-gray-500', 
      bg: 'bg-gray-100', 
      border: 'border-gray-200',
      onClick: () => navigate('/qc/tasks', { state: { filter: 'pending' } })
    },
    { 
      title: 'Ready for QC', 
      value: stats.ready.toString(), 
      icon: PackageCheck, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      border: 'border-blue-100',
      onClick: () => navigate('/qc/tasks', { state: { filter: 'ready' } })
    },
    { 
      title: 'QC In Progress', 
      value: stats.inProgress.toString(), 
      icon: Play, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50', 
      border: 'border-orange-100',
      onClick: () => navigate('/qc/active-inspection')
    },
    { 
      title: 'Passed Today', 
      value: stats.completed.toString(), 
      icon: CheckCircle, 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      border: 'border-green-100',
      onClick: () => navigate('/qc/history', { state: { status: 'passed', date: 'Today' } })
    },
    { 
      title: 'Failed Today', 
      value: stats.delayed.toString(), 
      icon: AlertTriangle, 
      color: 'text-red-600', 
      bg: 'bg-red-50', 
      border: 'border-red-100',
      onClick: () => navigate('/qc/history', { state: { status: 'failed', date: 'Today' } })
    },
    { 
      title: 'Issues Reported', 
      value: stats.issues.toString(), 
      icon: AlertCircle, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50', 
      border: 'border-purple-100',
      onClick: () => {} // On hold
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={index} 
              onClick={kpi.onClick}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-full transition-transform ${kpi.title !== 'Issues Reported' ? 'hover:-translate-y-1 cursor-pointer' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.border} border`}>
                  <Icon size={20} className={kpi.color} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-gray-800 dark:text-gray-100 tracking-tight">{kpi.value}</h3>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">{kpi.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Active Job) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <div className="p-5 md:p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">New jobs</h2>
                {activeJob && QC_STATUSES.includes(activeJob.status) && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Inspecting
                  </span>
                )}
              </div>

              {activeJob ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight">{activeJob.woNumber}</h3>
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">{activeJob.product?.name || 'Loading Product...'}</p>
                    </div>
                    <div className="flex flex-row md:flex-col gap-4 md:gap-1 text-sm font-medium">
                      <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                        <PackageCheck size={16} className="mr-2 text-green-600" />
                        Target: <span className="font-bold text-gray-800 dark:text-gray-100 ml-1">{activeJob.requiredQty} units</span>
                      </div>
                      <div className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                        <CheckCircle size={16} className="mr-2 text-blue-600" />
                        Packed: <span className="font-bold text-gray-800 dark:text-gray-100 ml-1">{activeJob.actualProduced || 0} units</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden">
                    <div 
                      className="bg-green-500 h-3 rounded-full relative" 
                      style={{ width: `${Math.min(100, ((activeJob.actualProduced || 0) / activeJob.requiredQty) * 100)}%` }}
                    >
                      <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]"></div>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/qc/active-inspection')}
                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center"
                  >
                    Resume QC <ArrowRight size={18} className="ml-2" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-full mb-4">
                    <PackageCheck size={48} className="text-gray-300 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">No active QC inspection.</p>
                  <button 
                    onClick={() => navigate('/qc/tasks')}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    View Assigned QC Tasks
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Quick Actions) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/qc/active-inspection')}
                className="w-full flex items-center p-4 bg-slate-50 dark:bg-gray-900 rounded-xl hover:bg-green-50 hover:text-green-700 transition-colors border border-slate-100 dark:border-gray-700 hover:border-green-200 group"
              >
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg shadow-sm mr-3 text-green-600">
                  <Play size={20} />
                </div>
                <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-green-700">Resume QC</span>
              </button>
              
              <button 
                onClick={() => navigate('/qc/tasks')}
                className="w-full flex items-center p-4 bg-slate-50 dark:bg-gray-900 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors border border-slate-100 dark:border-gray-700 hover:border-blue-200 group"
              >
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg shadow-sm mr-3 text-blue-600">
                  <PackageCheck size={20} />
                </div>
                <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-700">My QC Tasks</span>
              </button>
              
              <button 
                onClick={() => navigate('/qc/report-issue')}
                className="w-full flex items-center p-4 bg-slate-50 dark:bg-gray-900 rounded-xl hover:bg-red-50 hover:text-red-700 transition-colors border border-slate-100 dark:border-gray-700 hover:border-red-200 group"
              >
                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg shadow-sm mr-3 text-red-600">
                  <AlertTriangle size={20} />
                </div>
                <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-red-700">Report Issue</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
