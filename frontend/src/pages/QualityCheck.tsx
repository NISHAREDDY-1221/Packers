import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { QualityCheck as IQC } from '../context/AppContext';
import { ShieldCheck, X, Search, Image as ImageIcon } from 'lucide-react';

const formatDateString = (dateStr: string) => {
  if (!dateStr) return '—';
  if (dateStr.length === 10 && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const formatDateTimeString = (dateStr: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${day}-${month}-${year} ${time}`;
};

const formatTimeWithDate = (d: Date | null) => {
  if (!d) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${day}-${month}-${year} ${time}`;
};

export const QualityCheck: React.FC = () => {
  const { workOrders, qualityChecks, addQualityCheck } = useApp();
  const [search, setSearch] = useState('');
  const [selectedQC, setSelectedQC] = useState<IQC | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [formWoId, setFormWoId] = useState('');
  const [formQcId, setFormQcId] = useState('');
  const [formBatchNo, setFormBatchNo] = useState('');
  const [formCheckedQty, setFormCheckedQty] = useState(10);
  const [formInspectionType, setFormInspectionType] = useState('Sampling Inspection');
  const [formSeverity, setFormSeverity] = useState<IQC['severity']>('Minor');
  const [formFailureReason, setFormFailureReason] = useState('');
  const [formPackedQty, setFormPackedQty] = useState(0);
  const [formPhotos, setFormPhotos] = useState<{ id: string, file: File, url: string, status: 'uploading' | 'done' }[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [formInspector] = useState('Nisha Reddy Teegala');
  const [formRemarks, setFormRemarks] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (isFormOpen) {
      setStartTime(new Date());
    } else {
      setStartTime(null);
    }
  }, [isFormOpen]);

  
  // Checklist states — grouped: Packaging / Product / Label
  const [checks, setChecks] = useState({
    // Packaging
    sealIntegrity: true,
    packagingDamage: true,
    tamperCheck: true,
    // Product
    weightAccuracy: true,
    quantityVerification: true,
    productAppearance: true,
    // Label
    barcodeReadability: true,
    labelPlacement: true,
    mrpVerification: true,
    manufacturingDate: true,
    expiryDate: true
  });
  
  const [formResult, setFormResult] = useState<IQC['result']>('Pass');
  const [formSignature, setFormSignature] = useState('');

  const pendingQC_WOs = workOrders.filter(w => 
    w.status === 'QC Pending' || 
    w.status === 'Labels Printed' || 
    w.status === 'Completed' || 
    w.status === 'QC Passed'
  );

  const todayDate = new Date().toISOString().split('T')[0];
  const todaysQCs = qualityChecks.filter(qc => qc.date === todayDate);
  const pendingCount = pendingQC_WOs.length;
  const todaysInspections = todaysQCs.length;
  const passedToday = todaysQCs.filter(qc => ['Pass', 'Partial Pass'].includes(qc.result)).length;
  const failedToday = todaysQCs.filter(qc => ['Reject', 'Discard'].includes(qc.result)).length;
  const reworkToday = todaysQCs.filter(qc => qc.result === 'Rework').length;
  const passRate = todaysInspections > 0 ? Math.round((passedToday / todaysInspections) * 100) : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        url: URL.createObjectURL(file),
        status: 'uploading' as const
      }));
      setFormPhotos(prev => [...prev, ...newFiles]);

      newFiles.forEach(fileObj => {
        setFormPhotos(prev => prev.map(p => p.id === fileObj.id ? { ...p, status: 'done' } : p));
      });
    }
  };

  const removePhoto = (id: string) => {
    setFormPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSelectWO = (woId: string) => {
    setFormWoId(woId);
    const generatedQcId = `QC-2026-${String(qualityChecks.length + 1).padStart(3, '0')}`;
    setFormQcId(generatedQcId);
    const wo = workOrders.find(w => w.id === woId);
    if (wo) {
      setFormBatchNo('');
      const packed = wo.actualProduced || wo.requiredQuantity;
      setFormPackedQty(packed);
      setFormCheckedQty(Math.max(1, Math.round(packed * 0.2))); // default 20% sample
    }
  };

  const handleCheckboxChange = (check: keyof typeof checks) => {
    const updated = { ...checks, [check]: !checks[check] };
    setChecks(updated);
    
    // Auto-calculate result: if all pass, result is Pass. If some fail, suggest Fail/Rework.
    const allPassed = Object.values(updated).every(val => val === true);
    setFormResult(allPassed ? 'Pass' : 'Rework');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWoId) return;

    const wo = workOrders.find(w => w.id === formWoId)!;
    const newQC: IQC = {
      id: formQcId || `QC-${Date.now().toString().slice(-4)}`,
      woId: formWoId,
      woNo: wo.woNo,
      productName: wo.productName,
      batchNo: formBatchNo,
      inspectionType: formInspectionType,
      checkedQty: formCheckedQty,
      checks,
      result: formResult,
      severity: ['Rework', 'Reject', 'Discard'].includes(formResult) ? formSeverity : undefined,
      failureReason: ['Rework', 'Reject', 'Discard'].includes(formResult) ? formFailureReason : undefined,
      inspector: formInspector,
      remarks: formRemarks,
      photoAttached: formPhotos.length > 0,
      photos: formPhotos.filter(p => p.status === 'done').map(p => p.url),
      signature: formSignature || formInspector,
      startTime: startTime ? startTime.toISOString() : new Date().toISOString(),
      completionTime: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };

    addQualityCheck(newQC);
    setIsFormOpen(false);
    
    // Reset Form
    setFormWoId('');
    setFormQcId('');
    setFormInspectionType('Sampling Inspection');
    setFormSeverity('Minor');
    setFormFailureReason('');
    setFormRemarks('');
    setFormPhotos([]);
    setChecks({
      sealIntegrity: true,
      packagingDamage: true,
      tamperCheck: true,
      weightAccuracy: true,
      quantityVerification: true,
      productAppearance: true,
      barcodeReadability: true,
      labelPlacement: true,
      mrpVerification: true,
      manufacturingDate: true,
      expiryDate: true
    });
  };

  const getResultBadge = (result: IQC['result']) => {
    switch (result) {
      case 'Pass': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Partial Pass': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Reject': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Rework': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Discard': return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  const filteredQCs = qualityChecks.filter(qc => {
    return qc.productName.toLowerCase().includes(search.toLowerCase()) || qc.woNo.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pending QC</span>
          <span className="text-2xl font-bold text-slate-800">{pendingCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Passed Today</span>
          <span className="text-2xl font-bold text-emerald-600">{passedToday}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Failed Today</span>
          <span className="text-2xl font-bold text-rose-600">{failedToday}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rework Required</span>
          <span className="text-2xl font-bold text-amber-600">{reworkToday}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Today's Inspections</span>
          <span className="text-2xl font-bold text-indigo-600">{todaysInspections}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">QC Pass Rate</span>
          <span className="text-2xl font-bold text-blue-600">{passRate}%</span>
        </div>
      </div>

      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search inspections..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
        >
          <ShieldCheck size={16} />
          <span>New Inspection Log</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Left column: Pending Work Orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 lg:col-span-1">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-150 pb-3">QC Pending queue</h3>
          
          <div className="space-y-3">
            {pendingQC_WOs.map((wo, index) => {
              const tentativeQcId = `QC-2026-${String(qualityChecks.length + index + 1).padStart(3, '0')}`;
              const batchNo = wo.batchNumber || `BATCH-2026-${wo.woNo.split('-').pop()}`;
              const packedQty = wo.actualProduced || wo.requiredQuantity;
              const priority = wo.priority || 'High';
              const waitingSince = wo.expectedCompletion ? formatDateString(wo.expectedCompletion) : '2 hours ago';
              const inspector = wo.supervisor || 'Unassigned';
              
              return (
                <div
                  key={wo.id}
                  className="p-4 border border-slate-200 hover:border-emerald-500 rounded-xl bg-slate-50 transition-all space-y-3 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">QC ID</div>
                      <div className="font-mono font-bold text-indigo-700">{tentativeQcId}</div>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase tracking-wide">Pending</span>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{wo.productName}</h4>
                    <div className="text-slate-500 font-mono text-[10px]">{wo.woNo}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Batch Number</span>
                      <span className="font-mono font-medium text-slate-700">{batchNo}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Packed Qty</span>
                      <span className="font-medium text-slate-700">{packedQty} units</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Priority</span>
                      <span className={`font-medium ${priority === 'Urgent' || priority === 'High' ? 'text-rose-600' : 'text-slate-700'}`}>{priority}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Waiting Since</span>
                      <span className="font-medium text-slate-700">{waitingSince}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Assigned Inspector</span>
                      <span className="font-medium text-slate-700">{inspector}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => { handleSelectWO(wo.id); setIsFormOpen(true); }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck size={14} />
                    Start Inspection
                  </button>
                </div>
              );
            })}
            {pendingQC_WOs.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                All production batches checked. Queue empty.
              </div>
            )}
          </div>
        </div>

        {/* Right column: Inspection History logs */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-150 pb-3">Quality Inspection Reports</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 whitespace-nowrap">
                  <th className="px-2 py-3 w-20">Date</th>
                  <th className="px-2 py-3 w-20">QC ID</th>
                  <th className="px-2 py-3 min-w-[120px]">WO & Product</th>
                  <th className="px-2 py-3 w-24">Batch No</th>
                  <th className="px-2 py-3 w-24">Inspector</th>
                  <th className="px-2 py-3 max-w-[100px]">Remarks</th>
                  <th className="px-2 py-3 w-20 text-center">Result</th>
                  <th className="px-2 py-3 w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredQCs.map((qc) => (
                  <tr key={qc.id} className="hover:bg-slate-50/50">
                    <td className="px-2 py-3 font-medium whitespace-nowrap">{formatDateString(qc.date)}</td>
                    <td className="px-2 py-3 font-mono font-semibold text-slate-500 whitespace-nowrap">{qc.id}</td>
                    <td className="px-2 py-3">
                      <div className="font-semibold text-slate-900 truncate max-w-[120px]" title={qc.productName}>{qc.productName}</div>
                      <div className="font-mono text-slate-400 text-[10px] truncate max-w-[120px]" title={qc.woNo}>{qc.woNo}</div>
                    </td>
                    <td className="px-2 py-3 font-mono text-[11px] whitespace-nowrap truncate max-w-[100px]" title={qc.batchNo}>{qc.batchNo}</td>
                    <td className="px-2 py-3 text-[11px] truncate max-w-[100px]" title={qc.inspector}>{qc.inspector}</td>
                    <td className="px-2 py-3 text-[10px] text-slate-500 truncate max-w-[100px]" title={qc.remarks}>{qc.remarks || '—'}</td>
                    <td className="px-2 py-3 whitespace-nowrap text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold border text-[10px] ${getResultBadge(qc.result)}`}>
                        {qc.result}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedQC(qc)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-900 font-bold px-2 py-1 rounded cursor-pointer transition-colors text-[11px]"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredQCs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      No inspection reports filed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QC Detail Modal */}
      {selectedQC && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 text-left space-y-4 max-h-[90vh] overflow-y-auto sidebar-scrollbar">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3 sticky top-0 bg-white z-10 pt-2 -mt-2">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">{selectedQC.id}</span>
                <h3 className="font-bold text-slate-800 text-base">{selectedQC.productName}</h3>
              </div>
              <button onClick={() => setSelectedQC(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer bg-slate-50">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div><strong>WO No:</strong> {selectedQC.woNo}</div>
              <div><strong>Batch No:</strong> {selectedQC.batchNo}</div>
              <div><strong>Inspector:</strong> {selectedQC.inspector}</div>
              <div><strong>Date:</strong> {formatDateString(selectedQC.date)}</div>
              <div><strong>Checked Qty:</strong> {selectedQC.checkedQty}</div>
              <div><strong>Inspection:</strong> {selectedQC.inspectionType}</div>
              <div><strong>QC Status:</strong> <span className={`px-2 py-0.5 rounded font-bold border ${getResultBadge(selectedQC.result)}`}>{selectedQC.result}</span></div>
              {selectedQC.severity && <div><strong>Severity:</strong> <span className="px-2 py-0.5 rounded font-bold border bg-rose-100 text-rose-800 border-rose-200">{selectedQC.severity}</span></div>}
              {selectedQC.failureReason && <div><strong>Failure Reason:</strong> {selectedQC.failureReason}</div>}
            </div>

            {selectedQC.photos && selectedQC.photos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Attached Evidence</h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedQC.photos.map((url, i) => (
                    <img key={i} src={url} className="w-16 h-16 object-cover rounded-lg border border-slate-200 cursor-pointer" onClick={() => setPreviewPhoto(url)} />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Inspections Checked Matrix</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(selectedQC.checks).map(([check, passed]) => (
                  <div key={check} className="flex justify-between p-2 border border-slate-100 rounded-md bg-white">
                    <span className="capitalize">{check} Check</span>
                    <span className={passed ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      {passed ? '✓ Pass' : '✗ Fail'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs border-t border-slate-100 pt-3">
              <strong>Inspector Remarks:</strong>
              <p className="text-slate-600 mt-1 italic">{selectedQC.remarks || 'No remarks added.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Inspector Details</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 text-xs h-[calc(100%-24px)]">
                  <div><strong>Inspector:</strong> {selectedQC.inspector}</div>
                  <div><strong>Signature:</strong> <span className="font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">{selectedQC.signature}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Inspection Timeline</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3 text-xs h-[calc(100%-24px)] flex flex-col justify-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase leading-tight">Started</div>
                      <div className="font-mono text-slate-700">{selectedQC.startTime ? formatDateTimeString(selectedQC.startTime) : '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase leading-tight">Completed</div>
                      <div className="font-mono text-slate-700">{selectedQC.completionTime ? formatDateTimeString(selectedQC.completionTime) : '—'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button onClick={() => setSelectedQC(null)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QC Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white rounded-t-xl">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShieldCheck size={18} />
                <span>Quality Inspection Checklist Log</span>
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 flex-1 text-left text-xs">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Work Order *</label>
                  <select
                    required
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                    value={formWoId}
                    onChange={(e) => handleSelectWO(e.target.value)}
                  >
                    <option value="">-- Choose Pending QC Batch --</option>
                    {pendingQC_WOs.map(w => (
                      <option key={w.id} value={w.id}>{w.woNo} - {w.productName}</option>
                    ))}
                  </select>
                </div>
                {formQcId && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Generated QC ID</label>
                    <input
                      type="text"
                      readOnly
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-indigo-50 text-indigo-700 font-mono font-bold"
                      value={formQcId}
                    />
                  </div>
                )}
              </div>

              {/* Work Order Summary — auto-populates on selection */}
              {formWoId && (() => {
                const wo = pendingQC_WOs.find(w => w.id === formWoId);
                if (!wo) return null;
                const batchDisplay = wo.batchNumber || formBatchNo || `BATCH-2026-${wo.woNo.split('-').pop()}`;
                const packedQty   = wo.actualProduced ?? wo.requiredQuantity;
                const labelsPrinted = packedQty;
                const completedDateRaw = wo.lastUpdated || wo.expectedCompletion;
                const completedDate = completedDateRaw ? formatDateString(completedDateRaw) : '—';
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Work Order Summary</span>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                      <div className="flex flex-col">
                        <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wide">Work Order No.</span>
                        <span className="font-bold text-slate-800 font-mono">{wo.woNo}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wide">Product Name</span>
                        <span className="font-bold text-slate-800">{wo.productName}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wide">Recipe / BOM</span>
                        <span className="font-bold text-slate-800">{wo.recipeId}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wide">Batch Number</span>
                        <span className="font-bold text-slate-800 font-mono">{batchDisplay}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wide">Packed Quantity</span>
                        <span className="font-bold text-slate-800">{packedQty} units</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wide">Labels Printed</span>
                        <span className="font-bold text-slate-800">{labelsPrinted} labels</span>
                      </div>
                      <div className="flex flex-col col-span-2">
                        <span className="text-slate-400 font-semibold uppercase text-[9px] tracking-wide">Packing Completed Date</span>
                        <span className="font-bold text-slate-800">{completedDate}</span>
                      </div>
                    </div>
                    <div className="pt-1 flex items-center gap-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        wo.status === 'Labels Printed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {wo.status}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-3">
                {/* Batch & Inspection Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Batch Number */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Batch Number</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono"
                      value={formBatchNo}
                      onChange={(e) => setFormBatchNo(e.target.value)}
                    />
                  </div>

                  {/* Inspection Type */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Inspection Type *</label>
                    <select
                      required
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                      value={formInspectionType}
                      onChange={(e) => setFormInspectionType(e.target.value)}
                    >
                      <option value="100% Inspection">100% Inspection</option>
                      <option value="Sampling Inspection">Sampling Inspection</option>
                      <option value="Random Inspection">Random Inspection</option>
                    </select>
                  </div>
                </div>

                {/* Sampling Info Row */}
                <div className="grid grid-cols-3 gap-3">

                  {/* Packed Quantity — read-only */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Packed Qty</label>
                    <input
                      type="number"
                      readOnly
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500 font-mono"
                      value={formPackedQty}
                    />
                  </div>

                  {/* Checked Quantity — editable */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Checked Qty *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={formPackedQty || undefined}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm font-mono"
                      value={formCheckedQty}
                      onChange={(e) => setFormCheckedQty(Number(e.target.value))}
                    />
                  </div>

                  {/* Auto-calculated Sampling % */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Sampling %</label>
                    <div className={`w-full p-2 border rounded-lg text-sm font-bold text-center ${
                      formPackedQty > 0
                        ? (() => {
                            const pct = Math.min(100, Math.round((formCheckedQty / formPackedQty) * 100));
                            if (pct >= 50) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
                            if (pct >= 20) return 'bg-amber-50 border-amber-200 text-amber-700';
                            return 'bg-rose-50 border-rose-200 text-rose-700';
                          })()
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      {formPackedQty > 0
                        ? `${Math.min(100, Math.round((formCheckedQty / formPackedQty) * 100))}%`
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Checklist — 3 grouped sections */}
              <div className="border border-slate-100 rounded-lg bg-slate-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-200 bg-slate-100">
                  <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide">Verification Checklist</span>
                </div>

                {([
                  {
                    section: 'Packaging',
                    color: 'text-blue-600',
                    border: 'border-blue-100',
                    bg: 'bg-blue-50',
                    items: [
                      { key: 'sealIntegrity',   label: 'Seal Integrity' },
                      { key: 'packagingDamage', label: 'Packaging Damage' },
                      { key: 'tamperCheck',     label: 'Tamper Check' },
                    ] as { key: keyof typeof checks; label: string }[]
                  },
                  {
                    section: 'Product',
                    color: 'text-violet-600',
                    border: 'border-violet-100',
                    bg: 'bg-violet-50',
                    items: [
                      { key: 'weightAccuracy',       label: 'Weight Accuracy' },
                      { key: 'quantityVerification', label: 'Quantity Verification' },
                      { key: 'productAppearance',    label: 'Product Appearance' },
                    ] as { key: keyof typeof checks; label: string }[]
                  },
                  {
                    section: 'Label',
                    color: 'text-emerald-600',
                    border: 'border-emerald-100',
                    bg: 'bg-emerald-50',
                    items: [
                      { key: 'barcodeReadability', label: 'Barcode Readability' },
                      { key: 'labelPlacement',     label: 'Label Placement' },
                      { key: 'mrpVerification',    label: 'MRP Verification' },
                      { key: 'manufacturingDate',  label: 'Manufacturing Date' },
                      { key: 'expiryDate',         label: 'Expiry Date' },
                    ] as { key: keyof typeof checks; label: string }[]
                  },
                ] as { section: string; color: string; border: string; bg: string; items: { key: keyof typeof checks; label: string }[] }[]).map(({ section, color, border, bg, items }) => (
                  <div key={section} className="px-3 pt-2.5 pb-3 space-y-2 border-b border-slate-100 last:border-b-0">
                    <span className={`block text-[10px] font-bold uppercase tracking-wide ${color}`}>
                      {section}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {items.map(({ key, label }) => (
                        <label
                          key={key}
                          className={`flex items-center gap-2 bg-white border p-2 rounded-lg cursor-pointer hover:${bg} transition-colors ${
                            checks[key] ? border : 'border-rose-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="rounded accent-emerald-600 shrink-0"
                            checked={checks[key]}
                            onChange={() => handleCheckboxChange(key)}
                          />
                          <span className="text-[11px] font-medium text-slate-700 leading-tight">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">QC Decision *</label>
                  <select
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold"
                    value={formResult}
                    onChange={(e) => {
                      setFormResult(e.target.value as IQC['result']);
                      if (!['Rework', 'Reject', 'Discard'].includes(e.target.value)) {
                        setFormFailureReason('');
                      }
                    }}
                  >
                    <option value="Pass">Pass (Post to FG)</option>
                    <option value="Partial Pass">Partial Pass</option>
                    <option value="Rework">Rework Required</option>
                    <option value="Reject">Reject Batch</option>
                    <option value="Discard">Discard Batch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Attach photo evidence</label>
                  <label className="w-full h-[42px] px-3 rounded-lg border border-dashed border-slate-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors text-slate-500">
                    <ImageIcon size={14} />
                    <span>Upload photos</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              {formPhotos.length > 0 && (
                <div className="col-span-2 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Uploaded Evidence</span>
                  <div className="flex flex-wrap gap-2">
                    {formPhotos.map(photo => (
                      <div key={photo.id} className="relative group w-14 h-14 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                        <img src={photo.url} alt="upload" className={`object-cover w-full h-full cursor-pointer ${photo.status === 'uploading' ? 'opacity-50 blur-[2px]' : ''}`} onClick={() => setPreviewPhoto(photo.url)} />
                        {photo.status === 'uploading' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                          </div>
                        )}
                        {photo.status === 'done' && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                            className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 text-rose-500 shadow hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {['Rework', 'Reject', 'Discard'].includes(formResult) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Severity *</label>
                    <select
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold"
                      value={formSeverity}
                      onChange={(e) => setFormSeverity(e.target.value as IQC['severity'])}
                    >
                      <option value="Minor">Minor</option>
                      <option value="Major">Major</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Failure Reason *</label>
                    <select
                      required={['Rework', 'Reject', 'Discard'].includes(formResult)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold"
                      value={formFailureReason}
                      onChange={(e) => setFormFailureReason(e.target.value)}
                    >
                      <option value="">-- Select Reason --</option>
                      <option value="Seal Defect">Seal Defect</option>
                      <option value="Barcode Issue">Barcode Issue</option>
                      <option value="Label Error">Label Error</option>
                      <option value="Weight Mismatch">Weight Mismatch</option>
                      <option value="Packaging Damage">Packaging Damage</option>
                      <option value="Expiry Date Error">Expiry Date Error</option>
                      <option value="MRP Error">MRP Error</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Inspector Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Inspector Name</label>
                      <input
                        type="text"
                        readOnly
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600"
                        value={formInspector}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Digital Signature / Initials *</label>
                      <input
                        type="text"
                        required
                        placeholder="Sign initials"
                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                        value={formSignature}
                        onChange={(e) => setFormSignature(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Inspection Timeline</h4>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-[calc(100%-24px)] flex flex-col justify-center space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase leading-tight">Started</div>
                        <div className="font-mono text-slate-700 font-bold">{formatTimeWithDate(startTime)}</div>
                      </div>
                    </div>
                    <div className="h-4 border-l-2 border-dashed border-slate-200 ml-1 -my-3"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase leading-tight">Completed</div>
                        <div className="font-mono text-slate-400 italic">Pending Submission...</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Remarks & Non-conformance Notes</label>
                <textarea
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm h-16 focus:outline-none"
                  placeholder="Notes on packaging flaws, seal integrity issues..."
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                />
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Submit Inspection Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {previewPhoto && (
        <div className="fixed inset-0 bg-slate-900/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewPhoto(null)}>
          <div className="relative max-w-4xl max-h-full">
            <button className="absolute -top-4 -right-4 bg-white rounded-full p-1 text-slate-800 shadow hover:bg-slate-100 cursor-pointer" onClick={() => setPreviewPhoto(null)}>
              <X size={20} />
            </button>
            <img src={previewPhoto} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}
    </div>
  );
};
