import React, { useState, useEffect } from 'react';
import { Archive, X, Search, CheckCircle, Calculator } from 'lucide-react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const FinishedGoods: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [selectedFG, setSelectedFG] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [pendingWOs, setPendingWOs] = useState<any[]>([]);
  const [qualityChecks, setQualityChecks] = useState<any[]>([]);

  // Form states
  const [formWoId, setFormWoId] = useState('');
  const [formPostedQty, setFormPostedQty] = useState(0);
  const [formDestination, setFormDestination] = useState('MAIN_WAREHOUSE');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fgRes, woRes, qcRes] = await Promise.all([
        apiClient.get('/workflows/finished-goods?limit=100'),
        apiClient.get('/work-orders?limit=200'),
        apiClient.get('/workflows/quality-checks?limit=200'),
      ]);
      setFinishedGoods(fgRes.data.data?.data || fgRes.data.data || []);
      const allWOs = woRes.data.data?.data || woRes.data.data || [];
      setPendingWOs(allWOs.filter((w: any) => w.status === 'COMPLETED' || w.status === 'QC_PENDING'));
      const allQCs = qcRes.data.data?.data || qcRes.data.data || [];
      setQualityChecks(allQCs.filter((qc: any) => ['PASS', 'PARTIAL_PASS'].includes(qc.result)));
    } catch (err) {
      console.error('Failed to fetch Finished Goods data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSelectWO = (woId: string) => {
    setFormWoId(woId);
    const wo = pendingWOs.find(w => w.id === woId);
    if (wo) {
      setFormPostedQty(wo.actualProduced || wo.requiredQty || 0);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWoId) return;
    const wo = pendingWOs.find(w => w.id === formWoId);
    if (!wo) return;
    try {
      setSubmitting(true);
      await apiClient.post('/workflows/finished-goods', {
        woId: formWoId,
        batchNumber: wo.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
        postedQty: formPostedQty,
        destination: formDestination,
      });
      alert('Batch successfully posted to Finished Goods!');
      setIsPostOpen(false);
      setFormWoId('');
      await fetchData();
    } catch (err: any) {
      alert(`Failed to post: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFG = finishedGoods.filter(fg => {
    const name = fg.product?.name || fg.productName || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
      (fg.fgNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (fg.batchNumber || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search finished goods ledger..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsPostOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
        >
          <Archive size={16} />
          <span>Post Finished Goods</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Pending Postings list */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-1 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-150 pb-3">QC Approved Batches</h3>
          <div className="space-y-3">
            {pendingWOs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                {loading ? 'Loading...' : 'No pending postings. Queue empty.'}
              </div>
            ) : (
              pendingWOs.map(wo => {
                const qc = qualityChecks.find(q => q.woId === wo.id);
                return (
                  <div key={wo.id} className="p-4 border border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50 transition-all space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">QC ID</div>
                        <div className="font-mono font-bold text-slate-700">{qc?.qcNumber || `QC-${wo.woNumber}`}</div>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-wide">QC Passed</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{wo.product?.name || wo.productName}</h4>
                      <div className="text-slate-500 font-mono text-[10px]">{wo.woNumber}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Batch Number</span>
                        <span className="font-mono font-medium text-slate-700">{wo.batchNumber || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Approved Qty</span>
                        <span className="font-medium text-slate-700">{wo.actualProduced || qc?.checkedQty || 0} units</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { handleSelectWO(wo.id); setIsPostOpen(true); }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Archive size={14} />
                      Post to Finished Goods
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ledger */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-150 pb-3">Finished Goods Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3">FG ID</th>
                  <th className="p-3">Work Order</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 font-mono">Batch Number</th>
                  <th className="p-3 text-center">Posted Qty</th>
                  <th className="p-3">Destination</th>
                  <th className="p-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-400">Loading...</td></tr>
                ) : filteredFG.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center text-slate-400">No stock postings registered.</td></tr>
                ) : filteredFG.map((fg) => (
                  <tr key={fg.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-semibold text-slate-500">{fg.fgNumber || fg.id?.slice(0, 8)}</td>
                    <td className="p-3 font-mono">{fg.workOrder?.woNumber || '—'}</td>
                    <td className="p-3 font-semibold text-slate-900">{fg.product?.name || '—'}</td>
                    <td className="p-3 font-mono text-[11px]">{fg.batchNumber || '—'}</td>
                    <td className="p-3 text-center font-bold">{fg.postedQty}</td>
                    <td className="p-3 font-medium text-indigo-600">{fg.destination}</td>
                    <td className="p-3 text-right text-slate-500">{formatDateTime(fg.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Post Dialog */}
      {isPostOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white rounded-t-xl">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Archive size={18} />
                <span>Post Finished Goods</span>
              </h3>
              <button onClick={() => setIsPostOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePostSubmit} className="p-6 space-y-4 flex-1 text-left text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select QC Passed Batch *</label>
                <select
                  required
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                  value={formWoId}
                  onChange={(e) => handleSelectWO(e.target.value)}
                >
                  <option value="">-- Choose Approved Batch --</option>
                  {pendingWOs.map(w => (
                    <option key={w.id} value={w.id}>{w.woNumber} - {w.product?.name} ({w.actualProduced || 0} units)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Posted Quantity</label>
                  <input type="number" readOnly className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-100 font-bold" value={formPostedQty} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Destination Location *</label>
                  <select
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                  >
                    <option value="MAIN_WAREHOUSE">Warehouse (Main Stock)</option>
                    <option value="STORE">Retail Store Racks</option>
                    <option value="VEHICLE">Delivery Van / Vehicle Route</option>
                    <option value="ONLINE">Online Warehouse Stock</option>
                    <option value="POS">Point of Sale (POS) Rack</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setIsPostOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                  <CheckCircle size={16} />
                  <span>{submitting ? 'Posting...' : 'Post Finished Goods'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
