import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, X, Clock, CheckCircle, AlertTriangle,
  Users, ChevronDown, Loader2, Scissors
} from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { StatCard } from '../components/ui';
import { repackingService } from '../api/repackingService';
import { workOrderService } from '../api/workOrderService';
import type { RepackingLog, PendingRepackWorkOrder } from '../api/repackingService';
import type { QCUser } from '../api/qualityCheckService';

import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (dateStr?: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
};

const PRIORITY_LABEL: Record<string, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent' };
const PRIORITY_COLOR = (p: string) => p === 'HIGH' || p === 'URGENT' ? 'text-red-600 font-bold' : p === 'MEDIUM' ? 'text-yellow-600 font-semibold' : 'text-gray-500';

const STATUS_BADGE: Record<string, string> = {
  'Pending Repack':   'bg-amber-50 text-amber-700 border-amber-200',
  'Repacked':         'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Failed':           'bg-rose-50 text-rose-700 border-rose-200',
};
const STATUS_DOT: Record<string, string> = {
  'Pending Repack': 'bg-amber-400',
  'Repacked': 'bg-emerald-500',
  'Failed': 'bg-rose-500',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface TableRow {
  _type: 'PENDING' | 'COMPLETED';
  id: string;
  woId: string;
  woNumber: string;
  productName: string;
  batchNumber: string;
  repackTime: string;
  assignedTo: string;
  displayStatus: string;
  priority: string;
  recoverableQty: number;
  wasteQty: number;
  rawRP?: RepackingLog;
  rawWO?: PendingRepackWorkOrder;
}

const REPACK_TYPES = [
  'Damaged Pack → New Pack',
  'Large Pack → Small Packs',
  'Combo Creation',
  'Gift Kit',
  'Festival Kit',
  'Customer Return → Repack'
];

// ─── Reusable Select ──────────────────────────────────────────────────────────
const Sel = ({ label, value, onChange, children, className = '' }: {
  label?: string; value: string; onChange: (v: string) => void;
  children: React.ReactNode; className?: string;
}) => (
  <div className="flex flex-col gap-1">
    {label && <span className="text-[10px] font-semibold text-gray-500 uppercase">{label}</span>}
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`appearance-none bg-white border border-gray-200 rounded-lg pl-3 pr-7 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#00891D] ${className}`}
      >
        {children}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

// ─── Component ─────────────────────────────────────────────────────────────────
export const Repacking: React.FC = () => {
  // ── data ──
  const [pendingWOs, setPendingWOs]       = useState<PendingRepackWorkOrder[]>([]);
  const [completedRPs, setCompletedRPs]   = useState<RepackingLog[]>([]);
  const [operators, setOperators]         = useState<QCUser[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshKey, setRefreshKey]       = useState(0);

  // ── filters ──
  const [filterProduct]   = useState('');
  const [search]          = useState('');
  const [filterStatus]    = useState('');
  const [filterOperator]  = useState('');
  const [filterPriority]  = useState('');
  const [filterBatch]     = useState('');
  const [filterWO]        = useState('');

  // ── assign bar ──
  const [assignWO,       setAssignWO]       = useState('');
  const [assignTo,       setAssignTo]       = useState('');
  const [assignPriority, setAssignPriority] = useState('HIGH');
  const [assignTime,     setAssignTime]     = useState('30 mins');

  // ── modals ──
  const [selectedRP,  setSelectedRP]  = useState<RepackingLog | null>(null);
  const [isFormOpen,  setIsFormOpen]  = useState(false);
  const [selectedWO,  setSelectedWO]  = useState<PendingRepackWorkOrder | null>(null);

  // ── form fields ──
  const [formSourceBatch,   setFormSourceBatch]   = useState('');
  const [formRepackType,    setFormRepackType]    = useState(REPACK_TYPES[0]);
  const [formRecoveredQty,  setFormRecoveredQty]  = useState(0);
  const [formWasteQty,      setFormWasteQty]      = useState(0);
  const [formSignature,     setFormSignature]     = useState('');
  const [submitting,        setSubmitting]        = useState(false);

  // ─── Load ────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [woRes, rpRes, userRes] = await Promise.all([
        repackingService.getPendingRepackWorkOrders(),
        repackingService.getRepackingLogs(),
        repackingService.getOperators(),
      ]);
      setPendingWOs(woRes);
      setCompletedRPs(rpRes.data);
      setOperators(userRes);
    } catch (err) {
      console.error('Failed to load Repacking data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll, refreshKey]);

  // ─── KPIs ────────────────────────────────────────────────────────────────
  const todayStr = new Date().toDateString();
  const repackedToday = useMemo(() =>
    completedRPs.filter(rp => new Date(rp.createdAt).toDateString() === todayStr).length,
  [completedRPs]);
  const totalRecovered = useMemo(() =>
    completedRPs.reduce((acc, rp) => acc + (rp.recoverableQty || 0), 0),
  [completedRPs]);
  const totalWaste = useMemo(() =>
    completedRPs.reduce((acc, rp) => acc + (rp.wasteQty || 0), 0),
  [completedRPs]);

  // ─── Task Assignment ──────────────────────────────────────────────────────
  const handleAssignTask = async () => {
    if (!assignWO || !assignTo) return;
    try {
      const wo = pendingWOs.find(w => w.id === assignWO);
      if (!wo) return;
      await workOrderService.updateWorkOrderStatus(assignWO, 'MATERIAL_ISSUED', {
        operatorId: assignTo,
        priority: assignPriority
      });
      const assignedUser = operators.find(o => o.id === assignTo);
      toast.success(`Repacking task assigned to ${assignedUser?.name || 'Team Member'}.`);
      setAssignWO('');
      setAssignTo('');
      loadAll();
    } catch (err: any) {
      console.error('Failed to assign task', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to assign repacking task');
    }
  };

  // ─── Table rows ───────────────────────────────────────────────────────────
  const unifiedData = useMemo<TableRow[]>(() => {
    const rows: TableRow[] = [];
    pendingWOs.forEach(wo => rows.push({
      _type: 'PENDING', id: `PENDING-${wo.id}`, woId: wo.id,
      woNumber: wo.woNumber, productName: wo.product?.name ?? '—',
      batchNumber: wo.batchNumber || (wo as any).batchNo || (wo.woNumber ? `BATCH-${wo.woNumber}` : '—'),
      repackTime: wo.updatedAt,
      assignedTo: (wo as any).operator?.name ?? (wo as any).supervisor?.name ?? (wo as any).inspector?.name ?? 'Unassigned',
      displayStatus: 'Pending Repack',
      priority: wo.priority,
      recoverableQty: 0,
      wasteQty: 0,
      rawWO: wo,
    }));
    completedRPs.forEach(rp => rows.push({
      _type: 'COMPLETED', id: rp.id, woId: rp.sourceWoId,
      woNumber: rp.sourceWorkOrder?.woNumber ?? '—',
      productName: rp.sourceWorkOrder?.product?.name ?? '—',
      batchNumber: (rp as any).newBatchNumber || rp.sourceWorkOrder?.batchNumber || (rp.sourceWorkOrder?.woNumber ? `BATCH-${rp.sourceWorkOrder.woNumber}` : '-'),
      repackTime: rp.createdAt,
      assignedTo: rp.loggedBy?.name ?? '—',
      displayStatus: 'Repacked',
      priority: rp.sourceWorkOrder?.priority ?? 'MEDIUM',
      recoverableQty: rp.recoverableQty,
      wasteQty: rp.wasteQty,
      rawRP: rp,
    }));
    return rows;
  }, [pendingWOs, completedRPs]);

  const filteredData = useMemo(() => {
    let d = unifiedData;
    if (filterStatus) {
      d = d.filter(r =>
        filterStatus === 'PENDING' ? r._type === 'PENDING' :
        filterStatus === 'COMPLETED' ? r._type === 'COMPLETED' :
        r.displayStatus === filterStatus
      );
    }
    if (filterOperator) d = d.filter(r => r.assignedTo === filterOperator);
    if (filterPriority) d = d.filter(r => r.priority === filterPriority);
    if (filterBatch)    d = d.filter(r => r.batchNumber.toLowerCase().includes(filterBatch.toLowerCase()));
    if (filterWO)       d = d.filter(r => r.woNumber.toLowerCase().includes(filterWO.toLowerCase()));
    if (filterProduct)  d = d.filter(r => r.productName.toLowerCase().includes(filterProduct.toLowerCase()));
    if (search) {
      const t = search.toLowerCase();
      d = d.filter(r =>
        r.productName.toLowerCase().includes(t) || r.woNumber.toLowerCase().includes(t) ||
        r.batchNumber.toLowerCase().includes(t) || r.assignedTo.toLowerCase().includes(t)
      );
    }
    return d;
  }, [unifiedData, filterStatus, filterOperator, filterPriority, filterBatch, filterWO, filterProduct, search]);

  // ─── Form helpers ─────────────────────────────────────────────────────────
  const openForm = (wo: PendingRepackWorkOrder) => {
    setSelectedWO(wo);
    setFormSourceBatch(wo.batchNumber ?? `BATCH-${wo.woNumber.split('-').pop()}`);
    setFormRepackType(REPACK_TYPES[0]);
    // pre-fill with rejected count if available, else half of required qty for testing
    setFormRecoveredQty(Math.max(1, wo.actualRejected ?? Math.round(wo.requiredQty * 0.5)));
    setFormWasteQty(0);
    setFormSignature('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO) return;
    setSubmitting(true);
    try {
      await repackingService.logRepacking({
        sourceWoId: selectedWO.id,
        repackType: formRepackType,
        recoverableQty: formRecoveredQty,
        wasteQty: formWasteQty,
      });
      setIsFormOpen(false); setSelectedWO(null);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit repacking log.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full px-2 md:px-4 pb-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-4 mt-3">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Repacking & Rework</h1>
        <Breadcrumbs />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-5 max-w-full">
        <StatCard title="Pending Repack" value={pendingWOs.length} icon={AlertTriangle} variant="yellow" />
        <StatCard title="Active Operators" value={operators.length} icon={Users} variant="blue" />
        <StatCard title="Total Repacked" value={completedRPs.length} icon={CheckCircle} variant="green" />
        <StatCard title="Repacked Today" value={repackedToday} icon={Clock} variant="blue" />
        <StatCard title="Yield Recovered" value={totalRecovered} icon={Package} variant="purple" />
        <StatCard title="Total Waste" value={totalWaste} icon={Scissors} variant="red" />
      </div>

      {/* ── Assign Task Bar ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5">
        <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-800">Assign Repacking Task</span>
          <button
            onClick={() => { setSelectedWO(null); setIsFormOpen(true); }}
            className="flex items-center gap-1.5 bg-[#00891D] hover:bg-[#006b17] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Scissors size={14} /> New Repacking Log
          </button>
        </div>

        <div className="px-4 py-3 flex flex-wrap gap-x-4 gap-y-3 items-end">
          <Sel label="Select Product / Work Order" value={assignWO} onChange={setAssignWO} className="min-w-[220px]">
            <option value="">-- Choose failed/rework WO --</option>
            {pendingWOs.map(wo => (
              <option key={wo.id} value={wo.id}>
                {wo.woNumber} — {wo.product?.name ?? 'Unknown'}
              </option>
            ))}
          </Sel>

          <Sel label="Assign To (Team Member)" value={assignTo} onChange={setAssignTo} className="min-w-[180px]">
            <option value="">{operators.length === 0 ? 'No team members found' : '-- Select Team Member --'}</option>
            {operators.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Sel>

          <Sel label="Priority" value={assignPriority} onChange={setAssignPriority} className="w-32">
            {(['LOW','MEDIUM','HIGH','URGENT'] as const).map(p => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </Sel>

          <Sel label="Expected Time" value={assignTime} onChange={setAssignTime} className="w-28">
            {['15 mins','30 mins','45 mins','1 hour','2 hours'].map(t => <option key={t}>{t}</option>)}
          </Sel>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-transparent select-none">Action</span>
            <button
              disabled={!assignWO || !assignTo}
              className="flex items-center gap-1.5 bg-[#00891D] hover:bg-[#006b17] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              onClick={handleAssignTask}
            >
              <Users size={14} /> Assign Task
            </button>
          </div>
        </div>
      </div>


      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading repacking data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto table-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['PRODUCT / WORK ORDER','BATCH NO','DATE / TIME','ASSIGNED TO','RECOVERED','WASTE','STATUS','PRIORITY','ACTION'].map(h => (
                    <th key={h} className={`px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap ${h === 'ACTION' || h === 'RECOVERED' || h === 'WASTE' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">No repacking records found.</td></tr>
                ) : filteredData.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 text-xs">{row.productName}</div>
                      <div className="font-mono text-[10px] text-gray-400">{row.woNumber}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.batchNumber}</td>
                    <td className="px-4 py-3">
                      <div className="text-[10px] text-gray-500 font-medium">{fmt(row.repackTime)}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 font-medium">{row.assignedTo}</td>
                    <td className="px-4 py-3 text-right">
                      {row._type === 'COMPLETED' ? <span className="text-xs font-bold text-emerald-600">{row.recoverableQty}</span> : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row._type === 'COMPLETED' ? <span className="text-xs font-bold text-rose-600">{row.wasteQty}</span> : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${STATUS_BADGE[row.displayStatus] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[row.displayStatus] ?? 'bg-gray-400'}`} />
                        {row.displayStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] ${PRIORITY_COLOR(row.priority)}`}>{PRIORITY_LABEL[row.priority] ?? row.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row._type === 'PENDING' ? (
                        <button onClick={() => row.rawWO && openForm(row.rawWO)}
                          className="bg-[#00891D] hover:bg-[#006b17] text-white font-semibold px-3 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer whitespace-nowrap">
                          Start Repacking
                        </button>
                      ) : (
                        <button onClick={() => row.rawRP && setSelectedRP(row.rawRP)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold px-3 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer whitespace-nowrap">
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filteredData.length} of {unifiedData.length} records
            &nbsp;·&nbsp;{pendingWOs.length} pending&nbsp;·&nbsp;{completedRPs.length} completed
          </div>
        )}
      </div>

      {/* ── Detail Modal ────────────────────────────────────────── */}
      {selectedRP && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-2xl p-6 text-left space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">{selectedRP.rpNumber}</span>
                <h3 className="font-bold text-slate-800 text-base">{selectedRP.sourceWorkOrder?.product?.name ?? '—'}</h3>
              </div>
              <button onClick={() => setSelectedRP(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-rose-600 cursor-pointer">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div><strong>Repack No:</strong> {selectedRP.rpNumber}</div>
              <div><strong>Work Order:</strong> {selectedRP.sourceWorkOrder?.woNumber ?? '—'}</div>
              <div><strong>Operator:</strong> {selectedRP.loggedBy?.name ?? '—'}</div>
              <div><strong>Date:</strong> {fmt(selectedRP.createdAt)}</div>
              <div><strong>Source Batch:</strong> {selectedRP.sourceWorkOrder?.batchNumber ?? '—'}</div>
              <div><strong>New Batch:</strong> {selectedRP.newBatchNumber}</div>
              <div className="col-span-2 border-t border-slate-200 mt-1 pt-2">
                <strong>Repack Type:</strong> {selectedRP.repackType}
              </div>
              <div><strong className="text-emerald-700">Recovered Yield:</strong> {selectedRP.recoverableQty}</div>
              <div><strong className="text-rose-700">Waste:</strong> {selectedRP.wasteQty}</div>
            </div>

            <div className="pt-3 flex justify-end">
              <button onClick={() => setSelectedRP(null)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Repack Form Modal ──────────────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white rounded-t-xl">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Scissors size={18} /> Repack & Rework Log
              </h3>
              <button onClick={() => { setIsFormOpen(false); setSelectedWO(null); }} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 flex-1 text-left text-xs max-h-[80vh] overflow-y-auto">

              {/* WO selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Work Order *</label>
                <select required
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00891D]"
                  value={selectedWO?.id ?? ''}
                  onChange={e => { const wo = pendingWOs.find(w => w.id === e.target.value); if (wo) openForm(wo); }}
                >
                  <option value="">-- Choose Pending Rework Batch --</option>
                  {pendingWOs.map(w => (
                    <option key={w.id} value={w.id}>{w.woNumber} — {w.product?.name ?? 'Unknown'}</option>
                  ))}
                </select>
              </div>

              {/* WO summary */}
              {selectedWO && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Work Order Summary</span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                    <div className="flex flex-col"><span className="text-slate-400 text-[9px] uppercase font-semibold">WO Number</span><span className="font-bold text-slate-800 font-mono">{selectedWO.woNumber}</span></div>
                    <div className="flex flex-col"><span className="text-slate-400 text-[9px] uppercase font-semibold">Product</span><span className="font-bold text-slate-800">{selectedWO.product?.name ?? '—'}</span></div>
                    <div className="flex flex-col"><span className="text-slate-400 text-[9px] uppercase font-semibold">Source Batch</span><span className="font-bold text-slate-800 font-mono">{selectedWO.batchNumber ?? '—'}</span></div>
                    <div className="flex flex-col"><span className="text-slate-400 text-[9px] uppercase font-semibold">Failed Qty (approx)</span><span className="font-bold text-slate-800">{selectedWO.actualRejected ?? selectedWO.requiredQty} units</span></div>
                  </div>
                </div>
              )}

              {/* Batch & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Source Batch No</label>
                  <input type="text" readOnly className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 font-mono"
                    value={formSourceBatch} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Repack Type *</label>
                  <select required className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-[#00891D]"
                    value={formRepackType} onChange={e => setFormRepackType(e.target.value)}>
                    {REPACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Yield & Waste */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Recovered Yield Qty *</label>
                  <input type="number" required min={0} className="w-full p-2 border border-emerald-200 rounded-lg text-sm font-bold text-emerald-700 bg-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={formRecoveredQty} onChange={e => setFormRecoveredQty(Number(e.target.value))} />
                  <p className="text-[9px] text-emerald-600 mt-1">Quantity successfully saved for repackaging.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-600 uppercase mb-1">Waste / Discard Qty *</label>
                  <input type="number" required min={0} className="w-full p-2 border border-rose-200 rounded-lg text-sm font-bold text-rose-700 bg-rose-50 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    value={formWasteQty} onChange={e => setFormWasteQty(Number(e.target.value))} />
                  <p className="text-[9px] text-rose-600 mt-1">Quantity permanently lost or discarded.</p>
                </div>
              </div>

              {/* Signature */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Operator Signature *</label>
                <input type="text" required placeholder="Type your initials"
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00891D]"
                  value={formSignature} onChange={e => setFormSignature(e.target.value)} />
              </div>

              {/* Submit */}
              <div className="border-t border-slate-100 pt-5 flex justify-end gap-3 -mx-6 -mb-6 p-4 bg-slate-50 rounded-b-xl">
                <button type="button" onClick={() => { setIsFormOpen(false); setSelectedWO(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-[#00891D] hover:bg-[#006b17] text-white rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center gap-2">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? 'Logging...' : 'Submit Repack Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
