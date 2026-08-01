import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { workOrderService } from '../../api/workOrderService';
import type { WorkOrder } from '../../api/workOrderService';
import { Package, AlertCircle, Play, Pause, CheckCircle, Plus, X, ListTodo } from 'lucide-react';
import { ActiveQCInspection } from './ActiveQCInspection';

export const ActivePacking: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeJob, setActiveJob] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = typeof user?.role === 'string' ? user?.role : (user?.role as any)?.name;
  const isQC = userRole === 'QC_INSPECTOR' || userRole === 'QC_CHECKER';

  if (isQC) {
    return <ActiveQCInspection />;
  }

  // Modals state
  const [showAddQuantity, setShowAddQuantity] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Input states
  const [addPacked, setAddPacked] = useState<number | ''>('');
  const [addRejected, setAddRejected] = useState<number | ''>('');
  const [pauseReason, setPauseReason] = useState('Break');

  const fetchActiveJob = async () => {
    try {
      const response = await workOrderService.getWorkOrders();
      const job = response.data.find((wo) => wo.status === 'PACKING_STARTED' || (wo.status as any) === 'PACKING_IN_PROGRESS');
      setActiveJob(job || null);
    } catch (err) {
      console.error('Failed to fetch active job', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveJob();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!activeJob) {
    return (
      <div className="flex flex-col items-center justify-center p-10 mt-10 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-lg mx-auto">
        <Package className="text-gray-300 mb-4" size={64} />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No active packing job.</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">Start a job from My Jobs to begin packing.</p>
        <button 
          onClick={() => navigate('/operator/jobs')}
          className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 active:scale-95 transition-all flex items-center shadow-sm"
        >
          <ListTodo size={20} className="mr-2" />
          View My Jobs
        </button>
      </div>
    );
  }

  // Calculations
  const requiredQty = activeJob.requiredQty || 0;
  const packedQty = activeJob.actualProduced || 0;
  const rejectedQty = activeJob.actualRejected || 0;
  const remainingQty = Math.max(0, requiredQty - packedQty - rejectedQty);
  const completionPercentage = requiredQty > 0 ? Math.min(100, Math.round((packedQty / requiredQty) * 100)) : 0;
  const isHighPriority = activeJob.priority === 'HIGH' || activeJob.priority === 'URGENT';

  // SLA Calculation
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

  const handleUpdateQuantity = async () => {
    const inputPacked = Number(addPacked) || 0;
    const inputRejected = Number(addRejected) || 0;
    if (inputPacked < 0 || inputRejected < 0) return alert('Cannot add negative quantities');
    
    // Determine target cumulative produced & rejected:
    // If input quantity is >= current packedQty or equals requiredQty, treat as cumulative total target; otherwise treat as incremental amount to add.
    let targetPacked = (inputPacked >= packedQty || inputPacked === requiredQty) ? inputPacked : packedQty + inputPacked;
    let targetRejected = (inputRejected >= rejectedQty) ? inputRejected : rejectedQty + inputRejected;

    if (inputPacked === requiredQty) {
      targetPacked = requiredQty;
    }

    const totalNew = targetPacked + targetRejected;
    if (totalNew > requiredQty) {
      return alert(`Total produced + rejected quantity (${totalNew}) cannot exceed required quantity (${requiredQty}). Current packed: ${packedQty}, remaining capacity to add: ${Math.max(0, requiredQty - packedQty - rejectedQty)}.`);
    }

    try {
      await workOrderService.updateQuantity(activeJob.id, {
        actualProduced: targetPacked,
        actualRejected: targetRejected
      });
      setAddPacked('');
      setAddRejected('');
      setShowAddQuantity(false);
      fetchActiveJob(); // Refresh
    } catch (e: any) {
      alert(e.message || 'Failed to update quantity');
    }
  };

  const handlePause = async () => {
    try {
      await workOrderService.pausePacking(activeJob.id, pauseReason);
      setShowPauseModal(false);
      fetchActiveJob();
    } catch (e: any) {
      alert(e.message || 'Failed to pause');
    }
  };

  const handleResume = async () => {
    try {
      await workOrderService.resumePacking(activeJob.id);
      fetchActiveJob();
    } catch (e: any) {
      alert(e.message || 'Failed to resume');
    }
  };

  const handleComplete = async () => {
    try {
      await workOrderService.completePacking(activeJob.id);
      setShowCompleteModal(false);
      navigate('/operator/jobs'); // Or a success screen
    } catch (e: any) {
      alert(e.message || 'Failed to complete packing');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Active Packing</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Continue and complete your current packing job.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Work Order Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            {isHighPriority && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                {activeJob.priority} PRIORITY
              </div>
            )}
            {activeJob.isPaused && (
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                PAUSED
              </div>
            )}

            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-xl ${activeJob.isPaused ? 'bg-orange-100' : 'bg-purple-100'}`}>
                <Package className={activeJob.isPaused ? 'text-orange-600' : 'text-purple-600'} size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{activeJob.woNumber}</h2>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{activeJob.product?.name || 'Product Name'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">SKU: {activeJob.product?.sku || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2 bg-slate-50 dark:bg-gray-900 p-4 rounded-xl border border-slate-100 dark:border-gray-700">
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">Batch Number</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{activeJob.batchNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">Recipe / BOM</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{activeJob.recipe?.name || 'Standard'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">Status</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{activeJob.isPaused ? 'PAUSED' : activeJob.status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">Warehouse</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{(user as any)?.warehouse?.name || 'Hyderabad'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">Started At</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{activeJob.startedAt ? new Date(activeJob.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">SLA Remaining</p>
                <p className={`text-sm font-bold ${slaRisk ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}`}>{slaText}</p>
              </div>
            </div>
          </div>

          {/* Progress & Quantities */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-end mb-2">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">Progress</h3>
              <span className="text-sm font-bold text-green-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
              <div className="bg-green-500 h-3 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Required</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{requiredQty}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs text-green-700 font-medium mb-1">Packed</p>
                <p className="text-lg font-bold text-green-700">{packedQty}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs text-red-700 font-medium mb-1">Rejected</p>
                <p className="text-lg font-bold text-red-700">{rejectedQty}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-700 font-medium mb-1">Remaining</p>
                <p className="text-lg font-bold text-orange-700">{remainingQty}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">Packing Actions</h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowAddQuantity(true)}
                disabled={activeJob.isPaused || remainingQty === 0}
                className="w-full flex justify-center items-center p-3 rounded-xl font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={18} className="mr-2" />
                Update Quantities
              </button>

              {activeJob.isPaused ? (
                <button 
                  onClick={handleResume}
                  className="w-full flex justify-center items-center p-3 rounded-xl font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <Play size={18} className="mr-2" />
                  Resume Packing
                </button>
              ) : (
                <button 
                  onClick={() => setShowPauseModal(true)}
                  disabled={remainingQty === 0}
                  className="w-full flex justify-center items-center p-3 rounded-xl font-bold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Pause size={18} className="mr-2" />
                  Pause Packing
                </button>
              )}

              <button 
                onClick={() => navigate('/operator/report-issue', { state: { woId: activeJob.id, woText: `${activeJob.woNumber} - ${activeJob.product?.name}` } })}
                className="w-full flex justify-center items-center p-3 rounded-xl font-bold bg-slate-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 hover:bg-slate-100 transition-colors"
              >
                <AlertCircle size={18} className="mr-2" />
                Report Issue
              </button>

              <button 
                onClick={() => setShowCompleteModal(true)}
                disabled={remainingQty > 0 || activeJob.isPaused}
                className="w-full flex justify-center items-center p-3 mt-4 rounded-xl font-bold bg-green-600 text-white shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle size={18} className="mr-2" />
                Complete Packing
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">Instructions</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-disc list-inside">
              <li>Ensure all items are scanned before placing in the box.</li>
              <li>Verify the batch number matches the physical labels.</li>
              <li>Discard damaged materials in the designated red bin.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Quantity Modal */}
      {showAddQuantity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-gray-900">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">Update Quantities</h3>
              <button onClick={() => setShowAddQuantity(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-300"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Add Packed Quantity</label>
                <input 
                  type="number" min="0" 
                  value={addPacked} onChange={(e) => setAddPacked(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-1 focus:ring-green-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Add Rejected Quantity</label>
                <input 
                  type="number" min="0"
                  value={addRejected} onChange={(e) => setAddRejected(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-1 focus:ring-red-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 border border-blue-100">
                <AlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-800">Remaining quantity allowed to add: <span className="font-bold">{remainingQty}</span></p>
              </div>
              <button onClick={handleUpdateQuantity} className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors">
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-gray-900">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">Pause Packing</h3>
              <button onClick={() => setShowPauseModal(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-300"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Reason for pausing</label>
                <select 
                  value={pauseReason} onChange={(e) => setPauseReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white dark:bg-gray-800"
                >
                  <option>Break</option>
                  <option>Material Shortage</option>
                  <option>Machine Issue</option>
                  <option>Supervisor Instruction</option>
                  <option>Other</option>
                </select>
              </div>
              <button onClick={handlePause} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors">
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Confirmation Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Complete Packing?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">You are about to complete WO <strong>{activeJob.woNumber}</strong> and send it for final QC / Labelling.</p>
              
              <div className="w-full bg-slate-50 dark:bg-gray-900 rounded-xl p-4 mb-6 text-left border border-slate-100 dark:border-gray-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Packed</span>
                  <span className="font-bold text-green-700">{packedQty}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Rejected</span>
                  <span className="font-bold text-red-700">{rejectedQty}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-200 dark:border-gray-700 pt-2 mt-1">
                  <span className="text-gray-500 dark:text-gray-400">Completion</span>
                  <span className="font-bold text-gray-800 dark:text-gray-100">100%</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button onClick={() => setShowCompleteModal(false)} className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleComplete} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
