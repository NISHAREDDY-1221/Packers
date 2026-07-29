import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import apiClient from '../api/axios';

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [repackings, setRepackings] = useState<any[]>([]);
  const [failedQCs, setFailedQCs] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);

  // Form states
  const [formSourceWoId, setFormSourceWoId] = useState('');
  const [formRepackType, setFormRepackType] = useState(REPACK_TYPES[0]);
  const [formRecoveredQty, setFormRecoveredQty] = useState(0);
  const [formWasteQty, setFormWasteQty] = useState(0);
  const [formRecipeId, setFormRecipeId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rpRes, qcRes] = await Promise.all([
        apiClient.get('/workflows/repacking?limit=100'),
        apiClient.get('/workflows/quality-checks?limit=200'),
      ]);
      setRepackings(rpRes.data.data?.data || rpRes.data.data || []);
      const allQCs = qcRes.data.data?.data || qcRes.data.data || [];
      setFailedQCs(allQCs.filter((qc: any) => ['REJECT', 'REWORK', 'DISCARD'].includes(qc.result)));
    } catch (err) {
      console.error('Failed to fetch Repacking data:', err);
    } finally {
      setLoading(false);
    }
    // Load recipes separately (optional — admin only route, won't crash page if 403)
    apiClient.get('/master-data/recipes?limit=200').then(res => {
      setRecipes(res.data.data?.data || res.data.data || []);
    }).catch(() => {}); // Silent fail — recipes are optional for the dropdown
  };

  useEffect(() => { fetchData(); }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSourceWoId) return;
    try {
      setSubmitting(true);
      await apiClient.post('/workflows/repacking', {
        sourceWoId: formSourceWoId,
        repackType: formRepackType,
        recoverableQty: Number(formRecoveredQty),
        wasteQty: Number(formWasteQty),
        targetRecipeId: formRecipeId || undefined,
      });
      alert('Repacking logged successfully!');
      setIsFormOpen(false);
      setFormSourceWoId('');
      setFormRecoveredQty(0);
      setFormWasteQty(0);
      setFormRecipeId('');
      await fetchData();
    } catch (err: any) {
      alert(`Failed to log repacking: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRepackings = repackings.filter(rp =>
    (rp.rpNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (rp.newBatchNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (rp.sourceWorkOrder?.product?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
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
            {loading ? (
              <div className="text-center py-8 text-xs text-slate-400">Loading...</div>
            ) : failedQCs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No pending failed batches.
              </div>
            ) : failedQCs.map(qc => (
              <div key={qc.id} className="p-4 border border-slate-200 hover:border-orange-400 rounded-xl bg-slate-50 transition-all space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">QC ID</div>
                    <div className="font-mono font-bold text-slate-700">{qc.qcNumber}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${qc.result === 'REWORK' ? 'bg-orange-100 text-orange-800' : 'bg-rose-100 text-rose-800'}`}>
                    {qc.result}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{qc.workOrder?.product?.name || '—'}</h4>
                  <div className="text-slate-500 font-mono text-[10px]">{qc.workOrder?.woNumber || '—'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Batch No</span>
                    <span className="font-mono font-medium text-slate-700">{qc.workOrder?.batchNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Failed Qty</span>
                    <span className="font-medium text-slate-700">{qc.checkedQty} units</span>
                  </div>
                  {qc.failureReason && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Failure Reason</span>
                      <span className="font-medium text-slate-700 truncate block">{qc.failureReason}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setFormSourceWoId(qc.woId); setFormRecoveredQty(qc.checkedQty); setIsFormOpen(true); }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  Start Repacking
                </button>
              </div>
            ))}
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
                  <th className="p-3">Product</th>
                  <th className="p-3">Workflow Type</th>
                  <th className="p-3 text-center">Recovered</th>
                  <th className="p-3 text-center">Wastage</th>
                  <th className="p-3">New Batch No</th>
                  <th className="p-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-400">Loading...</td></tr>
                ) : filteredRepackings.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-400">No repacking records found.</td></tr>
                ) : filteredRepackings.map((rp) => (
                  <tr key={rp.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-semibold text-slate-500">{rp.rpNumber}</td>
                    <td className="p-3 font-semibold text-slate-900">{rp.sourceWorkOrder?.product?.name || '—'}</td>
                    <td className="p-3 text-slate-600">{rp.repackType}</td>
                    <td className="p-3 text-center font-bold text-green-700">+{rp.recoverableQty}</td>
                    <td className="p-3 text-center font-bold text-rose-600">-{rp.wasteQty}</td>
                    <td className="p-3 font-mono text-[11px]">{rp.newBatchNumber || '—'}</td>
                    <td className="p-3 text-right text-slate-500">{formatDateTime(rp.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Repacking Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white rounded-t-xl">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <RefreshCw size={18} />
                <span>Log Repacking</span>
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 flex-1 text-left text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Source Work Order (Failed Batch) *</label>
                <select
                  required
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                  value={formSourceWoId}
                  onChange={(e) => {
                    setFormSourceWoId(e.target.value);
                    const qc = failedQCs.find(q => q.woId === e.target.value);
                    if (qc) setFormRecoveredQty(qc.checkedQty || 0);
                  }}
                >
                  <option value="">-- Select Failed Batch --</option>
                  {failedQCs.map(qc => (
                    <option key={qc.id} value={qc.woId}>
                      {qc.workOrder?.woNumber || qc.woId} — {qc.workOrder?.product?.name || '?'} ({qc.result})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Repacking Type *</label>
                <select
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                  value={formRepackType}
                  onChange={(e) => setFormRepackType(e.target.value)}
                >
                  {REPACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Recoverable Qty *</label>
                  <input
                    type="number" required min={0}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono"
                    value={formRecoveredQty}
                    onChange={(e) => setFormRecoveredQty(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Waste Qty *</label>
                  <input
                    type="number" required min={0}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono"
                    value={formWasteQty}
                    onChange={(e) => setFormWasteQty(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Recipe (optional)</label>
                <select
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                  value={formRecipeId}
                  onChange={(e) => setFormRecipeId(e.target.value)}
                >
                  <option value="">— Same Recipe (No Change) —</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.name || r.packingName}</option>)}
                </select>
              </div>
              <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                  <CheckCircle size={16} />
                  <span>{submitting ? 'Submitting...' : 'Log Repacking'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
