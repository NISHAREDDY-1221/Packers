import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { workOrderService } from '../../api/workOrderService';
import type { WoStatus } from '../../api/workOrderService';
import { ArrowLeft, CheckCircle, ScanBarcode, CheckSquare, Square } from 'lucide-react';

export const TaskExecution: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // QC State
  const [qcPass, setQcPass] = useState<boolean | null>(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const response = await workOrderService.getWorkOrders();
        const found = response.data.find((wo: any) => wo.id === id);
        setTask(found);
      } catch (err) {
        console.error('Failed to fetch task', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTask();
  }, [id]);

  const handleAction = async (status: WoStatus) => {
    try {
      await workOrderService.updateWorkOrderStatus(id!, status);
      navigate('/staff/tasks');
    } catch (err) {
      alert('Failed to update task');
    }
  };

  const handleQcSubmit = async () => {
    try {
      const status: WoStatus = qcPass ? 'QC_PASSED' : 'CANCELLED'; // Using CANCELLED as a mock for fail
      await workOrderService.updateWorkOrderStatus(id!, status);
      navigate('/staff/tasks');
    } catch (err) {
      alert('Failed to submit QC');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!task) {
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Task not found</div>;
  }

  const isQC = user?.role === 'QC_INSPECTOR';

  return (
    <div className="space-y-4 font-sans pb-4 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <button onClick={() => navigate('/staff/tasks')} className="p-2 bg-slate-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">{task.woNumber}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Task Execution</p>
        </div>
      </div>

      {/* Task Details Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{task.product?.name || 'Product'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Target Qty: {task.requiredQty}</p>
          </div>
          <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
            {task.status.replace('_', ' ')}
          </span>
        </div>
        {task.batchNumber && (
          <div className="bg-slate-50 dark:bg-gray-900 p-3 rounded-xl border border-slate-100 dark:border-gray-700 mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Batch Number</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 font-mono">{task.batchNumber}</p>
          </div>
        )}
      </div>

      {/* Execution Flow */}
      {isQC ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 pb-2">Quality Inspection</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setQcPass(true)}
              className={`flex items-center justify-center p-3 rounded-xl border ${qcPass === true ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50 dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              {qcPass === true ? <CheckSquare className="mr-2" size={18} /> : <Square className="mr-2" size={18} />}
              Pass
            </button>
            <button 
              onClick={() => setQcPass(false)}
              className={`flex items-center justify-center p-3 rounded-xl border ${qcPass === false ? 'bg-red-50 border-red-500 text-red-700' : 'bg-slate-50 dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              {qcPass === false ? <CheckSquare className="mr-2" size={18} /> : <Square className="mr-2" size={18} />}
              Reject
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">Remarks</label>
            <textarea 
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-1 focus:ring-green-500 focus:outline-none"
              rows={3}
              placeholder="Any issues found..."
            />
          </div>

          <button 
            onClick={handleQcSubmit}
            disabled={qcPass === null}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-xl disabled:bg-gray-300 disabled:text-gray-500 dark:text-gray-400 active:bg-green-700 transition-colors"
          >
            Submit Inspection
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 border-b border-gray-100 dark:border-gray-700 pb-2">Packing Controls</h3>
            
            <button className="w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl active:bg-slate-100">
              <ScanBarcode className="mr-2 text-green-600" size={20} />
              Scan Item Barcode
            </button>

            {task.status !== 'PACKING_STARTED' && (
              <button 
                onClick={() => handleAction('PACKING_STARTED')}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl active:bg-blue-700 transition-colors"
              >
                Start Packing Flow
              </button>
            )}

            {task.status === 'PACKING_STARTED' && (
              <button 
                onClick={() => handleAction('QC_PENDING')}
                className="w-full flex items-center justify-center bg-green-600 text-white font-bold py-3 rounded-xl active:bg-green-700 transition-colors"
              >
                <CheckCircle className="mr-2" size={20} />
                Complete & Send to QC
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
