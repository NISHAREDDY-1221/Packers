import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { RepackingRecord } from '../context/AppContext';
import { RefreshCw, X, Search, AlertTriangle, CheckCircle } from 'lucide-react';

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${day}-${month}-${year} ${time}`;
};
const REPACK_TYPES = [
  'Damaged Pack → New Pack',
  'Large Pack → Small Packs',
  'Combo Creation',
  'Gift Kit',
  'Festival Kit',
  'Customer Return → Repack'
];

export const Repacking: React.FC = () => {
  const { repackings, recipes, workOrders, qualityChecks, addRepacking } = useApp();
  
  const failedQCs = qualityChecks.filter(qc => ['Reject', 'Rework', 'Discard'].includes(qc.result));

  const pendingRepackQCs = failedQCs.filter(qc => {
    const wo = workOrders.find(w => w.id === qc.woId);
    if (!wo || wo.status === 'Completed') return false;
    const batchNo = qc.batchNo || wo.batchNumber || `BATCH-2026-${wo.woNo.split('-').pop()}`;
    return !repackings.some(rp => rp.sourceBatchNo === batchNo);
  });

  const handleSelectFailedBatch = (batchNo: string) => {
    setFormSourceBatch(batchNo);
    const qc = failedQCs.find(q => (q.batchNo || `BATCH-2026-${workOrders.find(w => w.id === q.woId)?.woNo.split('-').pop()}`) === batchNo);
    if (qc) {
      setFormProductName(qc.productName);
    }
  };
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RepackingRecord | null>(null);

  // Form states
  const [formSourceBatch, setFormSourceBatch] = useState('');
  const [formProductName, setFormProductName] = useState('');
  const [formRecipeId, setFormRecipeId] = useState('');
  const [formRepackType, setFormRepackType] = useState('Damaged Pack → New Pack');
  const [formRecoveredQty, setFormRecoveredQty] = useState(0);
  const [formWasteQty, setFormWasteQty] = useState(0);
  const [newBatchNo, setNewBatchNo] = useState('');
  const [printLabels, setPrintLabels] = useState(true);

  const handleSelectRecipe = (recipeId: string) => {
    setFormRecipeId(recipeId);
    const rcp = recipes.find(r => r.id === recipeId);
    if (rcp) {
      setFormProductName(rcp.packingName);
      setNewBatchNo('');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRecord: RepackingRecord = {
      id: `RP-${Date.now().toString().slice(-4)}`,
      sourceBatchNo: formSourceBatch,
      productName: formProductName,
      repackRecipeId: formRecipeId,
      repackType: formRepackType,
      recoverableQuantity: Number(formRecoveredQty),
      wasteQuantity: Number(formWasteQty),
      newBatchNo,
      newLabelPrinted: printLabels,
      createdAt: new Date().toLocaleString()
    };

    addRepacking(newRecord);
    setIsFormOpen(false);

    // Reset Form
    setFormSourceBatch('');
    setFormProductName('');
    setFormRecipeId('');
    setFormRecoveredQty(0);
    setFormWasteQty(0);
  };

  return (
    <div className="space-y-6">
      {/* Search and Repack trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search repacking history..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
        >
          <RefreshCw size={16} />
          <span>New Repacking Log</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Pending Repacking Queue */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-150 pb-3 flex items-center gap-1.5">
            <AlertTriangle size={16} className="text-orange-600" />
            <span>Pending Repacking Queue</span>
          </h3>

          <div className="space-y-3">
            {pendingRepackQCs.map(qc => {
              const wo = workOrders.find(w => w.id === qc.woId)!;
              const batchNo = qc.batchNo || wo.batchNumber || `BATCH-2026-${wo.woNo.split('-').pop()}`;
              
              return (
                <div key={qc.id} className="p-4 border border-slate-200 hover:border-orange-400 rounded-xl bg-slate-50 transition-all space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">QC ID</div>
                      <div className="font-mono font-bold text-slate-700">{qc.id}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${qc.result === 'Rework' ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'}`}>
                      {qc.result}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{wo.productName}</h4>
                    <div className="text-slate-500 font-mono text-[10px]">{wo.woNo}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Failed Batch No</span>
                      <span className="font-mono font-medium text-slate-700">{batchNo}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Failed Qty</span>
                      <span className="font-medium text-slate-700">{qc.checkedQty || wo.actualProduced} units</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Failure Reason</span>
                      <span className="font-medium text-slate-700 truncate block" title={qc.failureReason || qc.remarks}>{qc.failureReason || qc.remarks || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Waiting Since</span>
                      <span className="font-medium text-slate-700">{formatDateTime(qc.completionTime || qc.date)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => { handleSelectFailedBatch(batchNo); setIsFormOpen(true); }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    Start Repacking
                  </button>
                </div>
              );
            })}
            
            {pendingRepackQCs.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No pending failed batches.
              </div>
            )}
          </div>
        </div>

        {/* Ledger Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-150 pb-3">Repacking History Ledger</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">RP ID</th>
                  <th className="p-3">Source Batch</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Workflow Type</th>
                  <th className="p-3 text-center">Recovered Yield</th>
                  <th className="p-3 text-center">Wastage</th>
                  <th className="p-3">New Batch No</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {repackings.filter(rp => rp.productName.toLowerCase().includes(search.toLowerCase()) || rp.sourceBatchNo.toLowerCase().includes(search.toLowerCase())).map((rp) => (
                  <tr key={rp.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-semibold text-slate-500">{rp.id}</td>
                    <td className="p-3 font-mono">{rp.sourceBatchNo}</td>
                    <td className="p-3 font-semibold text-slate-900">{rp.productName}</td>
                    <td className="p-3 font-medium text-indigo-600">{rp.repackType}</td>
                    <td className="p-3 text-center font-bold">{rp.recoverableQuantity}</td>
                    <td className="p-3 text-center text-rose-600 font-bold">{rp.wasteQuantity}</td>
                    <td className="p-3 font-mono text-[11px]">{rp.newBatchNo}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedRecord(rp)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-2 py-1 rounded cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {repackings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      No repacking operations logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Repacking Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl p-6 text-left space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">{selectedRecord.id}</span>
                <h3 className="font-bold text-slate-800 text-base">Repacking Summary</h3>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Source Batch</span>
                <span className="font-mono font-bold">{selectedRecord.sourceBatchNo}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Product Name</span>
                <span className="font-bold text-slate-855">{selectedRecord.productName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Repack Type</span>
                <span className="font-medium text-indigo-600">{selectedRecord.repackType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Recovered Yield</span>
                <span className="font-bold text-emerald-600">{selectedRecord.recoverableQuantity} Units</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Waste Material</span>
                <span className="font-bold text-rose-600">{selectedRecord.wasteQuantity} Units</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">New Batch Generated</span>
                <span className="font-mono font-bold">{selectedRecord.newBatchNo}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Labels Auto-Printed</span>
                <span className="font-semibold text-slate-800">{selectedRecord.newLabelPrinted ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setSelectedRecord(null)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Repacking Log Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white rounded-t-xl">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <RefreshCw size={18} />
                <span>Log Repacking Operation</span>
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 flex-1 text-left text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select QC Failed Batch *</label>
                  <select
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                    value={formSourceBatch}
                    onChange={(e) => handleSelectFailedBatch(e.target.value)}
                  >
                    <option value="">-- Choose Failed Batch --</option>
                    {failedQCs.map(qc => {
                      const wo = workOrders.find(w => w.id === qc.woId);
                      if (!wo || wo.status === 'Completed') return null;
                      const batchNo = qc.batchNo || wo.batchNumber || `BATCH-2026-${wo.woNo.split('-').pop()}`;
                      return (
                        <option key={qc.id} value={batchNo}>
                          {batchNo} - {qc.productName} ({qc.result})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Repack Workflow Type *</label>
                  <select
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                    value={formRepackType}
                    onChange={(e) => setFormRepackType(e.target.value)}
                  >
                    {REPACK_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Target Config Recipe *</label>
                <select
                  required
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                  value={formRecipeId}
                  onChange={(e) => handleSelectRecipe(e.target.value)}
                >
                  <option value="">-- Choose Recipe --</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.packingName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Recovered Yield Qty (Units) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    value={formRecoveredQty}
                    onChange={(e) => setFormRecoveredQty(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Wastage Qty (Units) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                    value={formWasteQty}
                    onChange={(e) => setFormWasteQty(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Batch Number Generated</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono bg-slate-50"
                    value={newBatchNo}
                    onChange={(e) => setNewBatchNo(e.target.value)}
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      className="rounded accent-emerald-600 w-4 h-4"
                      checked={printLabels}
                      onChange={() => setPrintLabels(!printLabels)}
                    />
                    <span>Auto-print repack labels</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 flex justify-end gap-3 -mx-6 -mb-6 p-4 bg-slate-50 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle size={16} />
                  <span>Log Repacking Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
