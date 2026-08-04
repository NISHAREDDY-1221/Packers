import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Filter, Download, GitCommit,
  CheckCircle, RefreshCw, UserCheck, DollarSign, AlertTriangle,
  Trash2, Info
} from 'lucide-react';

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const Reports: React.FC = () => {
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [repackings, setRepackings]       = useState<any[]>([]);
  const [qualityChecks, setQualityChecks] = useState<any[]>([]);
  const [loadingFG, setLoadingFG]         = useState(true);
  const [loadingRP, setLoadingRP]         = useState(true);
  const [loadingQC, setLoadingQC]         = useState(true);

  useEffect(() => {
    api.get('/workflows/finished-goods?limit=500').then(res => {
      setFinishedGoods(res.data.data?.data || res.data.data || []);
    }).catch(console.error).finally(() => setLoadingFG(false));

    api.get('/workflows/repacking?limit=500').then(res => {
      setRepackings(res.data.data?.data || res.data.data || []);
    }).catch(console.error).finally(() => setLoadingRP(false));

    api.get('/workflows/quality-checks?limit=500').then(res => {
      setQualityChecks(res.data.data?.data || res.data.data || []);
    }).catch(console.error).finally(() => setLoadingQC(false));
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'packing';
  const handleTabChange = (tabId: string) => setSearchParams({ tab: tabId });

  // Filters
  const [filterDate,       setFilterDate]       = useState('');
  const [filterProduct,    setFilterProduct]    = useState('All');
  const [filterBatch,      setFilterBatch]      = useState('');
  const [filterStatus,     setFilterStatus]     = useState('All');
  const [filterCategory,   setFilterCategory]   = useState('All');
  const [filterEmployee,   setFilterEmployee]   = useState('All');
  const [filterWorkOrder,  setFilterWorkOrder]  = useState('All');
  const [filterSupervisor, setFilterSupervisor] = useState('All');
  const [filterMachine,    setFilterMachine]    = useState('All');
  const [filterLocation,   setFilterLocation]   = useState('All');

  const resetFilters = () => {
    setFilterDate(''); setFilterProduct('All'); setFilterBatch('');
    setFilterStatus('All'); setFilterCategory('All'); setFilterEmployee('All');
    setFilterWorkOrder('All'); setFilterSupervisor('All');
    setFilterMachine('All'); setFilterLocation('All');
  };

  // Derived filter options from real data
  const productOptions = useMemo(() => {
    const names = new Set<string>();
    finishedGoods.forEach(fg => { if (fg.product?.name) names.add(fg.product.name); });
    qualityChecks.forEach(qc => { if (qc.workOrder?.product?.name) names.add(qc.workOrder.product.name); });
    return Array.from(names).sort();
  }, [finishedGoods, qualityChecks]);

  const batchOptions = useMemo(() => {
    const batches = new Set<string>();
    finishedGoods.forEach(fg => { if (fg.batchNumber) batches.add(fg.batchNumber); });
    return Array.from(batches).sort();
  }, [finishedGoods]);

  // Filtered datasets
  const filteredFG = useMemo(() => finishedGoods.filter(fg => {
    if (filterProduct !== 'All' && fg.product?.name !== filterProduct) return false;
    if (filterBatch && fg.batchNumber !== filterBatch) return false;
    if (filterDate && fg.createdAt && !fg.createdAt.startsWith(filterDate)) return false;
    return true;
  }), [finishedGoods, filterProduct, filterBatch, filterDate]);

  const filteredRP = useMemo(() => repackings.filter(rp => {
    if (filterProduct !== 'All' && rp.sourceWorkOrder?.product?.name !== filterProduct) return false;
    return true;
  }), [repackings, filterProduct]);

  const rejectedQCs = useMemo(() => qualityChecks.filter(qc => {
    if (!['REJECT', 'REWORK', 'DISCARD'].includes(qc.result)) return false;
    if (filterProduct !== 'All' && qc.workOrder?.product?.name !== filterProduct) return false;
    return true;
  }), [qualityChecks, filterProduct]);

  const reportsList = [
    { id: 'packing',      label: 'Packing Report',       icon: CheckCircle },
    { id: 'repacking',   label: 'Repacking Report',     icon: RefreshCw },
    { id: 'employee',    label: 'Employee Productivity', icon: UserCheck },
    { id: 'traceability',label: 'Batch Traceability',   icon: GitCommit },
    { id: 'cost',        label: 'Cost Report',          icon: DollarSign },
    { id: 'rejected',    label: 'Rejected Report',      icon: AlertTriangle },
    { id: 'waste',       label: 'Waste Report',         icon: Trash2 },
  ];

  const handleExport = (type: 'Excel' | 'PDF') => {
    toast.success(`Exporting current report (${activeTab.toUpperCase()}) as ${type}. Feature coming soon.`);
  };

  const EmptyRow = ({ cols, message = 'No records found.' }: { cols: number; message?: string }) => (
    <tr><td colSpan={cols} className="p-6 text-center text-slate-400 text-xs">{message}</td></tr>
  );

  const LoadingRow = ({ cols }: { cols: number }) => (
    <tr><td colSpan={cols} className="p-6 text-center text-slate-400 text-xs animate-pulse">Loading...</td></tr>
  );

  const renderReportContent = () => {
    switch (activeTab) {

      case 'packing':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Packing Production Log — Finished Goods Posted</h3>
              <span className="text-xs text-slate-500 font-medium">{filteredFG.length} records</span>
            </div>
            <div className="overflow-x-auto table-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">FG Date</th>
                    <th className="p-3">FG No</th>
                    <th className="p-3">Work Order</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3 text-center">Posted Qty</th>
                    <th className="p-3">Destination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingFG ? <LoadingRow cols={7} /> : filteredFG.length === 0 ? <EmptyRow cols={7} /> :
                    filteredFG.map(fg => (
                      <tr key={fg.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-500">{fmt(fg.createdAt)}</td>
                        <td className="p-3 font-mono font-semibold text-slate-500">{fg.fgNumber || '—'}</td>
                        <td className="p-3 font-mono font-semibold">{fg.workOrder?.woNumber || '—'}</td>
                        <td className="p-3 font-semibold text-slate-700">{fg.product?.name || '—'}</td>
                        <td className="p-3 font-mono text-slate-600">{fg.batchNumber || '—'}</td>
                        <td className="p-3 text-center font-bold">{fg.postedQty}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">{fg.destination}</span></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'repacking':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Repacking Recovery Summary</h3>
              <span className="text-xs text-slate-500 font-medium">{filteredRP.length} records</span>
            </div>
            <div className="overflow-x-auto table-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">RP No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-center">Recovered Qty</th>
                    <th className="p-3 text-center">Waste Qty</th>
                    <th className="p-3">New Batch No</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingRP ? <LoadingRow cols={7} /> : filteredRP.length === 0 ? <EmptyRow cols={7} /> :
                    filteredRP.map(rp => (
                      <tr key={rp.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-semibold text-slate-500">{rp.rpNumber}</td>
                        <td className="p-3 text-slate-500">{fmt(rp.createdAt)}</td>
                        <td className="p-3 font-semibold text-slate-700">{rp.sourceWorkOrder?.product?.name || '—'}</td>
                        <td className="p-3 text-slate-600">{rp.repackType}</td>
                        <td className="p-3 text-center font-bold text-green-700">+{rp.recoverableQty}</td>
                        <td className="p-3 text-center font-bold text-rose-600">-{rp.wasteQty}</td>
                        <td className="p-3 font-mono text-[11px]">{rp.newBatchNumber || '—'}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'rejected':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">QC Rejections Log</h3>
              <span className="text-xs text-slate-500 font-medium">{rejectedQCs.length} records</span>
            </div>
            <div className="overflow-x-auto table-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">QC No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Work Order</th>
                    <th className="p-3 text-center">Inspected Qty</th>
                    <th className="p-3">Result</th>
                    <th className="p-3">Failure Reason</th>
                    <th className="p-3">Inspector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingQC ? <LoadingRow cols={8} /> : rejectedQCs.length === 0 ? <EmptyRow cols={8} message="No rejection records found." /> :
                    rejectedQCs.map(qc => (
                      <tr key={qc.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-semibold text-slate-500">{qc.qcNumber}</td>
                        <td className="p-3 text-slate-500">{fmt(qc.createdAt)}</td>
                        <td className="p-3 font-semibold text-slate-700">{qc.workOrder?.product?.name || '—'}</td>
                        <td className="p-3 font-mono">{qc.workOrder?.woNumber || '—'}</td>
                        <td className="p-3 text-center font-bold">{qc.checkedQty}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            qc.result === 'REJECT' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            qc.result === 'REWORK' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'}`}>
                            {qc.result}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-[150px] truncate" title={qc.failureReason || '—'}>{qc.failureReason || '—'}</td>
                        <td className="p-3 text-slate-600">{typeof qc.inspector === 'string' ? qc.inspector : qc.inspector?.name || '—'}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'traceability':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Batch Genealogy &amp; Traceability Drill-down</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Trace Batch:</span>
                <input
                  type="text"
                  placeholder="Enter Batch No..."
                  className="px-2 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none"
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 font-mono text-xs space-y-4">
              <div className="flex items-center gap-2 text-green-700 font-bold">
                <GitCommit size={16} />
                <span>Genealogy Path for: {filterBatch || 'Enter a batch number above'}</span>
              </div>
              {filterBatch ? (() => {
                const fg = finishedGoods.find(f => f.batchNumber === filterBatch);
                const rp = repackings.find(r => r.newBatchNumber === filterBatch);
                const qc = qualityChecks.find(q => q.workOrder?.batchNumber === filterBatch);
                if (!fg && !rp && !qc) return <div className="text-slate-400 py-4">No matching batch found in the system.</div>;
                return (
                  <div className="space-y-3 pl-4 border-l-2 border-green-200 ml-2">
                    {fg && <div className="space-y-1">
                      <div className="text-green-600 font-bold">✓ Finished Goods Entry</div>
                      <div className="text-slate-600">FG No: {fg.fgNumber} | Posted: {fg.postedQty} units | Destination: {fg.destination}</div>
                    </div>}
                    {qc && <div className="space-y-1">
                      <div className="text-blue-600 font-bold">⚙ Quality Check Record</div>
                      <div className="text-slate-600">QC No: {qc.qcNumber} | Result: {qc.result} | Inspector: {typeof qc.inspector === 'string' ? qc.inspector : qc.inspector?.name}</div>
                    </div>}
                    {rp && <div className="space-y-1">
                      <div className="text-orange-600 font-bold">↺ Repacking Origin</div>
                      <div className="text-slate-600">RP No: {rp.rpNumber} | Recovered: {rp.recoverableQty} | Waste: {rp.wasteQty}</div>
                    </div>}
                  </div>
                );
              })() : <div className="text-slate-400 py-4">Enter a batch number above to trace its full history.</div>}
            </div>
          </div>
        );

      case 'cost':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Packing Cost Analysis — from Finished Goods Records</h3>
              <span className="text-xs text-slate-500 font-medium">{filteredFG.length} records</span>
            </div>
            <div className="overflow-x-auto table-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">FG Date</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3 text-center">Posted Qty</th>
                    <th className="p-3">Destination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingFG ? <LoadingRow cols={5} /> : filteredFG.length === 0 ? <EmptyRow cols={5} message="No cost records found. Post batches to Finished Goods first." /> :
                    filteredFG.map(fg => (
                      <tr key={fg.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-slate-500">{fmt(fg.createdAt)}</td>
                        <td className="p-3 font-semibold text-slate-700">{fg.product?.name || '—'}</td>
                        <td className="p-3 font-mono text-slate-600">{fg.batchNumber || '—'}</td>
                        <td className="p-3 text-center font-bold">{fg.postedQty}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">{fg.destination}</span></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'employee':
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Employee Productivity — QC Inspectors</h3>
            {(() => {
              const byInspector: Record<string, { name: string; count: number; passed: number; failed: number }> = {};
              qualityChecks.forEach(qc => {
                const name = typeof qc.inspector === 'string' ? qc.inspector : qc.inspector?.name || 'Unknown';
                if (!byInspector[name]) byInspector[name] = { name, count: 0, passed: 0, failed: 0 };
                byInspector[name].count++;
                if (['PASS', 'PARTIAL_PASS'].includes(qc.result)) byInspector[name].passed++;
                else byInspector[name].failed++;
              });
              const rows = Object.values(byInspector);
              return (
                <div className="overflow-x-auto table-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-3">Inspector Name</th>
                        <th className="p-3 text-center">Total QC Sessions</th>
                        <th className="p-3 text-center">Passed</th>
                        <th className="p-3 text-center">Failed / Rework</th>
                        <th className="p-3 text-center">Pass Rate %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingQC ? <LoadingRow cols={5} /> : rows.length === 0 ? <EmptyRow cols={5} /> :
                        rows.map(row => (
                          <tr key={row.name} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-800">{row.name}</td>
                            <td className="p-3 text-center font-bold">{row.count}</td>
                            <td className="p-3 text-center font-bold text-green-700">{row.passed}</td>
                            <td className="p-3 text-center font-bold text-rose-600">{row.failed}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${row.count > 0 && (row.passed / row.count) >= 0.8 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                {row.count > 0 ? Math.round((row.passed / row.count) * 100) : 0}%
                              </span>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        );

      case 'waste':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Spillage &amp; Scrap Waste Analysis — from Repacking Logs</h3>
              <span className="text-xs text-slate-500 font-medium">{filteredRP.length} records</span>
            </div>
            <div className="overflow-x-auto table-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">RP No</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Repack Type</th>
                    <th className="p-3 text-center">Recovered</th>
                    <th className="p-3 text-center">Waste Qty</th>
                    <th className="p-3 text-center">Waste Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingRP ? <LoadingRow cols={7} /> : filteredRP.length === 0 ? <EmptyRow cols={7} message="No waste records. Repacking not yet logged." /> :
                    filteredRP.map(rp => {
                      const total = (rp.recoverableQty || 0) + (rp.wasteQty || 0);
                      const wasteRate = total > 0 ? Math.round((rp.wasteQty / total) * 100) : 0;
                      return (
                        <tr key={rp.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-semibold text-slate-500">{rp.rpNumber}</td>
                          <td className="p-3 text-slate-500">{fmt(rp.createdAt)}</td>
                          <td className="p-3 font-semibold text-slate-700">{rp.sourceWorkOrder?.product?.name || '—'}</td>
                          <td className="p-3 text-slate-600">{rp.repackType}</td>
                          <td className="p-3 text-center font-bold text-green-700">{rp.recoverableQty}</td>
                          <td className="p-3 text-center font-bold text-rose-600">{rp.wasteQty}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${wasteRate > 20 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{wasteRate}%</span>
                          </td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6 text-center text-slate-400">
            <Info size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold">Select a report from the left panel.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 text-left pb-10">

      {/* 10 Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
          <Filter size={14} className="text-green-600" />
          <span>Report Query Filters (10 Dimension Options)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
            <input type="date" className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="All">Select...</option>
              <option>Staples</option><option>Festive</option><option>Spices</option><option>Dry Fruits</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Employee</label>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
              <option value="All">Select...</option>
              <option>Ramesh Kumar</option><option>Sita Sharma</option><option>Amit Patel</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Product</label>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none" value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
              <option value="All">Select...</option>
              {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Batch</label>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
              <option value="">All Batches</option>
              {batchOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Work Order</label>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none" value={filterWorkOrder} onChange={e => setFilterWorkOrder(e.target.value)}>
              <option value="All">Select...</option>
              {finishedGoods.map(fg => fg.workOrder?.woNumber).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map(wo => <option key={wo}>{wo}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Status</label>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">Select...</option>
              <option>COMPLETED</option><option>APPROVED</option><option>QC_PENDING</option><option>PACKING_STARTED</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Supervisor</label>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none" value={filterSupervisor} onChange={e => setFilterSupervisor(e.target.value)}>
              <option value="All">Select...</option>
              <option>Suresh Kumar</option><option>Meena Sharma</option><option>Rajesh Varma</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Machine</label>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none" value={filterMachine} onChange={e => setFilterMachine(e.target.value)}>
              <option value="All">Select...</option>
              <option>Packer-A1</option><option>Packer-A2</option><option>Sealer-B1</option><option>Labeler-C1</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Location</label>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none" value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
              <option value="All">Select...</option>
              <option>Hub #4</option><option value="Warehouse Racks">Warehouse Racks (Aisle D)</option><option>Silo A-1</option>
            </select>
          </div>

        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button onClick={resetFilters} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 bg-white rounded-lg cursor-pointer transition-all">
            Reset Filters
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => handleExport('Excel')} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer">
              <Download size={14} /><span>Export Excel</span>
            </button>
            <button onClick={() => handleExport('PDF')} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer">
              <Download size={14} /><span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2 h-fit">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider px-3 pb-3 border-b border-slate-100 mb-2">Available Reports</h3>
          <div className="space-y-1.5 sidebar-scrollbar max-h-[480px] overflow-y-auto pr-1">
            {reportsList.map(item => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                    isSelected ? 'bg-green-50 text-green-800 border border-green-200/60' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <Icon size={15} className={isSelected ? 'text-green-600' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-6 shadow-xs min-h-[400px]">
          {renderReportContent()}
        </div>

      </div>
    </div>
  );
};
