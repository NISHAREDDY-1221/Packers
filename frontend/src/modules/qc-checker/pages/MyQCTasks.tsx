import React, { useEffect, useState } from 'react';
import { Clock, Filter, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { qcTasksService } from '../services/qcTasksService';
import type { QCInspection } from '../../../shared/types';

export const MyQCTasks: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pending' | 'ready' | 'in-progress'>('ready');
  const [tasks, setTasks] = useState<QCInspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await qcTasksService.getWorkOrders();
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTasks = () => {
    // Modify based on real QC statuses
    switch(activeTab) {
      case 'ready': return tasks.filter(t => t.status === 'QC_PENDING');
      case 'in-progress': return tasks.filter(t => t.status === 'QC_PENDING'); // If in progress QC exists
      case 'pending': return tasks.filter(t => t.status !== 'QC_PENDING' && t.status !== 'QC_PASSED'); // E.g., still packing
      default: return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  const handleStartQC = async (_id: string) => {
    // Assuming status changes to something like 'QC_IN_PROGRESS' in real app.
    // For now, just navigate.
    navigate('/qc/active-inspection');
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
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">My QC Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Manage and perform your assigned quality checks</p>
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
          Ready for QC
          <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] rounded-full ${
            activeTab === 'ready' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
          }`}>
            {tasks.filter(t => t.status === 'QC_PENDING').length}
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
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{task.woNumber}</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
                    <PackageCheck size={16} className="mr-2 text-gray-400" />
                    {task.product?.name || 'Product'} 
                    <span className="text-gray-400 mx-2">•</span> 
                    SKU: {task.product?.sku || 'N/A'}
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                      <Clock size={14} className="text-gray-400 mr-1.5" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                        {new Date(task.startedAt || task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col gap-3 justify-end md:w-40 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-4 md:pt-0 md:pl-5">
                  <button 
                    onClick={() => handleStartQC(task.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center"
                  >
                    Start QC
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-full mb-4">
            <PackageCheck size={48} className="text-gray-300 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">No Tasks Found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm font-medium">
            There are currently no tasks in this category. Check back later.
          </p>
        </div>
      )}
    </div>
  );
};
