import React, { useEffect, useState } from 'react';
import { Package, Search, ChevronRight, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { workOrderService } from '../../api/workOrderService';

export const AssignedTasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, we would fetch only the assigned tasks based on role.
    // For now, we fetch all work orders (which the backend will scope for us based on role).
    const fetchTasks = async () => {
      try {
        const response = await workOrderService.getWorkOrders();
        setTasks(response.data);
      } catch (err) {
        console.error('Failed to fetch tasks', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700 dark:text-gray-200';
      case 'QC_PENDING': return 'bg-purple-100 text-purple-700';
      case 'PACKING_STARTED': return 'bg-green-100 text-green-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="space-y-4 font-sans pb-4">
      <div className="sticky top-0 bg-slate-50 dark:bg-gray-900 pt-2 pb-4 z-10">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Assigned Tasks</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your pending workload.</p>
        
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by WO or Batch..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
            />
          </div>
          <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:bg-gray-50 transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm mt-8">
          <Package className="mx-auto text-gray-300 mb-3" size={48} />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">All Caught Up!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">You have no pending tasks assigned at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-[0.98] transition-transform flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">{task.woNumber}</h3>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{task.product?.name || 'Unknown Product'}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex justify-between items-end mt-auto pt-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>Target Qty: <span className="font-semibold text-gray-700 dark:text-gray-200">{task.requiredQty}</span></p>
                  {task.batchNumber && <p>Batch: <span className="font-semibold text-gray-700 dark:text-gray-200">{task.batchNumber}</span></p>}
                </div>
                <button 
                  onClick={() => navigate(`/operator/jobs/${task.id}`)}
                  className="flex items-center text-sm font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg active:bg-green-100 transition-colors"
                >
                  Action <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
