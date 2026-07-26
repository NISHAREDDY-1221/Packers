import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, CheckCircle, AlertCircle, Clock, ListTodo, AlertTriangle, ArrowRight, Play } from 'lucide-react';
import { packingJobsService } from '../services/packingJobsService';
import type { PackingJob } from '../../../shared/types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [workOrders, setPackingJobs] = useState<PackingJob[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await packingJobsService.getWorkOrders();
        setPackingJobs(response.data);
      } catch (err) {
        console.error('Failed to fetch work orders for dashboard', err);
      }
    };
    fetchData();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  // Packing Operator metrics
  const pendingJobs = workOrders.filter((wo: any) => ['DRAFT', 'PENDING', 'APPROVED'].includes(wo.status)).length;
  const readyToStart = workOrders.filter((wo: any) => wo.status === 'MATERIAL_ISSUED').length;
  const packingInProgress = workOrders.filter((wo: any) => wo.status === 'PACKING_STARTED').length;
  const completedToday = workOrders.filter((wo: any) => 
    wo.status === 'COMPLETED' && (wo.completedAt?.startsWith(today) || wo.updatedAt?.startsWith(today))
  ).length;
  const delayedJobs = workOrders.filter((wo: any) => 
    wo.expectedDate && wo.expectedDate < today && wo.status !== 'COMPLETED'
  ).length;
  const issuesReported = 0; // Hardcoded until backend API is available

  const stats = [
    { label: 'Pending Jobs', value: pendingJobs || 0, icon: ListTodo, color: 'text-blue-500', bg: 'bg-blue-100', path: '/operator/jobs' },
    { label: 'Ready to Start', value: readyToStart || 0, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100', path: '/operator/jobs' },
    { label: 'Packing In Progress', value: packingInProgress || 0, icon: Package, color: 'text-purple-500', bg: 'bg-purple-100', path: '/operator/active-packing' },
    { label: 'Completed Today', value: completedToday || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', path: '/operator/history' },
    { label: 'Delayed Jobs', value: delayedJobs || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', path: '/operator/jobs' },
    { label: 'Issues Reported', value: issuesReported || 0, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', path: '/operator/report-issue' },
  ];

  const activeJobs = workOrders.filter((wo: any) => wo.status === 'PACKING_STARTED' || wo.status === 'MATERIAL_ISSUED');
  const activeJob = activeJobs.find((wo: any) => wo.status === 'PACKING_STARTED') || activeJobs.find((wo: any) => wo.status === 'MATERIAL_ISSUED');

  const slaRiskJobs = workOrders.filter((wo: any) => wo.expectedDate && wo.expectedDate <= today && wo.status !== 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Quick Alert */}
      {slaRiskJobs.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-3 shadow-sm">
          <div className="mt-0.5 text-red-500">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-red-800">SLA Risk Detected</h4>
            <p className="text-xs text-red-600 mt-0.5">You have {slaRiskJobs.length} job(s) at risk of missing SLA today.</p>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              onClick={() => navigate(stat.path)}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-full transition-transform hover:-translate-y-1 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bg} shrink-0`}>
                  <Icon size={20} className={stat.color} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-gray-800 dark:text-gray-100 tracking-tight">{stat.value}</h3>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">{stat.label}</p>
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
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Current Active Job</h2>
                {activeJob?.status === 'PACKING_STARTED' && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Packing
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
                        <Package size={16} className="mr-2 text-green-600" />
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
                    onClick={() => navigate('/operator/active-packing')}
                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center"
                  >
                    Resume Packing <ArrowRight size={18} className="ml-2" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-full mb-4">
                    <Package size={48} className="text-gray-300 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">No active packing job.</p>
                  <button 
                    onClick={() => navigate('/operator/jobs')}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm active:scale-95"
                  >
                    View Assigned Jobs
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
                onClick={() => navigate('/operator/active-packing')}
                className="w-full flex items-center p-4 bg-slate-50 dark:bg-gray-900 rounded-xl hover:bg-green-50 hover:text-green-700 transition-colors border border-slate-100 dark:border-gray-700 hover:border-green-200 group"
              >
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm mr-3 group-hover:bg-green-100 text-gray-600 group-hover:text-green-600">
                  <Play size={20} />
                </div>
                <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-green-700">Resume Packing</span>
              </button>
              
              <button 
                onClick={() => navigate('/operator/jobs')}
                className="w-full flex items-center p-4 bg-slate-50 dark:bg-gray-900 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors border border-slate-100 dark:border-gray-700 hover:border-blue-200 group"
              >
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm mr-3 group-hover:bg-blue-100 text-gray-600 group-hover:text-blue-600">
                  <Package size={20} />
                </div>
                <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-700">My Jobs</span>
              </button>
              
              <button 
                onClick={() => navigate('/operator/report-issue')}
                className="w-full flex items-center p-4 bg-slate-50 dark:bg-gray-900 rounded-xl hover:bg-red-50 hover:text-red-700 transition-colors border border-slate-100 dark:border-gray-700 hover:border-red-200 group"
              >
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm mr-3 group-hover:bg-red-100 text-gray-600 group-hover:text-red-600">
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
