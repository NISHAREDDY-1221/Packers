import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { workOrderService } from '../services/workOrderService';
import { barcodeService } from '../services/barcodeService';
import type { PrintJob } from '../services/barcodeService';
import { Printer, RefreshCw, Barcode, QrCode, ClipboardList, CheckCircle, AlertTriangle } from 'lucide-react';

const PRINTERS = [
  'Zebra ZD420 (Thermal)',
  'TSC TE244 (Thermal)',
  'Brother TD-4420DN',
  'Bluetooth Portable Printer',
  'Generic Thermal Print Head'
];

// Code 128 Barcode drawing function on Canvas
const drawBarcode128 = (canvas: HTMLCanvasElement | null, text: string) => {
  if (!canvas || !text) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Code 128 pattern table
  const PATTERNS = [
    [2, 1, 2, 2, 2, 2],
    [2, 2, 2, 1, 2, 2],
    [2, 2, 2, 2, 2, 1],
    [1, 2, 1, 2, 2, 3], // 0-3
    [1, 2, 1, 3, 2, 2],
    [1, 3, 1, 2, 2, 2],
    [1, 2, 2, 2, 1, 3],
    [1, 2, 2, 3, 1, 2], // 4-7
    [1, 3, 2, 2, 1, 2],
    [2, 2, 1, 2, 1, 3],
    [2, 2, 1, 3, 1, 2],
    [2, 3, 1, 2, 1, 2], // 8-11
    [1, 1, 2, 2, 3, 2],
    [1, 2, 2, 1, 3, 2],
    [1, 2, 2, 2, 3, 1],
    [1, 1, 3, 2, 2, 2], // 12-15
    [1, 2, 3, 1, 2, 2],
    [1, 2, 3, 2, 2, 1],
    [2, 2, 3, 2, 1, 1],
    [2, 2, 1, 1, 3, 2], // 16-19
    [2, 2, 1, 2, 3, 1],
    [2, 1, 3, 2, 1, 2],
    [2, 2, 3, 1, 1, 2],
    [3, 1, 2, 1, 3, 1], // 20-23
    [3, 1, 1, 2, 2, 2],
    [3, 2, 1, 1, 2, 2],
    [3, 2, 1, 2, 2, 1],
    [3, 1, 2, 2, 1, 2], // 24-27
    [3, 2, 2, 1, 1, 2],
    [3, 2, 2, 2, 1, 1],
    [2, 1, 2, 1, 2, 3],
    [2, 1, 2, 3, 2, 1], // 32-35
    [2, 3, 2, 1, 2, 1],
    [1, 1, 1, 3, 2, 3],
    [1, 3, 1, 1, 2, 3],
    [1, 3, 1, 3, 2, 1], // 36-39
    [1, 1, 2, 3, 1, 3],
    [1, 3, 2, 1, 1, 3],
    [1, 3, 2, 3, 1, 1],
    [2, 1, 1, 3, 1, 3], // 40-43
    [2, 3, 1, 1, 1, 3],
    [2, 3, 1, 3, 1, 1],
    [1, 1, 2, 1, 3, 3],
    [1, 1, 2, 3, 3, 1], // 44-47
    [1, 3, 2, 1, 3, 1],
    [1, 1, 3, 1, 2, 3],
    [1, 1, 3, 3, 2, 1],
    [1, 3, 3, 1, 2, 1], // 48-51
    [3, 1, 3, 1, 2, 1],
    [2, 1, 1, 3, 3, 1],
    [2, 3, 1, 1, 3, 1],
    [2, 1, 3, 1, 1, 3], // 52-55
    [2, 1, 3, 3, 1, 1],
    [2, 1, 3, 1, 3, 1],
    [3, 1, 1, 1, 2, 3],
    [3, 1, 1, 3, 2, 1], // 56-59
    [3, 3, 1, 1, 2, 1],
    [3, 1, 2, 1, 1, 3],
    [3, 1, 2, 3, 1, 1],
    [3, 3, 2, 1, 1, 1], // 60-63
    [3, 1, 4, 1, 1, 1],
    [2, 2, 1, 4, 1, 1],
    [4, 3, 1, 1, 1, 1],
    [1, 1, 1, 2, 2, 4], // 64-67
    [1, 1, 1, 4, 2, 2],
    [1, 2, 1, 1, 2, 4],
    [1, 2, 1, 4, 2, 1],
    [1, 4, 1, 1, 2, 2], // 68-71
    [1, 4, 1, 2, 2, 1],
    [1, 1, 2, 2, 1, 4],
    [1, 1, 2, 4, 1, 2],
    [1, 2, 2, 1, 1, 4], // 72-75
    [1, 2, 2, 4, 1, 1],
    [1, 4, 2, 1, 1, 2],
    [1, 4, 2, 2, 1, 1],
    [2, 4, 1, 2, 1, 1], // 76-79
    [2, 2, 1, 1, 1, 4],
    [4, 1, 3, 1, 1, 1],
    [2, 4, 1, 1, 1, 2],
    [1, 3, 4, 1, 1, 1], // 80-83
    [1, 1, 1, 2, 4, 2],
    [1, 2, 1, 1, 4, 2],
    [1, 2, 1, 2, 4, 1],
    [1, 1, 4, 2, 1, 2], // 84-87
    [1, 2, 4, 1, 1, 2],
    [1, 2, 4, 2, 1, 1],
    [4, 1, 1, 2, 1, 2],
    [4, 2, 1, 1, 1, 2], // 88-91
    [4, 2, 1, 2, 1, 1],
    [2, 1, 2, 1, 4, 1],
    [2, 1, 4, 1, 2, 1],
    [4, 1, 2, 1, 2, 1], // 92-95
    [1, 1, 1, 1, 4, 3],
    [1, 1, 1, 3, 4, 1],
    [1, 3, 1, 1, 4, 1],
    [1, 1, 4, 1, 1, 3], // 96-99
    [1, 1, 4, 3, 1, 1],
    [4, 1, 1, 1, 1, 3],
    [4, 1, 1, 3, 1, 1],
    [1, 1, 3, 1, 4, 1], // 100-103
    [1, 1, 4, 1, 3, 1],
    [3, 1, 1, 1, 4, 1],
    [4, 1, 1, 1, 3, 1],
    [2, 1, 1, 4, 1, 2], // 104-107
    [2, 1, 1, 2, 1, 4],
    [2, 1, 1, 2, 3, 2],
    [2, 3, 3, 1, 1, 1, 2],
  ];

  const getCharValue = (char: string) => {
    const code = char.charCodeAt(0);
    if (code >= 32 && code <= 126) return code - 32;
    return 0;
  };

  const startValue = 104;
  let checksum = startValue;
  const codes = [startValue];

  for (let i = 0; i < text.length; i++) {
    const val = getCharValue(text[i]);
    codes.push(val);
    checksum += val * (i + 1);
  }

  const stopValue = 106;
  codes.push(checksum % 103);
  codes.push(stopValue);

  let bars: number[] = [];
  codes.forEach((c) => {
    bars = bars.concat(PATTERNS[c]);
  });
  bars = bars.concat(PATTERNS[106]);

  const scale = 2.4;
  const padding = 10;
  const barcodeWidth = bars.reduce((acc, curr) => acc + curr, 0) * scale;

  canvas.width = barcodeWidth + padding * 2;
  canvas.height = 80;

  let x = padding;
  let isBar = true;

  bars.forEach((width) => {
    const w = width * scale;
    if (isBar) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(x, 4, w, 72);
    }
    x += w;
    isBar = !isBar;
  });
};
export const BarcodesLabels: React.FC = () => {
  const previewCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const [selectableWOs, setSelectableWOs] = useState<any[]>([]);
  const [selectedWO, setSelectedWO] = useState<any | null>(null);
  const [history, setHistory] = useState<PrintJob[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Load active work orders and history from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allWos, hist] = await Promise.all([
          workOrderService.getWorkOrders({ sort: '-updatedAt' }),
          barcodeService.getPrintHistory()
        ]);
        const wosList = allWos?.data || allWos;
        const wosArray = Array.isArray(wosList) ? wosList : [];
        const wos = wosArray.filter((wo: any) => ['QC_PASSED'].includes(wo.status));
        
        console.log('wos:', wos, 'hist:', hist);
        setSelectableWOs(wos);
        if (wos.length > 0) setSelectedWO(wos[0]);
        setHistory(Array.isArray(hist) ? hist : []);
      } catch (err) {
        console.error('Failed to load barcode data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Printer Status State
  const [printerStatus, setPrinterStatus] = useState<'Online' | 'Offline'>('Online');

  // Configuration Panel Fields
  const [selectedPrinter, setSelectedPrinter] = useState(PRINTERS[0]);
  const [labelTemplate, setLabelTemplate] = useState<'Retail Label' | 'Bulk Label' | 'Export Label'>('Retail Label');
  const [barcodeType, setBarcodeType] = useState<'Code 128' | 'EAN-13' | 'QR Code' | 'GS1-128'>('Code 128');

  // Input Field States
  const [sku, setSku] = useState('');
  const [lotNo, setLotNo] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [mrp, setMrp] = useState(0);
  const [mfgDate, setMfgDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [printQty, setPrintQty] = useState(1);

  // Generate QR Code URL dynamically based on batchNo
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(batchNo || sku || '9031123456789')}`;

  // Mock global print trigger
  const printLabels = (job: any, template: string, type: string) => {
    console.log('Triggering physical print...', { job, template, type });
    // In a real app this would trigger an electron print or window.print
  };

  // Sync inputs when selected work order changes
  useEffect(() => {
    if (selectedWO) {
      setSku(selectedWO.product?.sku || 'SKU-SM500');
      setBatchNo(selectedWO.batchNumber || `BAT-${selectedWO.woNumber}`);
      setLotNo(`LOT-${selectedWO.woNumber}`);
      setMrp(selectedWO.recipe?.mrp || 60);
      setPrintQty(selectedWO.requiredQty);
      
      // Default dates
      const today = new Date().toISOString().split('T')[0];
      setMfgDate(today);
      const exp = new Date();
      exp.setDate(exp.getDate() + (selectedWO.recipe?.shelfLife || 180));
      setExpiryDate(exp.toISOString().split('T')[0]);
    }
  }, [selectedWO]);

  // Draw barcode on canvas
  useEffect(() => {
    if (barcodeType !== 'QR Code' && previewCanvasRef.current) {
      drawBarcode128(previewCanvasRef.current, batchNo || sku || '9031123456789');
    }
  }, [batchNo, sku, barcodeType]);

  // Real-time printer status validation error sync
  useEffect(() => {
    if (printerStatus === 'Offline') {
      setValidationError('Printer is Offline. Please check printer connection.');
    } else {
      setValidationError('');
    }
  }, [printerStatus]);

  // Print tracking state
  const [labelsRequired, setLabelsRequired] = useState(0);
  const [labelsPrinted, setLabelsPrinted] = useState(0);

  // History state


  // Validation / Warning alerts
  const [validationError, setValidationError] = useState('');
  const [successBanner, setSuccessBanner] = useState<{
    totalPrinted: number;
    timestamp: string;
    printer: string;
    jobId: string;
  } | null>(null);

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-750 dark:bg-slate-800 dark:text-slate-300';
      case 'Pending': return 'bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30';
      case 'Approved': return 'bg-green-50 text-green-805 border border-green-200 dark:bg-green-950/20 dark:text-green-405 dark:border-green-900/30';
      case 'Material Issued': return 'bg-blue-50 text-blue-805 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'Packing Started': return 'bg-indigo-50 text-indigo-805 border border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
      case 'QC Pending': return 'bg-orange-50 text-orange-850 border border-orange-200 dark:bg-orange-950/20 dark:text-orange-405 dark:border-orange-900/30';
      case 'QC Passed': return 'bg-green-100 text-green-905 border border-green-300 dark:bg-green-900/20 dark:text-green-450 dark:border-green-800/30';
      case 'Completed': return 'bg-[#00891D] text-white border border-[#00891D]';
      case 'Cancelled': return 'bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-900/30';
      case 'Labels Printed': return 'bg-green-600 text-white border border-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Handle Preview Generation
  const handleGeneratePreview = () => {
    setValidationError('');
    setSuccessBanner(null);
    if (!sku) return setValidationError('SKU is required.');
    if (!batchNo) return setValidationError('Batch Number is required.');
    if (mrp <= 0) return setValidationError('MRP must be greater than 0.');
    if (!mfgDate) return setValidationError('Manufacturing Date is required.');
    if (!expiryDate) return setValidationError('Expiry Date is required.');
    
    // Trigger visual preview refresh
    setLabelsRequired(printQty);
  };
  // Handle Generate and Print
  const handlePrint = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccessBanner(null);

    if (printerStatus === 'Offline') {
      setValidationError('Printer is Offline. Please check printer connection.');
      return;
    }
    if (!batchNo) {
      setValidationError('Batch Number is not available.');
      return;
    }
    if (mrp <= 0) {
      setValidationError('MRP must be configured (> 0).');
      return;
    }
    if (!mfgDate || !expiryDate) {
      setValidationError('MFG and EXP dates are required.');
      return;
    }

    try {
      if (!selectedWO) return;
      // 1. Call backend to persist the print job
      const newJob = await barcodeService.printLabels(selectedWO.id, batchNo, barcodeType, printQty);

      // 2. Trigger HTML5 visual print window
      printLabels(newJob, labelTemplate, barcodeType);

      // 3. Update local state
      setHistory([newJob, ...history]);
      setLabelsPrinted(prev => prev + printQty);
      setLabelsRequired(printQty);

      setSuccessBanner({
        totalPrinted: printQty,
        timestamp: newJob.timestamp,
        printer: selectedPrinter,
        jobId: newJob.id
      });
    } catch (err) {
      console.error('Print failed', err);
      setValidationError('Failed to execute print job on the server.');
    }
  };
  // Handle Reprint Action
  const handleReprint = async (job: PrintJob) => {
    const reason = prompt('Please enter the reprint reason:');
    if (reason === null) return; 
    if (!reason.trim()) {
      alert('Reprint reason is required.');
      return;
    }

    try {
      const res = await barcodeService.reprintLabels(job.id, reason);
      
      if (res.requiresApproval) {
        alert(res.message);
      } else if (res.job) {
        // Trigger HTML5 visual print window
        printLabels(res.job, labelTemplate, barcodeType);

        setHistory([res.job, ...history]);
        setSuccessBanner({
          totalPrinted: res.job.printedQty,
          timestamp: res.job.timestamp,
          printer: selectedPrinter,
          jobId: res.job.id
        });
      }
    } catch (err) {
      console.error('Reprint failed', err);
      alert('Failed to execute reprint job.');
    }
  };



  return (
    <div className="space-y-6 text-left">
      
      {/* Top Section: Work Order selection and Context Summary */}
      <div className="bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-slate-100 dark:border-gray-750 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-gray-150">Barcode & Label Generation</h2>
            <p className="text-xs text-slate-400 dark:text-gray-500">Select a completed work order to generate and print product labels.</p>
          </div>
          <select
            className="p-2 border border-slate-200 dark:border-gray-650 rounded-lg text-sm bg-slate-50 dark:bg-gray-700 text-slate-800 dark:text-gray-100 focus:ring-1 focus:ring-[#00891D]"
            value={selectedWO?.id || ''}
            onChange={(e) => {
              const wo = selectableWOs.find(w => w.id === e.target.value);
              if (wo) setSelectedWO(wo);
            }}
          >
            {selectableWOs.map(w => (
              <option key={w.id} value={w.id}>
                {w.woNumber || w.woNo} - {w.product?.name || w.productName} ({w.status})
              </option>
            ))}
          </select>
        </div>

        {selectedWO && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-slate-50 dark:bg-gray-750 p-4 rounded-lg text-xs">
            <div>
              <span className="block font-semibold text-slate-400 dark:text-gray-500">Work Order Number</span>
              <span className="font-bold text-slate-800 dark:text-gray-200">{selectedWO.woNumber || selectedWO.woNo}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-400 dark:text-gray-500">Product Name</span>
              <span className="font-bold text-slate-800 dark:text-gray-200">{selectedWO.product?.name || selectedWO.productName}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-400 dark:text-gray-500">Recipe/BOM</span>
              <span className="font-bold text-slate-805 dark:text-gray-200">{selectedWO.recipe?.name || selectedWO.recipeId}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-400 dark:text-gray-500">Batch Number</span>
              <span className="font-bold text-slate-800 dark:text-gray-200 font-mono">{batchNo || 'N/A'}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-400 dark:text-gray-500">Packed Quantity</span>
              <span className="font-bold text-slate-808 dark:text-gray-200">{selectedWO.actualProduced || selectedWO.requiredQuantity}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-400 dark:text-gray-500">Packing Status</span>
              <span className={`inline-block px-2 py-0.5 rounded-full font-bold border ${getStatusColor(selectedWO.status)}`}>
                {selectedWO.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Completion Success Message Banner */}
      {successBanner && (
        <div className="bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-900/30 text-green-800 dark:text-green-400 p-4 rounded-xl flex items-start gap-3">
          <CheckCircle className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" size={18} />
          <div className="text-xs space-y-1">
            <span className="font-bold text-sm block">Labels Generated Successfully</span>
            <div><span className="font-medium text-slate-500 dark:text-gray-400">Total Labels Printed:</span> <span className="font-bold text-slate-800 dark:text-gray-200">{successBanner.totalPrinted} units</span></div>
            <div><span className="font-medium text-slate-500 dark:text-gray-400">Print Timestamp:</span> <span className="font-bold text-slate-800 dark:text-gray-200">{successBanner.timestamp}</span></div>
            <div><span className="font-medium text-slate-500 dark:text-gray-400">Printer Used:</span> <span className="font-bold text-slate-800 dark:text-gray-200">{successBanner.printer}</span></div>
            <div><span className="font-medium text-slate-500 dark:text-gray-400">Print Job ID:</span> <span className="font-bold text-slate-800 dark:text-gray-200 font-mono">{successBanner.jobId}</span></div>
          </div>
        </div>
      )}

      {/* Warning/Error Banner */}
      {validationError && (
        <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-800 dark:text-rose-400 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="text-rose-600 dark:text-rose-400 shrink-0" size={18} />
          <span className="text-xs font-bold">{validationError}</span>
        </div>
      )}

      {/* Three-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Label Configuration */}
        <div className="lg:col-span-1 bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-808 dark:text-gray-200 text-sm flex items-center gap-2 border-b border-slate-100 dark:border-gray-750 pb-3">
            <Printer size={18} className="text-[#00891D]" />
            <span>Label Configuration</span>
          </h3>

          <div className="space-y-4">
            
            {/* Target Printer selection */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Printer</label>
                <select
                  className="w-full p-2 border border-slate-200 dark:border-gray-650 rounded-lg text-xs bg-slate-50 dark:bg-gray-700 text-slate-800 dark:text-gray-200 focus:ring-1 focus:ring-[#00891D]"
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                >
                  {PRINTERS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Printer Status</label>
                <div
                  onClick={() => setPrinterStatus(p => p === 'Online' ? 'Offline' : 'Online')}
                  className={`w-full p-2 border rounded-lg text-xs font-bold text-center select-none cursor-pointer transition-colors ${
                    printerStatus === 'Online'
                      ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:text-green-405 dark:border-green-900/30'
                      : 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450 dark:border-rose-900/30'
                  }`}
                  title="Click to toggle printer status"
                >
                  {printerStatus === 'Online' ? '🟢 Printer Online' : '🔴 Printer Offline'}
                </div>
              </div>
            </div>

            {/* Label Template & Barcode Type Dropdowns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Label Template</label>
                <select
                  className="w-full p-2 border border-slate-200 dark:border-gray-650 rounded-lg text-xs bg-slate-50 dark:bg-gray-700 text-slate-800 dark:text-gray-205 focus:ring-1 focus:ring-[#00891D]"
                  value={labelTemplate}
                  onChange={(e: any) => setLabelTemplate(e.target.value)}
                >
                  <option value="Retail Label">Retail Label</option>
                  <option value="Bulk Label">Bulk Label</option>
                  <option value="Export Label">Export Label</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Barcode Type</label>
                <select
                  className="w-full p-2 border border-slate-200 dark:border-gray-650 rounded-lg text-xs bg-slate-50 dark:bg-gray-700 text-slate-800 dark:text-gray-205 focus:ring-1 focus:ring-[#00891D]"
                  value={barcodeType}
                  onChange={(e: any) => setBarcodeType(e.target.value)}
                >
                  <option value="Code 128">Code 128</option>
                  <option value="EAN-13">EAN-13</option>
                  <option value="QR Code">QR Code</option>
                  <option value="GS1-128">GS1-128</option>
                </select>
              </div>
            </div>

            {/* SKU and Lot Number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU *</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border border-slate-200 dark:border-gray-650 rounded-lg text-xs font-mono bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-200"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lot Number</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-200 dark:border-gray-650 rounded-lg text-xs font-mono bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-200"
                  value={lotNo}
                  onChange={(e) => setLotNo(e.target.value)}
                />
              </div>
            </div>

            {/* Batch Number */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Batch Number *</label>
              <input
                type="text"
                required
                className="w-full p-2 border border-slate-200 dark:border-gray-650 rounded-lg text-xs font-mono bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-200"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
              />
            </div>

            {/* MRP & Print Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-505 uppercase mb-1">MRP (₹)</label>
                <input
                  type="number"
                  className="w-full p-2 border border-slate-200 dark:border-gray-650 rounded-lg text-xs text-center bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-200 font-bold"
                  value={mrp}
                  onChange={(e) => setMrp(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Print Quantity *</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full p-2 border border-slate-200 dark:border-gray-650 rounded-lg text-xs text-center bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-200 font-bold text-[#00891D]"
                  value={printQty}
                  onChange={(e) => setPrintQty(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Manufacturing & Expiry Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Mfg Date *</label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border border-slate-200 dark:border-gray-650 rounded-lg text-xs bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-200"
                  value={mfgDate}
                  onChange={(e) => setMfgDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Expiry Date *</label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border border-slate-200 dark:border-gray-650 rounded-lg text-xs bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-200"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleGeneratePreview}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 border border-slate-200 dark:border-gray-650 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Generate Preview</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={printerStatus === 'Offline'}
                className="w-full bg-[#00891D] hover:bg-[#00891D]/90 disabled:bg-rose-50 disabled:text-rose-450 disabled:border disabled:border-rose-100 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer size={14} />
                <span>Generate & Print</span>
              </button>
            </div>

          </div>
        </div>

        {/* Center Column: Enhanced Label Preview */}
        <div className="lg:col-span-1 bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-gray-200 text-sm flex items-center gap-2 border-b border-slate-100 dark:border-gray-750 pb-3 mb-4">
              <Barcode size={18} className="text-indigo-600 dark:text-indigo-400" />
              <span>Label Preview Template</span>
            </h3>

            {/* Enhanced Thermal Retail Label Preview */}
            <div className="border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-lg p-5 font-mono text-xs text-slate-800 dark:text-gray-150 bg-white dark:bg-gray-900 space-y-4 max-w-sm mx-auto shadow-xs">
              <div className="text-center border-b border-slate-200 dark:border-gray-750 pb-2 flex flex-col items-center">
                <span className="font-bold text-sm tracking-wider uppercase text-[#00891D]">VillagKart Retail</span>
                <span className="text-[8px] block text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Rural Hub Packaging Unit</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-450 dark:text-gray-500">Product:</span>
                  <span className="font-bold text-right max-w-[150px] truncate">{selectedWO?.product?.name || 'No Product Selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 dark:text-gray-500">SKU:</span>
                  <span className="font-bold">{sku || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 dark:text-gray-500">BATCH:</span>
                  <span className="font-bold">{batchNo || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 dark:text-gray-500">LOT:</span>
                  <span className="font-bold">{lotNo || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 dark:text-gray-500">FORMAT:</span>
                  <span className="font-bold">{barcodeType}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-gray-750 pt-1.5 mt-1.5">
                  <span className="text-slate-450 dark:text-gray-500">MRP:</span>
                  <span className="font-bold text-[#00891D]">₹{mrp || 0}.00 <span className="text-[9px] font-normal text-slate-400 dark:text-gray-500">(Incl. Taxes)</span></span>
                </div>
                <div className="flex justify-between text-[9px] pt-1 text-slate-500 dark:text-gray-400">
                  <span>MFG: {mfgDate || 'YYYY-MM-DD'}</span>
                  <span>EXP: {expiryDate || 'YYYY-MM-DD'}</span>
                </div>
              </div>

              {/* Dynamic Barcode graphic */}
              <div className="flex flex-col items-center justify-center pt-2 border-t border-slate-200 dark:border-gray-750">
                {barcodeType !== 'QR Code' ? (
                  <>
                    <canvas
                      ref={previewCanvasRef}
                      className="w-full h-12 bg-white p-1 border rounded-xs"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 font-mono tracking-widest uppercase">{barcodeType}: {batchNo || '9031123456789'}</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <img
                      src={qrCodeUrl}
                      className="w-16 h-16 border p-1 bg-white rounded"
                      alt="QR Code"
                    />
                    <span className="text-[9px] text-slate-400 font-mono">QR Label Format</span>
                  </div>
                )}
              </div>

              {barcodeType !== 'QR Code' && (
                <div className="flex justify-center pt-1">
                  <img
                      src={qrCodeUrl}
                      className="w-10 h-10 border p-0.5 bg-white rounded"
                      alt="QR Code"
                    />
                </div>
              )}
            </div>
          </div>

          {/* Print Summary Card */}
          <div className="bg-slate-50 dark:bg-gray-750 border border-slate-200 dark:border-gray-700 p-4 rounded-xl text-xs space-y-2">
            <span className="font-bold text-slate-505 dark:text-gray-400 block uppercase text-[10px] tracking-wider">Print Summary</span>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Required</span>
                <span className="text-sm font-bold text-slate-800 dark:text-gray-200">{labelsRequired}</span>
              </div>
              <div className="border-x border-slate-200 dark:border-gray-700">
                <span className="text-[10px] text-slate-400 block font-semibold">Printed</span>
                <span className="text-sm font-bold text-green-700 dark:text-green-400">{labelsPrinted}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Remaining</span>
                <span className="text-sm font-bold text-slate-800 dark:text-gray-200">{Math.max(0, labelsRequired - labelsPrinted)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Expanded Reprint History */}
        <div className="lg:col-span-1 bg-white border border-slate-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-808 dark:text-gray-200 text-sm flex items-center gap-2 border-b border-slate-100 dark:border-gray-750 pb-3">
            <ClipboardList size={18} className="text-slate-500" />
            <span>Reprint History & Logs</span>
          </h3>

          <div className="space-y-3 max-h-[460px] overflow-y-auto sidebar-scrollbar pr-1">
            {(Array.isArray(history) ? history : []).map((job) => (
              <div key={job.id} className="p-3 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-750/30 text-xs space-y-1.5 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-500 dark:text-gray-400">{job.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    job.status === 'Reprinted' ? 'bg-amber-100 text-amber-805' : 'bg-green-100 text-green-905'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-y-1 text-slate-600 dark:text-gray-400 text-[11px]">
                  <div><span className="text-slate-400">WO:</span> <span className="font-medium">{job.woNo}</span></div>
                  <div><span className="text-slate-400">SKU:</span> <span className="font-medium">{job.sku}</span></div>
                  <div><span className="text-slate-400">Batch:</span> <span className="font-mono">{job.batchNo}</span></div>
                  <div><span className="text-slate-400">Printed:</span> <span className="font-bold">{job.printedQty} labels</span></div>
                  <div><span className="text-slate-400">By:</span> <span className="font-medium">{job.printedBy}</span></div>
                </div>
                
                {job.reprintReason && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-100 dark:border-amber-900/30 text-[10px] text-amber-800 dark:text-amber-450 mt-1.5 font-medium">
                    <span className="font-bold">Reason:</span> {job.reprintReason}
                  </div>
                )}
                
                <div className="flex justify-between items-center border-t border-slate-100 dark:border-gray-750 pt-2 mt-2">
                  <span className="text-[10px] text-slate-400 font-mono">{job.timestamp}</span>
                  <button
                    onClick={() => handleReprint(job)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded border border-slate-200 dark:border-gray-650 text-slate-600 dark:text-gray-300 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                    title="Reprint Job"
                  >
                    <RefreshCw size={11} />
                    <span>Reprint</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
