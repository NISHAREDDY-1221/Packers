import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, CheckCircle, AlertCircle, Clock, ListTodo, AlertTriangle, PackageCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { workOrderService } from '../../api/workOrderService';
import type { WorkOrder } from '../../api/workOrderService';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  const QC_STATUSES = ['PACKING_COMPLETED', 'LABEL_APPLICATION_ASSIGNED', 'LABEL_APPLICATION_IN_PROGRESS', 'LABELS_APPLIED', 'QC_PENDING'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await workOrderService.getWorkOrders({ limit: 500 });
        setWorkOrders(response.data || []);
      } catch (err) {
        console.error('Failed to fetch work orders for dashboard', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const userRole = typeof user?.role === 'string' ? user?.role : (user?.role as any)?.name;
  const isQC = userRole === 'QC' || userRole === 'QC_INSPECTOR' || userRole === 'QC_CHECKER';

  let stats: any[] = [];
  const today = new Date().toISOString().split('T')[0];

  if (isQC) {
    const pendingInspection = workOrders.filter(wo => wo.status === 'QC_PENDING').length;
    const readyForQC = workOrders.filter(wo => ['PACKING_COMPLETED', 'LABELS_APPLIED', 'QC_PENDING'].includes(wo.status)).length;
    const qcInProgress = workOrders.filter(wo => wo.status === 'QC_IN_PROGRESS' as any).length;
    const passedToday = workOrders.filter(wo => 
      wo.status === 'QC_PASSED' && (wo.completedAt?.startsWith(today) || wo.updatedAt?.startsWith(today))
    ).length;
    const failedToday = workOrders.filter(wo => 
      ((wo.status as any) === 'QC_REWORK' || (wo.status as any) === 'REJECTED') && (wo.completedAt?.startsWith(today) || wo.updatedAt?.startsWith(today))
    ).length;
    const issuesReported = 0; // Hardcoded

    stats = [
      { label: 'Pending Inspection', value: pendingInspection || 0, icon: ListTodo, color: 'text-blue-500', bg: 'bg-blue-100', path: '/operator/jobs?filter=pending' },
      { label: 'Ready for QC', value: readyForQC || 0, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100', path: '/operator/jobs?filter=ready' },
      { label: 'QC In Progress', value: qcInProgress || 0, icon: Package, color: 'text-purple-500', bg: 'bg-purple-100', path: '/operator/active-packing' },
      { label: 'Passed Today', value: passedToday || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', path: '/operator/history?filter=today' },
      { label: 'Failed Today', value: failedToday || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', path: '/operator/jobs?filter=delayed' },
      { label: 'Issues Reported', value: issuesReported || 0, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', path: '/operator/report-issue' },
    ];
  } else {
    // Packing Operator metrics
    const pendingJobs = workOrders.filter(wo => ['DRAFT', 'PENDING', 'APPROVED'].includes(wo.status)).length;
    const readyToStart = workOrders.filter(wo => wo.status === 'MATERIAL_ISSUED').length;
    const packingInProgress = workOrders.filter(wo => wo.status === 'PACKING_STARTED' || wo.status === 'PACKING_IN_PROGRESS' as any).length;
    const completedToday = workOrders.filter(wo => 
      wo.status === 'COMPLETED' && (wo.completedAt?.startsWith(today) || wo.updatedAt?.startsWith(today))
    ).length;
    const delayedJobs = workOrders.filter(wo => 
      wo.expectedDate && wo.expectedDate < today && wo.status !== 'COMPLETED'
    ).length;
    const issuesReported = 0; // Hardcoded until backend API is available

    stats = [
      { label: 'Pending Jobs', value: pendingJobs || 0, icon: ListTodo, color: 'text-blue-500', bg: 'bg-blue-100', path: '/operator/jobs?filter=pending' },
      { label: 'Ready to Start', value: readyToStart || 0, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100', path: '/operator/jobs?filter=ready' },
      { label: 'Packing In Progress', value: packingInProgress || 0, icon: Package, color: 'text-purple-500', bg: 'bg-purple-100', path: '/operator/active-packing' },
      { label: 'Completed Today', value: completedToday || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', path: '/operator/history?filter=today' },
      { label: 'Delayed Jobs', value: delayedJobs || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', path: '/operator/jobs?filter=delayed' },
      { label: 'Issues Reported', value: issuesReported || 0, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100', path: '/operator/report-issue' },
    ];
  }

  return (
    <div className="space-y-6">
      <>
        <div className="space-y-5">
          {/* Quick Alert */}
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            const slaRiskJobs = workOrders.filter(wo => wo.expectedDate && wo.expectedDate <= today && wo.status !== 'COMPLETED');
            
            if (slaRiskJobs.length > 0) {
              return (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-3 shadow-sm">
                  <div className="mt-0.5 text-red-500">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-red-800">SLA Risk Detected</h4>
                    <p className="text-xs text-red-600 mt-0.5">You have {slaRiskJobs.length} job(s) at risk of missing SLA today.</p>
                  </div>
                  {slaRiskJobs.length > 1 && (
                    <button className="text-xs font-bold text-red-700 whitespace-nowrap active:opacity-70">
                      View All
                    </button>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* 6 Primary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={idx} 
                  onClick={() => stat.path && navigate(stat.path)}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-h-[90px] ${stat.path ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight pr-2">{stat.label}</span>
                    <div className={`p-1.5 rounded-lg ${stat.bg} shrink-0`}>
                      <Icon className={stat.color} size={16} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Current Active Job / QC Task Unified View */}
          <div className="pt-2">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 uppercase tracking-wider">{isQC ? 'Current QC Task' : 'New jobs'}</h2>
            {(() => {
              const activeJobs = isQC 
                ? workOrders.filter(wo => wo.status === 'QC_IN_PROGRESS' || (wo.status as any) === 'LABEL_APPLICATION_IN_PROGRESS')
                : workOrders.filter(wo => wo.status === 'PACKING_STARTED' || wo.status === 'MATERIAL_ISSUED');
              const activeJob = isQC 
                ? (activeJobs.find(wo => wo.status === 'QC_IN_PROGRESS') || activeJobs.find(wo => (wo.status as any) === 'LABEL_APPLICATION_IN_PROGRESS'))
                : (activeJobs.find(wo => wo.status === 'PACKING_STARTED') || activeJobs.find(wo => wo.status === 'MATERIAL_ISSUED'));

              if (!activeJob) {
                return (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                    <Package className="mx-auto text-gray-300 mb-2 md:mb-3" size={40} />
                    <h3 className="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-200">{isQC ? 'No active QC inspection.' : 'No active packing job.'}</h3>
                    <button className="mt-4 bg-green-50 text-green-600 px-6 py-2.5 rounded-xl text-sm font-bold active:bg-green-100 transition-colors">
                      {isQC ? 'View Assigned QC Tasks' : 'View Assigned Jobs'}
                    </button>
                  </div>
                );
              }

              const packedQty = activeJob.actualProduced || 0;
              const remainingQty = Math.max(0, activeJob.requiredQty - packedQty);
              const progress = Math.min(100, Math.round((packedQty / activeJob.requiredQty) * 100)) || 0;
              const isHighPriority = activeJob.priority === 'HIGH' || activeJob.priority === 'URGENT';
              
              const expected = activeJob.expectedDate ? new Date(activeJob.expectedDate).getTime() : 0;
              const now = new Date().getTime();
              let slaText = 'N/A';
              let slaRisk = false;
              if (expected > 0) {
                const diffHours = (expected - now) / (1000 * 60 * 60);
                if (diffHours < 0) {
                  slaText = 'Overdue';
                  slaRisk = true;
                } else if (diffHours < 24) {
                  slaText = `${Math.floor(diffHours)}h left`;
                  slaRisk = true;
                } else {
                  slaText = `${Math.floor(diffHours / 24)}d left`;
                }
              }

              return (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                  {isHighPriority && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-bl-lg">
                      HIGH PRIORITY
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 leading-none">{activeJob.woNumber}</h3>
                        <span className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full ${activeJob.status === 'PACKING_STARTED' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {activeJob.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-0.5">{activeJob.product?.name || 'Unknown Product'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Size: Standard Pack | Batch: {activeJob.batchNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 dark:bg-gray-900 p-2.5 md:p-4 rounded-xl border border-slate-100 dark:border-gray-700">
                    <div>
                      <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Packed</p>
                      <p className="font-bold text-green-600 text-sm md:text-base">{packedQty} <span className="text-xs text-gray-400 font-normal">/ {activeJob.requiredQty}</span></p>
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Remaining</p>
                      <p className="font-bold text-orange-500 text-sm md:text-base">{remainingQty}</p>
                    </div>
                    <div>
                      <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mb-0.5">SLA</p>
                      <p className={`font-bold text-sm md:text-base flex items-center ${slaRisk ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}`}>
                        <Clock size={12} className="mr-1 hidden md:block" /> {slaText}
                      </p>
                    </div>
                  </div>

                  <div className="mb-5 md:mb-6">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] md:text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase md:normal-case">Progress</span>
                      <span className="text-xs md:text-sm font-bold text-green-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 md:h-2.5">
                      <div className="bg-green-500 h-2 md:h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  <div className="flex gap-2 md:gap-3">
                    {activeJob.status === 'MATERIAL_ISSUED' ? (
                      <button className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-sm active:bg-blue-700 transition-colors">
                        Start Packing
                      </button>
                    ) : (
                      <button className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-sm active:bg-green-700 transition-colors">
                        Resume Packing
                      </button>
                    )}
                    <button className="flex-none bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm active:bg-gray-50 transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Quick Actions */}
          <div className="pt-2">
            <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 uppercase tracking-wider">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => navigate('/operator/active-packing')}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all active:scale-95"
              >
                <div className="bg-green-50 text-green-600 p-2.5 rounded-xl">
                  {isQC ? <PackageCheck size={24} /> : <Package size={24} />}
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">Resume<br/>{isQC ? 'QC' : 'Packing'}</span>
              </button>
              
              <button 
                onClick={() => navigate('/operator/jobs')}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all active:scale-95"
              >
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
                  <ListTodo size={24} />
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">My<br/>{isQC ? 'QC Tasks' : 'Jobs'}</span>
              </button>
              
              <button 
                onClick={() => navigate('/operator/report-issue')}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-all active:scale-95"
              >
                <div className="bg-red-50 text-red-600 p-2.5 rounded-xl">
                  <AlertTriangle size={24} />
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">Report<br/>Issue</span>
              </button>
            </div>
          </div>

        </div>
      </>
    </div>
  );
};
