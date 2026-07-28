import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { workOrderService } from '../api/workOrderService';
import type { WorkOrder } from '../api/workOrderService';
import { masterDataService } from '../api/masterDataService';
import type { Warehouse } from '../api/masterDataService';

import {
  Package, CheckCircle, AlertTriangle, X,
  Scan, RefreshCw, CornerUpLeft, ArrowLeftRight, ArrowLeft
} from 'lucide-react';

export const MaterialIssueDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { materialIssues: _mi, issueMaterials: _im, workOrders: _wo } = useApp();

  
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Execution State
  const [batchNo, setBatchNo] = useState('');
  const [location, setLocation] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    masterDataService.getWarehouses().then(setWarehouses).catch(console.error);
  }, []);

  const fetchWO = async () => {
    try {
      setLoading(true);
      const res = await workOrderService.getWorkOrders();
      
      const found = res.data.find(w => w.id === id);
      if (found) {
        setSelectedWO(found);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchWO();
  }, [id]);

  interface MaterialItem {
    id: string;
    item: string;
    type: string;
    reqQty: number;
    stockQty: number;
    issueQty: number;
  }

  const [materialsToIssue, setMaterialsToIssue] = useState<MaterialItem[]>([]);

  useEffect(() => {
    if (!selectedWO || !selectedWO.recipe) return;
    
    if (batchNo === '') setBatchNo(`BATCH-${selectedWO.woNumber}-1`);
    if (location === '') setLocation('');

    const reqQty = selectedWO.requiredQty;
    
    setMaterialsToIssue([
      ...(selectedWO.recipe.items?.filter(i => !i.isPackaging) || []).map(item => ({
        id: item.inputProductId,
        item: item.inputProduct?.name || item.inputProductId,
        type: 'Raw Material',
        reqQty: item.requiredQty,
        stockQty: 0,
        issueQty: 0,
      })),
      ...(selectedWO.recipe.items?.filter(i => i.isPackaging) || []).map(pkg => ({
        id: pkg.inputProductId,
        item: pkg.inputProduct?.name || pkg.inputProductId,
        type: 'Packaging',
        reqQty: pkg.requiredQty,
        stockQty: 0,
        issueQty: 0,
      }))
    ]);
  }, [selectedWO]);

  const handleMaterialChange = (id: string, field: keyof MaterialItem, value: string) => {
    setMaterialsToIssue(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          [field]: (field === 'reqQty' || field === 'stockQty' || field === 'issueQty') ? Number(value) : value
        };
      }
      return m;
    }));
  };

  const allAvailable = materialsToIssue.every(m => m.stockQty >= m.reqQty);

  const handleIssueMaterials = async () => {
    if (!selectedWO) return;
    
    try {
      setIsSubmitting(true);
      // Simulate API call to issue materials
      await workOrderService.issueMaterials(selectedWO.id, {
        batchNo,
        location,
        materials: materialsToIssue.map(m => ({
          itemCode: m.item,
          type: m.type,
          reqQty: m.reqQty,
          stockQty: m.stockQty,
          issuedQty: m.issueQty,
          status: m.stockQty < m.reqQty ? 'Shortage' : 'Available'
        }))
      });
      
      setIssueSuccess(`Successfully issued materials for ${selectedWO.woNumber}`);
      setTimeout(() => {
        setIssueSuccess(null);
        navigate('/material-issue');
      }, 2000);
      
    } catch (err) {
      console.error("Failed to issue materials", err);
      alert("Failed to issue materials. See console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <Package className="text-slate-300 dark:text-gray-600 mb-4 animate-pulse" size={48} />
        <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300">Loading Details...</h3>
      </div>
    );
  }

  if (!selectedWO) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
        <Package className="text-slate-300 dark:text-gray-600 mb-4" size={48} />
        <h3 className="text-lg font-bold text-slate-700 dark:text-gray-300">Work Order Not Found</h3>
        <button onClick={() => navigate('/material-issue')} className="mt-4 px-4 py-2 bg-[#00891D] text-white rounded-lg">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Material Issue Details</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 cursor-pointer hover:text-slate-700" onClick={() => navigate('/material-issue')}>
            Home &gt; Operations &gt; Material Issue &gt; {selectedWO.woNumber}
          </p>
        </div>
        <button onClick={() => navigate('/material-issue')} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 transition-colors">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {issueSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle size={20} />
          <span className="font-semibold">{issueSuccess}</span>
        </div>
      )}

      {/* Main Execution View - Full Width */}
      <div className="flex flex-col space-y-6">
        
        {/* Top summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Package size={16} className="text-[#00891D]" />
              Work Order Context
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div>
                <span className="text-slate-400 dark:text-gray-500 block text-[9px] uppercase font-bold">WO Number</span>
                <span className="text-slate-850 dark:text-white font-bold font-mono block mt-0.5">{selectedWO.woNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-gray-500 block text-[9px] uppercase font-bold">Product</span>
                <span className="text-slate-850 dark:text-white font-bold block mt-0.5">{selectedWO.product?.name || selectedWO.productId}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-gray-500 block text-[9px] uppercase font-bold">Required Qty</span>
                <span className="text-slate-850 dark:text-white font-bold font-mono block mt-0.5">{selectedWO.requiredQty} units</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-gray-500 block text-[9px] uppercase font-bold">Expected Completion</span>
                <span className="text-slate-850 dark:text-white font-bold font-mono block mt-0.5">
                  {selectedWO.expectedDate ? new Date(selectedWO.expectedDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <RefreshCw size={16} className="text-blue-500" />
              Recipe / BOM
            </h3>
            <div className="space-y-4">
               <div>
                  <span className="text-slate-400 dark:text-gray-500 block text-[9px] uppercase font-bold">Active Recipe</span>
                  <span className="text-slate-850 dark:text-white font-bold block mt-0.5">{selectedWO.recipe?.name || selectedWO.recipeId}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-gray-700 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 dark:text-gray-500 block text-[9px] uppercase font-bold">Raw Materials</span>
                    <span className="text-slate-700 dark:text-gray-300 font-bold block mt-0.5">{selectedWO.recipe?.items?.filter(i => !i.isPackaging).length || 0} items</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-gray-500 block text-[9px] uppercase font-bold">Packaging</span>
                    <span className="text-slate-700 dark:text-gray-300 font-bold block mt-0.5">{selectedWO.recipe?.items?.filter(i => i.isPackaging).length || 0} items</span>
                  </div>
                </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-5 shadow-sm flex flex-col justify-center">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${allAvailable ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {allAvailable ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <h3 className={`text-base font-bold ${allAvailable ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {allAvailable ? 'All Materials Available' : 'Shortage Detected'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                  {allAvailable 
                    ? "Sufficient stock is available in the selected warehouse."
                    : "Some required materials fall below the requested quantity."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Execution Actions */}
        <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 dark:border-gray-700 p-4 bg-slate-50 dark:bg-gray-800/50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <Package size={18} className="text-[#00891D]" />
               Materials to Issue
             </h3>
             <div className="flex gap-2">
                <div className="relative">
                  <Scan size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Scan Barcode..." 
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-slate-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-[#00891D] w-48 dark:bg-gray-900 dark:text-white"
                  />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors">
                  <RefreshCw size={12} />
                  Refresh Stock
                </button>
             </div>
          </div>
          
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-100 dark:border-gray-700">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Batch Number</label>
              <input 
                type="text" 
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 rounded-lg text-sm bg-slate-50 dark:bg-gray-900 dark:text-white"
                placeholder="Select or enter batch..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase mb-1">Storage Location</label>
              <select 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 rounded-lg text-sm bg-slate-50 dark:bg-gray-900 dark:text-white"
              >
                <option value="">Select Warehouse...</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-800/80 text-slate-500 dark:text-gray-400 text-xs uppercase text-left border-b border-slate-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item Code</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Req Qty</th>
                  <th className="px-4 py-3 font-semibold">Available Stock</th>
                  <th className="px-4 py-3 font-semibold">Issue Qty</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {materialsToIssue.map((mat) => {
                  const hasShortage = mat.stockQty < mat.reqQty;
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={mat.item || ''}
                          onChange={(e) => handleMaterialChange(mat.id, 'item', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-200 dark:border-gray-700 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#00891D] dark:bg-gray-900"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={mat.type || ''}
                          onChange={(e) => handleMaterialChange(mat.id, 'type', e.target.value)}
                          className="w-28 px-2 py-1 border border-slate-200 dark:border-gray-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#00891D] dark:bg-gray-900"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">
                        <input
                          type="number"
                          value={mat.reqQty || ''}
                          onChange={(e) => handleMaterialChange(mat.id, 'reqQty', e.target.value)}
                          className="w-24 px-2 py-1 border border-slate-200 dark:border-gray-700 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#00891D] dark:bg-gray-900"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <input
                          type="number"
                          value={mat.stockQty || ''}
                          onChange={(e) => handleMaterialChange(mat.id, 'stockQty', e.target.value)}
                          className={`w-24 px-2 py-1 rounded border text-xs font-bold ${hasShortage ? 'border-red-300 bg-red-50 text-red-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'} focus:outline-none focus:ring-1 focus:ring-[#00891D]`}
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-800 dark:text-gray-200 font-bold">
                        <input
                          type="number"
                          value={mat.issueQty || ''}
                          onChange={(e) => handleMaterialChange(mat.id, 'issueQty', e.target.value)}
                          className="w-24 px-2 py-1 border border-slate-200 dark:border-gray-700 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#00891D] dark:bg-gray-900"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {hasShortage ? (
                           <span className="flex items-center gap-1 text-red-600 text-xs font-bold"><X size={12}/> Shortage</span>
                        ) : (
                           <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle size={12}/> Available</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {materialsToIssue.length === 0 && (
                   <tr>
                     <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No materials defined in BOM.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-white dark:hover:bg-gray-700 transition-colors">
                <CornerUpLeft size={16} />
                Return Material
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 rounded-lg text-sm font-semibold hover:bg-white dark:hover:bg-gray-700 transition-colors">
                <ArrowLeftRight size={16} />
                Transfer
              </button>
            </div>
            
            <button 
              onClick={handleIssueMaterials}
              disabled={isSubmitting || !allAvailable || selectedWO.status === 'MATERIAL_ISSUED'}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all
                ${isSubmitting || !allAvailable || selectedWO.status === 'MATERIAL_ISSUED'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                  : 'bg-[#00891D] hover:bg-[#007017] text-white hover:shadow-md'
                }`}
            >
              {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Package size={16} />}
              {selectedWO.status === 'MATERIAL_ISSUED' ? 'Already Issued' : 'Issue Materials'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
