import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck, X, Image as ImageIcon, Filter, Clock, CheckCircle, AlertTriangle,
  Users, Search, ChevronDown, RefreshCw, Loader2, Package,
} from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { qualityCheckService } from '../api/qualityCheckService';
import { workOrderService } from '../api/workOrderService';
import type { QCRecord, PendingQCWorkOrder, QCUser } from '../api/qualityCheckService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (dateStr?: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()} ${d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
};

const RESULT_LABEL: Record<string, string> = {
  PASS: 'Passed', PARTIAL_PASS: 'Partial Pass', FAIL: 'Failed', REWORK: 'Rework', DISCARD: 'Discard',
};
const PRIORITY_LABEL: Record<string, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent' };
const PRIORITY_COLOR = (p: string) => p === 'HIGH' || p === 'URGENT' ? 'text-red-600 font-bold' : p === 'MEDIUM' ? 'text-yellow-600 font-semibold' : 'text-gray-500';

const STATUS_BADGE: Record<string, string> = {
  'QC Pending':               'bg-amber-50 text-amber-700 border-amber-200',
  'Labels Applied':           'bg-blue-50 text-blue-700 border-blue-200',
  'Labels Printed':           'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Application Assigned':     'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Application In Progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Packing Completed':        'bg-teal-50 text-teal-700 border-teal-200',
  'Passed':                   'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Partial Pass':             'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Failed':                   'bg-rose-50 text-rose-700 border-rose-200',
  'Rework':                   'bg-orange-50 text-orange-700 border-orange-200',
  'Discard':                  'bg-rose-50 text-rose-700 border-rose-200',
};
const STATUS_DOT: Record<string, string> = {
  'QC Pending': 'bg-amber-400',
  'Labels Applied': 'bg-blue-400',
  'Labels Printed': 'bg-indigo-400',
  'Application Assigned': 'bg-indigo-400',
  'Application In Progress': 'bg-indigo-400',
  'Packing Completed': 'bg-teal-400',
  'Passed': 'bg-emerald-500',
  'Partial Pass': 'bg-emerald-400',
  'Failed': 'bg-rose-500',
  'Rework': 'bg-orange-400',
  'Discard': 'bg-rose-500',
};
const RESULT_BADGE = (r: string) =>
  r === 'PASS' || r === 'PARTIAL_PASS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
  r === 'FAIL' || r === 'DISCARD' ? 'bg-rose-50 text-rose-700 border-rose-200' :
  r === 'REWORK' ? 'bg-orange-50 text-orange-700 border-orange-200' :
  'bg-gray-50 text-gray-500 border-gray-200';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TableRow {
  _type: 'PENDING' | 'COMPLETED';
  id: string;
  woId: string;
  woNumber: string;
  productName: string;
  batchNumber: string;
  packedTime: string;
  packedBy: string;
  assignedTo: string;
  displayStatus: string;
  priority: string;
  rawQC?: QCRecord;
  rawWO?: PendingQCWorkOrder;
}

const DEFAULT_CHECKS = {
  sealIntegrity: true, packagingDamage: true, tamperCheck: true,
  weightAccuracy: true, quantityVerification: true, productAppearance: true,
  barcodeReadability: true, labelPlacement: true, mrpVerification: true,
  manufacturingDate: true, expiryDate: true,
};

const CHECKLIST_SECTIONS = [
  { section: 'Packaging', color: 'text-blue-600', items: [
    { key: 'sealIntegrity', label: 'Seal Integrity' }, { key: 'packagingDamage', label: 'Packaging Damage' }, { key: 'tamperCheck', label: 'Tamper Check' }
  ] as { key: keyof typeof DEFAULT_CHECKS; label: string }[] },
  { section: 'Product', color: 'text-violet-600', items: [
    { key: 'weightAccuracy', label: 'Weight Accuracy' }, { key: 'quantityVerification', label: 'Quantity Verification' }, { key: 'productAppearance', label: 'Product Appearance' }
  ] as { key: keyof typeof DEFAULT_CHECKS; label: string }[] },
  { section: 'Label', color: 'text-emerald-600', items: [
    { key: 'barcodeReadability', label: 'Barcode Readability' }, { key: 'labelPlacement', label: 'Label Placement' },
    { key: 'mrpVerification', label: 'MRP Verification' }, { key: 'manufacturingDate', label: 'Mfg Date' }, { key: 'expiryDate', label: 'Expiry Date' }
  ] as { key: keyof typeof DEFAULT_CHECKS; label: string }[] },
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
export const QualityCheck: React.FC = () => {
  // ── data ──
  const [pendingWOs, setPendingWOs]       = useState<PendingQCWorkOrder[]>([]);
  const [completedQCs, setCompletedQCs]   = useState<QCRecord[]>([]);
  const [inspectors, setInspectors]       = useState<QCUser[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshKey, setRefreshKey]       = useState(0);

  // ── filters ──
  const [search,          setSearch]          = useState('');
  const [filterStatus,    setFilterStatus]    = useState('');
  const [filterInspector, setFilterInspector] = useState('');
  const [filterPriority,  setFilterPriority]  = useState('');
  const [filterBatch,     setFilterBatch]     = useState('');
  const [filterWO,        setFilterWO]        = useState('');
  const [filterProduct,   setFilterProduct]   = useState('');

  // ── assign bar ──
  const [assignWO,       setAssignWO]       = useState('');
  const [assignTo,       setAssignTo]       = useState('');
  const [assignPriority, setAssignPriority] = useState('HIGH');
  const [assignTime,     setAssignTime]     = useState('30 mins');

  // ── modals ──
  const [selectedQC,  setSelectedQC]  = useState<QCRecord | null>(null);
  const [isFormOpen,  setIsFormOpen]  = useState(false);
  const [selectedWO,  setSelectedWO]  = useState<PendingQCWorkOrder | null>(null);
  const [previewPhoto,setPreviewPhoto] = useState<string | null>(null);

  // ── form fields ──
  const [formBatchNo,       setFormBatchNo]       = useState('');
  const [formCheckedQty,    setFormCheckedQty]    = useState(10);
  const [formPackedQty,     setFormPackedQty]     = useState(0);
  const [formInspectionType,setFormInspectionType]= useState('Sampling Inspection');
  const [formResult,        setFormResult]        = useState('PASS');
  const [formSeverity,      setFormSeverity]      = useState('MINOR');
  const [formFailureReason, setFormFailureReason] = useState('');
  const [formRemarks,       setFormRemarks]       = useState('');
  const [formSignature,     setFormSignature]     = useState('');
  const [formPhotos,        setFormPhotos]        = useState<{id:string;url:string;file:File}[]>([]);
  const [checks,            setChecks]            = useState({...DEFAULT_CHECKS});
  const [submitting,        setSubmitting]        = useState(false);

  // ─── Load ────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [woRes, qcRes, userRes] = await Promise.all([
        qualityCheckService.getPendingQCWorkOrders(),
        qualityCheckService.getQualityChecks(),
        qualityCheckService.getUsers(),
      ]);
      setPendingWOs(woRes);
      setCompletedQCs(qcRes.data || []);
      setInspectors(userRes || []);
    } catch (err) {
      console.error('Failed to load QC data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll(true);
    const interval = setInterval(() => loadAll(false), 5000);
    return () => clearInterval(interval);
  }, [loadAll, refreshKey]);

  // ─── KPIs ────────────────────────────────────────────────────────────────
  const todayStr = new Date().toDateString();
  const passedToday = useMemo(() =>
    completedQCs.filter(q => new Date(q.createdAt).toDateString() === todayStr && (q.result === 'PASS' || q.result === 'PARTIAL_PASS')).length,
  [completedQCs]);
  const failedToday = useMemo(() =>
    completedQCs.filter(q => new Date(q.createdAt).toDateString() === todayStr && (q.result === 'REJECT' || q.result === 'DISCARD')).length,
  [completedQCs]);
  const reworkCount = completedQCs.filter(q => q.result === 'REWORK').length;

  // ─── Table rows ───────────────────────────────────────────────────────────
  const unifiedData = useMemo<TableRow[]>(() => {
    const rows: TableRow[] = [];
    pendingWOs.forEach(wo => rows.push({
      _type: 'PENDING', id: `PENDING-${wo.id}`, woId: wo.id,
      woNumber: wo.woNumber, productName: wo.product?.name ?? '—',
      batchNumber: wo.batchNumber ?? '—',
      packedTime: wo.updatedAt,
      packedBy: wo.supervisor?.name ?? wo.operator?.name ?? '—',
      assignedTo: (wo as any).inspector?.name ?? 'Unassigned',
      displayStatus:
        wo.status === 'LABELS_APPLIED' ? 'Labels Applied' :
        wo.status === 'LABEL_APPLICATION_ASSIGNED' ? 'Application Assigned' :
        wo.status === 'LABEL_APPLICATION_IN_PROGRESS' ? 'Application In Progress' :
        wo.status === 'LABELS_PRINTED' ? 'Labels Printed' :
        wo.status === 'PACKING_COMPLETED' ? 'Packing Completed' : 'QC Pending',
      priority: wo.priority, rawWO: wo,
    }));
    completedQCs.forEach(qc => rows.push({
      _type: 'COMPLETED', id: qc.id, woId: qc.woId,
      woNumber: qc.workOrder?.woNumber ?? '—',
      productName: qc.workOrder?.product?.name ?? '—',
      batchNumber: qc.workOrder?.batchNumber ?? '—',
      packedTime: qc.workOrder?.updatedAt ?? qc.createdAt,
      packedBy: qc.workOrder?.operator?.name ?? qc.workOrder?.supervisor?.name ?? '—',
      assignedTo: qc.inspector?.name ?? '—',
      displayStatus: RESULT_LABEL[qc.result] ?? qc.result,
      priority: qc.workOrder?.priority ?? 'MEDIUM', rawQC: qc,
    }));
    return rows;
  }, [pendingWOs, completedQCs]);

  const filteredData = useMemo(() => {
    let d = unifiedData;
    if (filterStatus) {
      d = d.filter(r =>
        filterStatus === 'PENDING' ? r._type === 'PENDING' :
        filterStatus === 'COMPLETED' ? r._type === 'COMPLETED' :
        r.displayStatus === filterStatus
      );
    }
    if (filterInspector) d = d.filter(r => r.assignedTo === filterInspector);
    if (filterPriority)  d = d.filter(r => r.priority === filterPriority);
    if (filterBatch)     d = d.filter(r => r.batchNumber.toLowerCase().includes(filterBatch.toLowerCase()));
    if (filterWO)        d = d.filter(r => r.woNumber.toLowerCase().includes(filterWO.toLowerCase()));
    if (filterProduct)   d = d.filter(r => r.productName.toLowerCase().includes(filterProduct.toLowerCase()));
    if (search) {
      const t = search.toLowerCase();
      d = d.filter(r =>
        r.productName.toLowerCase().includes(t) || r.woNumber.toLowerCase().includes(t) ||
        r.batchNumber.toLowerCase().includes(t) || r.assignedTo.toLowerCase().includes(t)
      );
    }
    return d;
  }, [unifiedData, filterStatus, filterInspector, filterPriority, filterBatch, filterWO, filterProduct, search]);

  // ─── Task Assignment ──────────────────────────────────────────────────────
  const handleAssignTask = async () => {
    if (!assignWO || !assignTo) return;
    try {
      const wo = pendingWOs.find(w => w.id === assignWO);
      if (!wo) return;
      await workOrderService.updateWorkOrderStatus(assignWO, wo.status, { 
        inspectorId: assignTo, 
        priority: assignPriority 
      });
      const assignedInspector = inspectors.find(i => i.id === assignTo);
      alert(`Inspection task assigned to ${assignedInspector?.name || 'QC Inspector'}. It will reflect in their QC portal.`);
      setAssignWO('');
      setAssignTo('');
      loadAll(false);
    } catch (err: any) {
      console.error('Failed to assign task', err);
      alert(err.response?.data?.message || err.message || 'Failed to assign inspector task');
    }
  };

  // ─── Form helpers ─────────────────────────────────────────────────────────
  const openForm = (wo: PendingQCWorkOrder) => {
    setSelectedWO(wo);
    const packed = wo.actualProduced ?? wo.requiredQty;
    setFormPackedQty(packed);
    setFormCheckedQty(Math.max(1, Math.round(packed * 0.2)));
    setFormBatchNo(wo.batchNumber ?? `BATCH-${wo.woNumber.split('-').pop()}`);
    setFormInspectionType('Sampling Inspection');
    setFormResult('PASS'); setFormSeverity('MINOR');
    setFormFailureReason(''); setFormRemarks(''); setFormSignature('');
    setFormPhotos([]); setChecks({...DEFAULT_CHECKS});
    setIsFormOpen(true);
  };

  const handleCheckboxChange = (key: keyof typeof checks) => {
    const u = { ...checks, [key]: !checks[key] };
    setChecks(u);
    setFormResult(Object.values(u).every(v => v) ? 'PASS' : 'REWORK');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFormPhotos(prev => [...prev, ...Array.from(e.target.files!).map(f => ({
      id: Math.random().toString(36).slice(2), url: URL.createObjectURL(f), file: f,
    }))]);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWO) return;
    setSubmitting(true);
    try {
      await qualityCheckService.submitQualityCheck({
        woId: selectedWO.id, checkedQty: formCheckedQty, result: formResult,
        severity: ['REWORK','REJECT','DISCARD'].includes(formResult) ? formSeverity : undefined,
        failureReason: ['REWORK','REJECT','DISCARD'].includes(formResult) ? formFailureReason : undefined,
        remarks: formRemarks, checksPayload: checks,
      });
      setIsFormOpen(false); setSelectedWO(null);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to submit inspection.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearch(''); setFilterStatus(''); setFilterInspector('');
    setFilterPriority(''); setFilterBatch(''); setFilterWO(''); setFilterProduct('');
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();

  return (
    <div className="w-full px-2 md:px-4 pb-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-4 mt-3">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Quality Check</h1>
        <Breadcrumbs />
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[
          { label: 'Pending Assignment', value: loading ? '…' : pendingWOs.length,      icon: <Clock size={20}/>,        bg: 'bg-orange-100', color: 'text-orange-600' },
          { label: 'QC Inspectors',      value: loading ? '…' : inspectors.length,      icon: <Users size={20}/>,        bg: 'bg-blue-100',   color: 'text-blue-600' },
          { label: 'Rework',             value: loading ? '…' : reworkCount,            icon: <Package size={20}/>,      bg: 'bg-amber-100',  color: 'text-amber-600' },
          { label: 'Passed Today',       value: loading ? '…' : passedToday,            icon: <CheckCircle size={20}/>,  bg: 'bg-green-100',  color: 'text-green-600' },
          { label: 'Failed Today',       value: loading ? '…' : failedToday,            icon: <AlertTriangle size={20}/>,bg: 'bg-red-100',    color: 'text-red-500' },
          { label: 'Total QC Done',      value: loading ? '…' : completedQCs.length,    icon: <ShieldCheck size={20}/>,  bg: 'bg-purple-100', color: 'text-purple-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 shadow-sm px-3 py-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c.bg} ${c.color}`}>{c.icon}</div>
            <div className="min-w-0">
              <div className="text-[10px] text-gray-500 font-medium leading-tight truncate">{c.label}</div>
              <div className="text-lg font-bold text-gray-900 leading-tight">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Assign Task Bar ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-5">
        {/* top strip */}
        <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-800">Assign Inspection Task</span>
          <button
            onClick={() => { setSelectedWO(null); setIsFormOpen(true); }}
            className="flex items-center gap-1.5 bg-[#00891D] hover:bg-[#006b17] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <ShieldCheck size={14} /> New Inspection Log
          </button>
        </div>

        {/* fields row */}
        <div className="px-4 py-3 flex flex-wrap gap-x-4 gap-y-3 items-end">

          {/* Select Product / WO */}
          <Sel label="Select Product / Work Order" value={assignWO} onChange={setAssignWO} className="min-w-[220px]">
            <option value="">-- Choose pending WO --</option>
            {pendingWOs.map(wo => (
              <option key={wo.id} value={wo.id}>
                {wo.woNumber} — {wo.product?.name ?? 'Unknown'}
              </option>
            ))}
          </Sel>

          {/* Assign To */}
          <Sel label="Assign To (QC Inspector)" value={assignTo} onChange={setAssignTo} className="min-w-[180px]">
            <option value="">{inspectors.length === 0 ? 'No inspectors found' : '-- Select Inspector --'}</option>
            {inspectors.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Sel>

          {/* Priority */}
          <Sel label="Priority" value={assignPriority} onChange={setAssignPriority} className="w-32">
            {(['LOW','MEDIUM','HIGH','URGENT'] as const).map(p => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </Sel>

          {/* Expected Time */}
          <Sel label="Expected Time" value={assignTime} onChange={setAssignTime} className="w-28">
            {['15 mins','30 mins','45 mins','1 hour','2 hours'].map(t => <option key={t}>{t}</option>)}
          </Sel>

          {/* Assign button */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-transparent select-none">Action</span>
            <button
              disabled={!assignWO || !assignTo}
              className="flex items-center gap-1.5 bg-[#00891D] hover:bg-[#006b17] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              onClick={handleAssignTask}
            >
              <Users size={14} /> Assign Inspector
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
        {/* header */}
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Filters</span>
        </div>

        {/* filter controls */}
        <div className="px-4 py-3 flex flex-wrap gap-x-3 gap-y-3 items-end">

          {/* Status */}
          <Sel label="Status" value={filterStatus} onChange={setFilterStatus} className="w-36">
            <option value="">All Status</option>
            <option value="PENDING">Pending QC</option>
            <option value="COMPLETED">Completed</option>
            <option value="Passed">Passed</option>
            <option value="Partial Pass">Partial Pass</option>
            <option value="Failed">Failed</option>
            <option value="Rework">Rework</option>
            <option value="Discard">Discard</option>
          </Sel>

          {/* Inspector */}
          <Sel label="Inspector" value={filterInspector} onChange={setFilterInspector} className="w-44">
            <option value="">All Inspectors</option>
            {inspectors.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
          </Sel>

          {/* Priority */}
          <Sel label="Priority" value={filterPriority} onChange={setFilterPriority} className="w-32">
            <option value="">All Priority</option>
            {(['LOW','MEDIUM','HIGH','URGENT'] as const).map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
          </Sel>

          {/* Batch No */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase">Batch No</span>
            <input value={filterBatch} onChange={e => setFilterBatch(e.target.value)}
              placeholder="BATCH-…"
              className="border border-gray-200 rounded-lg pl-3 pr-3 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#00891D] w-32" />
          </div>

          {/* Work Order */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase">Work Order</span>
            <input value={filterWO} onChange={e => setFilterWO(e.target.value)}
              placeholder="WO-…"
              className="border border-gray-200 rounded-lg pl-3 pr-3 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#00891D] w-32" />
          </div>

          {/* Product */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase">Product</span>
            <input value={filterProduct} onChange={e => setFilterProduct(e.target.value)}
              placeholder="Product name"
              className="border border-gray-200 rounded-lg pl-3 pr-3 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#00891D] w-36" />
          </div>

          {/* Search */}
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <span className="text-[10px] font-semibold text-gray-500 uppercase">Search</span>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search orders, batches, products..."
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#00891D]" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-transparent select-none">Action</span>
            <div className="flex gap-2">
              <button onClick={resetFilters}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer">
                Reset
              </button>
              <button onClick={() => setRefreshKey(k => k + 1)}
                className="px-3 py-2 bg-[#00891D] text-white rounded-lg text-xs font-bold hover:bg-[#006b17] cursor-pointer flex items-center gap-1">
                <RefreshCw size={11} /> Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading quality check data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto table-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['PRODUCT / WORK ORDER','BATCH NO','TIME AND DATE','ASSIGNED TO','STATUS','PRIORITY','ACTION'].map(h => (
                    <th key={h} className={`px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap ${h === 'ACTION' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">No quality check records found.</td></tr>
                ) : filteredData.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 text-xs">{row.productName}</div>
                      <div className="font-mono text-[10px] text-gray-400">{row.woNumber}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.batchNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">
                      {fmt(row.packedTime)}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700">
                      <span className={row.assignedTo === 'Unassigned' || row.assignedTo === '—' ? 'text-gray-400 font-normal italic' : 'text-gray-800 font-semibold'}>
                        {row.assignedTo}
                      </span>
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
                          className="bg-[#00891D] hover:bg-[#006b17] text-white font-semibold px-3 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer">
                          View Status
                        </button>
                      ) : (
                        <button onClick={() => row.rawQC && setSelectedQC(row.rawQC)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold px-3 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer">
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
            &nbsp;·&nbsp;{pendingWOs.length} pending&nbsp;·&nbsp;{completedQCs.length} completed
          </div>
        )}
      </div>

      {/* ── QC Detail Modal ────────────────────────────────────────── */}
      {selectedQC && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 text-left space-y-4 max-h-[90vh] overflow-y-auto sidebar-scrollbar">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 sticky top-0 bg-white">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400">{selectedQC.qcNumber}</span>
                <h3 className="font-bold text-slate-800 text-base">{selectedQC.workOrder?.product?.name ?? '—'}</h3>
              </div>
              <button onClick={() => setSelectedQC(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-rose-600 cursor-pointer">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div><strong>QC No:</strong> {selectedQC.qcNumber}</div>
              <div><strong>Work Order:</strong> {selectedQC.workOrder?.woNumber ?? '—'}</div>
              <div><strong>Inspector:</strong> {selectedQC.inspector?.name ?? '—'}</div>
              <div><strong>Date:</strong> {fmt(selectedQC.createdAt)}</div>
              <div><strong>Checked Qty:</strong> {selectedQC.checkedQty}</div>
              <div><strong>Batch No:</strong> {selectedQC.workOrder?.batchNumber ?? '—'}</div>
              <div className="col-span-2">
                <strong>Result:</strong>{' '}
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${RESULT_BADGE(selectedQC.result)}`}>
                  {RESULT_LABEL[selectedQC.result] ?? selectedQC.result}
                </span>
              </div>
              {selectedQC.severity && <div><strong>Severity:</strong> {selectedQC.severity}</div>}
              {selectedQC.failureReason && <div className="col-span-2"><strong>Failure Reason:</strong> {selectedQC.failureReason}</div>}
            </div>

            {selectedQC.checksPayload && Object.keys(selectedQC.checksPayload).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Inspection Checklist</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedQC.checksPayload).map(([key, passed]) => (
                    <div key={key} className="flex justify-between p-2 border border-slate-100 rounded-md bg-white">
                      <span className="capitalize text-slate-700">{key.replace(/([A-Z])/g,' $1').trim()}</span>
                      <span className={passed ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{passed ? '✓' : '✗'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedQC.remarks && (
              <div className="text-xs border-t border-slate-100 pt-3">
                <strong>Remarks:</strong>
                <p className="text-slate-600 mt-1 italic">{selectedQC.remarks}</p>
              </div>
            )}

            <div className="pt-3 flex justify-end">
              <button onClick={() => setSelectedQC(null)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── QC Form Modal ──────────────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white rounded-t-xl sticky top-0 z-10">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShieldCheck size={18} /> Quality Inspection Checklist Log
              </h3>
              <button onClick={() => { setIsFormOpen(false); setSelectedWO(null); }} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 flex-1 text-left text-xs">

              {/* WO selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Work Order *</label>
                <select required
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00891D]"
                  value={selectedWO?.id ?? ''}
                  onChange={e => { const wo = pendingWOs.find(w => w.id === e.target.value); if (wo) openForm(wo); }}
                >
                  <option value="">-- Choose Pending QC Batch --</option>
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
                    <div className="flex flex-col"><span className="text-slate-400 text-[9px] uppercase font-semibold">Batch Number</span><span className="font-bold text-slate-800 font-mono">{selectedWO.batchNumber ?? '—'}</span></div>
                    <div className="flex flex-col"><span className="text-slate-400 text-[9px] uppercase font-semibold">Required Qty</span><span className="font-bold text-slate-800">{selectedWO.requiredQty} units</span></div>
                    <div className="flex flex-col col-span-2">
                      <span className="text-slate-400 text-[9px] uppercase font-semibold">Status</span>
                      <span className={`mt-0.5 inline-block w-fit px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE['QC Pending']}`}>{selectedWO.status}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Batch & Inspection type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Batch Number</label>
                  <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#00891D]"
                    value={formBatchNo} onChange={e => setFormBatchNo(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Inspection Type *</label>
                  <select required className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#00891D]"
                    value={formInspectionType} onChange={e => setFormInspectionType(e.target.value)}>
                    <option>100% Inspection</option><option>Sampling Inspection</option><option>Random Inspection</option>
                  </select>
                </div>
              </div>

              {/* Qty + Sampling % */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Packed Qty</label>
                  <input type="number" readOnly className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 font-mono" value={formPackedQty} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Checked Qty *</label>
                  <input type="number" required min={1} className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#00891D]"
                    value={formCheckedQty} onChange={e => setFormCheckedQty(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sampling %</label>
                  <div className={`w-full p-2 border rounded-lg text-sm font-bold text-center ${
                    formPackedQty > 0
                      ? (() => { const p = Math.min(100, Math.round(formCheckedQty/formPackedQty*100)); return p>=50?'bg-emerald-50 border-emerald-200 text-emerald-700':p>=20?'bg-amber-50 border-amber-200 text-amber-700':'bg-rose-50 border-rose-200 text-rose-700'; })()
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>{formPackedQty>0?`${Math.min(100,Math.round(formCheckedQty/formPackedQty*100))}%`:'—'}</div>
                </div>
              </div>

              {/* Checklist */}
              <div className="border border-slate-100 rounded-lg bg-slate-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-200 bg-slate-100">
                  <span className="font-bold text-[10px] text-slate-500 uppercase">Verification Checklist</span>
                </div>
                {CHECKLIST_SECTIONS.map(({ section, color, items }) => (
                  <div key={section} className="px-3 pt-2.5 pb-3 space-y-2 border-b border-slate-100 last:border-b-0">
                    <span className={`block text-[10px] font-bold uppercase ${color}`}>{section}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {items.map(({ key, label }) => (
                        <label key={key} className={`flex items-center gap-2 bg-white border p-2 rounded-lg cursor-pointer transition-colors ${checks[key] ? 'border-slate-200' : 'border-rose-200'}`}>
                          <input type="checkbox" className="rounded accent-[#00891D] shrink-0" checked={checks[key]} onChange={() => handleCheckboxChange(key)} />
                          <span className="text-[11px] font-medium text-slate-700 leading-tight">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* QC Decision + Photo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">QC Decision *</label>
                  <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-[#00891D]"
                    value={formResult} onChange={e => { setFormResult(e.target.value); if (!['REWORK','REJECT','DISCARD'].includes(e.target.value)) setFormFailureReason(''); }}>
                    <option value="PASS">Pass (Post to FG)</option>
                    <option value="PARTIAL_PASS">Partial Pass</option>
                    <option value="REWORK">Rework Required</option>
                    <option value="REJECT">Fail Batch</option>
                    <option value="DISCARD">Discard Batch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Photo Evidence</label>
                  <label className="w-full h-[42px] px-3 rounded-lg border border-dashed border-slate-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-500">
                    <ImageIcon size={14} /> Upload photos
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              {/* Photo previews */}
              {formPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formPhotos.map(p => (
                    <div key={p.id} className="relative group w-14 h-14 rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                      <img src={p.url} className="object-cover w-full h-full cursor-pointer" onClick={() => setPreviewPhoto(p.url)} />
                      <button type="button" onClick={() => setFormPhotos(prev => prev.filter(x => x.id !== p.id))}
                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 text-rose-500 shadow opacity-0 group-hover:opacity-100">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Failure fields */}
              {['REWORK','REJECT','DISCARD'].includes(formResult) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Severity *</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold focus:outline-none" value={formSeverity} onChange={e => setFormSeverity(e.target.value)}>
                      <option value="MINOR">Minor</option><option value="MAJOR">Major</option><option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Failure Reason *</label>
                    <select required className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold focus:outline-none" value={formFailureReason} onChange={e => setFormFailureReason(e.target.value)}>
                      <option value="">-- Select Reason --</option>
                      <option>Seal Defect</option><option>Barcode Issue</option><option>Label Error</option>
                      <option>Weight Mismatch</option><option>Packaging Damage</option><option>Expiry Date Error</option>
                      <option>MRP Error</option><option>Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Inspector + Signature */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Inspector Name</label>
                  <input type="text" readOnly className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600"
                    value={currentUser?.name ?? 'Inspector'} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Digital Signature *</label>
                  <input type="text" required placeholder="Type your initials"
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00891D]"
                    value={formSignature} onChange={e => setFormSignature(e.target.value)} />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks</label>
                <textarea rows={3} className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#00891D]"
                  placeholder="Notes on packaging flaws, seal integrity issues..."
                  value={formRemarks} onChange={e => setFormRemarks(e.target.value)} />
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
                  {submitting ? 'Submitting…' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo lightbox */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewPhoto(null)}>
          <div className="relative max-w-4xl max-h-full">
            <button className="absolute -top-4 -right-4 bg-white rounded-full p-1 shadow hover:bg-slate-100 cursor-pointer" onClick={() => setPreviewPhoto(null)}>
              <X size={20} />
            </button>
            <img src={previewPhoto} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
};
