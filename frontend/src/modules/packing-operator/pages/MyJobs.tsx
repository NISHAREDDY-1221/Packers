import React, { useEffect, useState } from 'react';
import { Package, Clock, Filter, AlertTriangle, Play, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { packingJobsService } from '../services/packingJobsService';
import type { PackingJob } from '../../../shared/types';
import toast from 'react-hot-toast';
export const MyJobs: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'ready' | 'in-progress' | 'labels'>('ready');
  const [tasks, setTasks] = useState<PackingJob[]>([]);
  const [loading, setLoading] = useState(true);

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelJobId, setLabelJobId] = useState('');
  const [labelsApplied, setLabelsApplied] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await packingJobsService.getWorkOrders();
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTasks = () => {
    switch(activeTab) {
      case 'pending': return tasks.filter(t => ['APPROVED'].includes(t.status));
      case 'ready': return tasks.filter(t => t.status === 'MATERIAL_ISSUED');
      case 'in-progress': return tasks.filter(t => t.status === 'PACKING_STARTED');
      case 'labels': return tasks.filter(t => ['LABEL_APPLICATION_ASSIGNED', 'LABEL_APPLICATION_IN_PROGRESS'].includes(t.status));
      default: return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  const handleStartPacking = async (id: string) => {
    try {
      await packingJobsService.startPacking(id);
      navigate('/operator/active-packing');
    } catch (error) {
      console.error('Error starting packing', error);
      toast.error('Failed to start packing job. Please try again.');
    }
  };

  const handleResumePacking = () => {
    navigate('/operator/active-packing');
  };

  const handleStartLabeling = async (id: string) => {
    try {
      await packingJobsService.updateWorkOrderStatus(id, 'LABEL_APPLICATION_IN_PROGRESS');
      fetchTasks();
    } catch (error) {
      console.error('Error starting labeling', error);
      toast.error('Failed to start labeling. Please try again.');
    }
  };

  const handleCompleteLabeling = async (id: string) => {
    setLabelJobId(id);
    setLabelsApplied('');
    setLabelModalOpen(true);
  };

  const submitLabelsApplied = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(labelsApplied, 10);
    if (isNaN(num) || num < 0) {
      toast.error('Please enter a valid positive number.');
      return;
    }
    try {
      await packingJobsService.updateWorkOrderStatus(labelJobId, 'LABELS_APPLIED', { labelsApplied: num } as any);
      fetchTasks();
      setLabelModalOpen(false);
      toast.success('Labels successfully recorded.');
    } catch (error) {
      console.error('Error completing labeling', error);
      toast.error('Failed to complete labeling.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'NORMAL': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">My Jobs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Manage and track your assigned packing jobs</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center text-sm font-semibold bg-slate-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors">
            <Filter size={16} className="mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex w-full md:w-fit overflow-x-auto">
        <button 
          onClick={() => setActiveTab('ready')}
          className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'ready' 
              ? 'bg-blue-50 text-blue-700 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Ready to Start
          <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full ${
            activeTab === 'ready' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
          }`}>
            {tasks.filter(t => t.status === 'MATERIAL_ISSUED').length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('in-progress')}
          className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'in-progress' 
              ? 'bg-orange-50 text-orange-700 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          In Progress
          <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full ${
            activeTab === 'in-progress' ? 'bg-orange-200 text-orange-800' : 'bg-gray-200 text-gray-600'
          }`}>
            {tasks.filter(t => t.status === 'PACKING_STARTED').length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'pending' 
              ? 'bg-gray-100 text-gray-800 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Pending (Not Ready)
          <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full ${
            activeTab === 'pending' ? 'bg-gray-300 text-gray-800' : 'bg-gray-200 text-gray-600'
          }`}>
            {tasks.filter(t => ['APPROVED'].includes(t.status)).length}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('labels')}
          className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'labels' 
              ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Label Application
          <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full ${
            activeTab === 'labels' ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-600'
          }`}>
            {tasks.filter(t => ['LABEL_APPLICATION_ASSIGNED', 'LABEL_APPLICATION_IN_PROGRESS'].includes(t.status)).length}
          </span>
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid gap-4">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
              {task.priority === 'URGENT' && (
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
              )}
              {task.status === 'PACKING_STARTED' && (
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
              )}
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{task.woNumber}</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.status === 'PACKING_STARTED' && (
                       <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                        Packing
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
                    <Package size={16} className="mr-2 text-gray-400" />
                    {task.product?.name || 'Product'} 
                    <span className="text-gray-400 mx-2">•</span> 
                    SKU: {task.product?.sku || 'N/A'}
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-2 uppercase">Target:</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{task.requiredQty} units</span>
                    </div>
                    {task.status === 'PACKING_STARTED' && (
                      <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-2 uppercase">Packed:</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{task.actualProduced || 0} units</span>
                      </div>
                    )}
                    <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      <Clock size={14} className="text-gray-400 mr-1.5" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        {new Date(task.startedAt || task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col gap-3 justify-end md:w-40 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-5">
                  {task.status === 'MATERIAL_ISSUED' && (
                    <button 
                      onClick={() => handleStartPacking(task.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center"
                    >
                      Start Packing
                    </button>
                  )}
                  {task.status === 'PACKING_STARTED' && (
                    <button 
                      onClick={handleResumePacking}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center"
                    >
                      <Play size={16} className="mr-1.5" /> Resume
                    </button>
                  )}
                  {task.status === 'PENDING' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <AlertTriangle size={16} className="text-gray-400 mb-1" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Awaiting Material</span>
                    </div>
                  )}
                  {task.status === 'LABEL_APPLICATION_ASSIGNED' && (
                    <button 
                      onClick={() => handleStartLabeling(task.id)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center"
                    >
                      Start Labeling
                    </button>
                  )}
                  {task.status === 'LABEL_APPLICATION_IN_PROGRESS' && (
                    <button 
                      onClick={() => handleCompleteLabeling(task.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center"
                    >
                      <CheckCircle size={16} className="mr-1.5" /> Complete Labels
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-full mb-4">
            <Package size={48} className="text-gray-300 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">No Tasks Found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm font-medium">
            There are currently no tasks in this category. Check back later or select a different tab.
          </p>
        </div>
      )}

      {/* Labeling Completion Modal */}
      {labelModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <CheckCircle size={18} className="text-[#00891D]" />
                Complete Labeling
              </h3>
              <button 
                onClick={() => setLabelModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={submitLabelsApplied} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Labels Successfully Applied *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00891D]/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                  value={labelsApplied}
                  onChange={(e) => setLabelsApplied(e.target.value)}
                  placeholder="Enter quantity..."
                  autoFocus
                />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setLabelModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00891D] hover:bg-[#007518] text-white rounded-lg font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
