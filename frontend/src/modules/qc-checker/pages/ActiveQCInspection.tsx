import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { qcTasksService } from '../services/qcTasksService';
import type { QCInspection } from '../../../shared/types';
import { Package, AlertCircle, CheckCircle, ListTodo, Camera, X, Image as ImageIcon, Check, XCircle } from 'lucide-react';
import apiClient from '../../../api/axios';

import toast from 'react-hot-toast';

interface QcChecklist {
  id: string;
  label: string;
  required: boolean;
}

interface ChecklistState {
  status: 'PASS' | 'FAIL' | null;
  remarks: string;
}

export const ActiveQCInspection: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeJob, setActiveJob] = useState<QCInspection | null>(null);
  const [loading, setLoading] = useState(true);

  // QC Specific state
  const [checklists, setChecklists] = useState<QcChecklist[]>([]);
  const [checksState, setChecksState] = useState<Record<string, ChecklistState>>({});
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modals state
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const QC_STATUSES = ['PACKING_COMPLETED', 'LABEL_APPLICATION_ASSIGNED', 'LABEL_APPLICATION_IN_PROGRESS', 'LABELS_APPLIED', 'QC_PENDING', 'QC_IN_PROGRESS'];

  const fetchActiveJob = async () => {
    try {
      const response = await qcTasksService.getWorkOrders();
      const orders = response.data || [];
      const job = orders.find((wo) => wo.status === 'QC_IN_PROGRESS') || orders.find((wo) => QC_STATUSES.includes(wo.status));
      
      if (job && job.status !== 'QC_IN_PROGRESS') {
        try {
          await qcTasksService.updateWorkOrderStatus(job.id, 'QC_IN_PROGRESS');
          job.status = 'QC_IN_PROGRESS';
        } catch (e) {
          console.error('Failed to update status to QC_IN_PROGRESS', e);
        }
      }
      
      setActiveJob(job || null);
    } catch (err) {
      console.error('Failed to fetch active job', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklists = async () => {
    try {
      const res = await apiClient.get('/workflows/qc-checklists');
      const data: QcChecklist[] = res.data.data;
      setChecklists(data);
      // Initialize states
      const initial: Record<string, ChecklistState> = {};
      data.forEach(c => {
        initial[c.id] = { status: null, remarks: '' };
      });
      setChecksState(initial);
    } catch (e) {
      console.error('Failed to fetch checklists', e);
    }
  };

  useEffect(() => {
    fetchActiveJob();
    fetchChecklists();
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
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">No active QC inspection.</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">Start an inspection from My QC Tasks to begin.</p>
        <button 
          onClick={() => navigate('/qc/tasks')}
          className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 active:scale-95 transition-all flex items-center shadow-sm"
        >
          <ListTodo size={20} className="mr-2" />
          View Assigned QC Tasks
        </button>
      </div>
    );
  }

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

  // Progress Calculations
  const totalItems = checklists.length;
  const itemsInspected = Object.values(checksState).filter(c => c.status !== null).length;
  const passedItems = Object.values(checksState).filter(c => c.status === 'PASS').length;
  const failedItems = Object.values(checksState).filter(c => c.status === 'FAIL').length;
  const remainingItems = totalItems - itemsInspected;
  const completionPercentage = totalItems > 0 ? Math.min(100, Math.round((itemsInspected / totalItems) * 100)) : 0;

  // Handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const newPhotos = newFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleCheck = (id: string, status: 'PASS' | 'FAIL') => {
    setChecksState(prev => ({
      ...prev,
      [id]: { ...prev[id], status }
    }));
  };

  const handleRemarkChange = (id: string, text: string) => {
    setChecksState(prev => ({
      ...prev,
      [id]: { ...prev[id], remarks: text }
    }));
  };

  const saveProgress = () => {
    // We can simply persist local state or send to backend if we had an intermediate save API
    toast.success('Progress saved locally.');
  };

  const validateCompletion = () => {
    for (const check of checklists) {
      const state = checksState[check.id];
      if (check.required && state.status === null) {
        toast.error(`Mandatory check "${check.label}" is missing.`);
        return false;
      }
      if (state.status === 'FAIL' && !state.remarks.trim()) {
        toast.error(`Remarks are required for failed check "${check.label}".`);
        return false;
      }
    }
    return true;
  };

  const handleComplete = async () => {
    try {
      // Create photos payload (simulated base64 or just URLs for now)
      const photoPayload = photos.map(p => p.file.name); 

      // Submit Quality Check
      const payload = {
        woId: activeJob.id,
        checkedQty: Math.max(1, activeJob.actualProduced || activeJob.requiredQty || 1),
        result: failedItems > 0 ? 'REWORK' : 'PASS',
        severity: failedItems > 0 ? 'MAJOR' : undefined,
        failureReason: failedItems > 0 ? 'Failed QC Checkpoints' : undefined,
        remarks: 'Submitted from App',
        checksPayload: checksState,
        photoUrls: photoPayload // We simulate passing photo names
      };

      await apiClient.post('/workflows/quality-checks', payload);

      setShowCompleteModal(false);
      toast.success('QC Inspection completed successfully.');
      navigate('/qc/tasks');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to complete inspection';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Active QC Inspection</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Perform and complete the assigned quality inspection.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Inspection Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
            {isHighPriority && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                {activeJob.priority} PRIORITY
              </div>
            )}

            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <CheckCircle className="text-purple-600" size={28} />
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
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">Inspection Type</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Standard QC</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">Status</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Inspecting</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">Warehouse</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{(user as any)?.warehouse?.name || 'Hyderabad'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">Started At</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{activeJob.startedAt ? new Date(activeJob.startedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">SLA Remaining</p>
                <p className={`text-sm font-bold ${slaRisk ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}`}>{slaText}</p>
              </div>
            </div>
          </div>

          {/* Inspection Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-end mb-2">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">Inspection Progress</h3>
              <span className="text-sm font-bold text-green-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
              <div className="bg-green-500 h-3 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-gray-900 rounded-xl border border-slate-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{totalItems}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700 font-medium mb-1">Inspected</p>
                <p className="text-lg font-bold text-blue-700">{itemsInspected}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs text-green-700 font-medium mb-1">Passed</p>
                <p className="text-lg font-bold text-green-700">{passedItems}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs text-red-700 font-medium mb-1">Failed</p>
                <p className="text-lg font-bold text-red-700">{failedItems}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                <p className="text-xs text-orange-700 font-medium mb-1">Remaining</p>
                <p className="text-lg font-bold text-orange-700">{remainingItems}</p>
              </div>
            </div>
          </div>

          {/* QC Checklist */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">QC Checklist</h3>
            <div className="space-y-4">
              {checklists.map(check => {
                const state = checksState[check.id];
                const isPassed = state?.status === 'PASS';
                const isFailed = state?.status === 'FAIL';

                return (
                  <div key={check.id} className="bg-slate-50 dark:bg-gray-900 rounded-xl p-4 border border-slate-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          {check.label}
                          {check.required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCheck(check.id, 'PASS')}
                          className={`flex-1 md:flex-none flex items-center justify-center px-4 py-2 rounded-lg font-bold transition-colors ${
                            isPassed 
                            ? 'bg-green-600 text-white' 
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                          }`}
                        >
                          <Check size={16} className="mr-1.5" /> Pass
                        </button>
                        <button 
                          onClick={() => handleCheck(check.id, 'FAIL')}
                          className={`flex-1 md:flex-none flex items-center justify-center px-4 py-2 rounded-lg font-bold transition-colors ${
                            isFailed 
                            ? 'bg-red-600 text-white' 
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                          }`}
                        >
                          <XCircle size={16} className="mr-1.5" /> Fail
                        </button>
                      </div>
                    </div>
                    
                    {(isPassed || isFailed) && (
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder={isFailed ? "Remarks (Required for failed checks)" : "Remarks (Optional)"}
                          value={state.remarks}
                          onChange={(e) => handleRemarkChange(check.id, e.target.value)}
                          className={`w-full text-sm border rounded-lg p-2 focus:outline-none focus:ring-1 ${isFailed && !state.remarks.trim() ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'} dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200`}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Photo Evidence */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">Photo Evidence</h3>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-sm flex items-center text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Camera size={16} className="mr-1.5" />
                Capture / Upload
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                multiple 
                className="hidden" 
                onChange={handlePhotoUpload}
              />
            </div>
            
            {photos.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400">
                <ImageIcon size={40} className="mb-2" />
                <p className="text-sm font-medium">No photos added yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square bg-gray-100 rounded-xl border border-gray-200 overflow-hidden group">
                    <img src={photo.preview} alt={`Evidence ${idx+1}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removePhoto(idx)}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <textarea 
                placeholder="Additional overall remarks (optional)..."
                className="w-full text-sm border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 min-h-[80px]"
              />
            </div>
          </div>

        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">Actions</h3>
            
            <div className="space-y-3">
              <button 
                onClick={saveProgress}
                className="w-full flex justify-center items-center p-3 rounded-xl font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                Save Progress
              </button>

              <button 
                onClick={() => navigate('/qc/report-issue', { state: { woId: activeJob.id, woText: `${activeJob.woNumber} - ${activeJob.product?.name}` } })}
                className="w-full flex justify-center items-center p-3 rounded-xl font-bold bg-slate-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-slate-200 dark:border-gray-700 hover:bg-slate-100 transition-colors"
              >
                <AlertCircle size={18} className="mr-2" />
                Report Issue
              </button>

              <button 
                onClick={() => {
                  if (validateCompletion()) {
                    setShowCompleteModal(true);
                  }
                }}
                className="w-full flex justify-center items-center p-3 mt-4 rounded-xl font-bold bg-green-600 text-white shadow-sm hover:bg-green-700 transition-colors"
              >
                <CheckCircle size={18} className="mr-2" />
                Complete Inspection
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 pb-3 mb-4">Instructions</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-disc list-inside">
              <li>Review all checklist items carefully.</li>
              <li>Attach photo evidence for any rejected criteria.</li>
              <li>Remarks are mandatory for failed items.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Complete Confirmation Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-5 flex flex-col items-center text-center">
              <div className={`w-16 h-16 ${failedItems > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'} rounded-full flex items-center justify-center mb-4`}>
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Complete Inspection?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">You are about to complete the QC inspection for WO <strong>{activeJob.woNumber}</strong>.</p>
              
              <div className="w-full bg-slate-50 dark:bg-gray-900 rounded-xl p-4 mb-6 text-left border border-slate-100 dark:border-gray-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total Checks</span>
                  <span className="font-bold text-gray-800 dark:text-gray-100">{totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Passed</span>
                  <span className="font-bold text-green-700">{passedItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Failed</span>
                  <span className="font-bold text-red-700">{failedItems}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button onClick={() => setShowCompleteModal(false)} className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleComplete} className={`flex-1 ${failedItems > 0 ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white font-bold py-3 rounded-xl`}>
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
