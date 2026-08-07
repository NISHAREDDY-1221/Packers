import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/axios';
import { useApp } from '../context/AppContext';
import type { FinishedGoods as IFG } from '../context/AppContext';
import { Package, Filter, Archive, CheckCircle, Clock, X, Calculator, DollarSign, Search, RotateCcw } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { StatCard, DataTable } from '../components/ui';

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${day}-${month}-${year} ${time}`;
};

export const FinishedGoods: React.FC = () => {
  const { workOrders, qualityChecks, finishedGoods, addFinishedGoods } = useApp();
  const [search, setSearch] = useState('');
  const [selectedFG, setSelectedFG] = useState<IFG | null>(null);
  const [isPostOpen, setIsPostOpen] = useState(false);

  // Form states
  const [formWoNo, setFormWoNo] = useState('');
  const [formPostedQty, setFormPostedQty] = useState(100);
  const [formDestination, setFormDestination] = useState<IFG['destination']>('Warehouse');

  // Costs calculation state
  const [rawCost, setRawCost] = useState(3000);
  const [packagingCost, setPackagingCost] = useState(400);
  const [employeeCost, setEmployeeCost] = useState(250);
  const [electricity, setElectricity] = useState(30);
  const [machineCost, setMachineCost] = useState(120);
  const [transportation, setTransportation] = useState(80);
  const [miscellaneous, setMiscellaneous] = useState(50);

  const pendingFG_WOs = workOrders.filter(w => ['QC Passed', 'QC_PASSED', 'Completed'].includes(w.status || ''));

  const totalCost = rawCost + packagingCost + employeeCost + electricity + machineCost + transportation + miscellaneous;
  const costPerUnit = formPostedQty > 0 ? Number((totalCost / formPostedQty).toFixed(2)) : 0;
  const simulatedSellingPrice = 48; // mock selling price per unit
  const profitMargin = costPerUnit > 0 ? Number((((simulatedSellingPrice - costPerUnit) / simulatedSellingPrice) * 100).toFixed(1)) : 0;

  const handleSelectWO = (woNo: string) => {
    setFormWoNo(woNo);
    const wo = workOrders.find(w => w.woNo === woNo);
    if (wo) {
      setFormPostedQty(wo.actualProduced || 100);
      
      // Removed mock costs for API integration
      setRawCost(0);
      setPackagingCost(0);
      setEmployeeCost(0);
      setElectricity(0);
      setMachineCost(0);
      setTransportation(0);
      setMiscellaneous(0);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWoNo) return;

    const wo = workOrders.find(w => w.woNo === formWoNo)!;
    const batchNumber = `BATCH-2026-${wo.woNo.split('-').pop()}`;

    try {
      const res = await apiClient.post('/workflows/finished-goods', {
        woId: wo.id,
        batchNumber: batchNumber,
        postedQty: formPostedQty,
        destination: formDestination
      });

      const fgEntry: IFG = {
        id: res.data?.data?.id || `FG-${Date.now().toString().slice(-4)}`,
        woNo: formWoNo,
        productName: wo.productName,
        batchNo: batchNumber,
        postedQty: formPostedQty,
        destination: formDestination,
        postedAt: new Date().toLocaleString(),
        costs: {
          rawMaterial: rawCost,
          packaging: packagingCost,
          employee: employeeCost,
          electricity,
          machine: machineCost,
          transportation,
          miscellaneous,
          total: totalCost,
          costPerUnit,
          profitMargin
        }
      };

      addFinishedGoods(fgEntry);
      setIsPostOpen(false);
      
      toast.success('Batch has been successfully posted to Finished Goods.');
      
      // Reset Form
      setFormWoNo('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to post to finished goods');
    }
  };

  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  const unifiedData = useMemo(() => {
    const data: any[] = [];
    pendingFG_WOs.forEach(wo => {
      const qc = qualityChecks.find(q => q.woId === wo.id && ['Pass', 'Partial Pass'].includes(q.result));
      const batchNo = wo.batchNumber || qc?.batchNo || `BATCH-2026-${wo.woNo.split('-').pop()}`;
      const approvedQty = wo.actualProduced || qc?.checkedQty || 0;
      data.push({
        _type: 'PENDING',
        id: `FG-PENDING-${wo.woNo}`,
        woNo: wo.woNo,
        productName: wo.productName,
        batchNo: batchNo,
        postedQty: approvedQty,
        destination: '-',
        costPerUnit: 0,
        status: 'Pending Post',
        rawWoNo: wo.woNo
      });
    });
    
    finishedGoods.forEach(fg => {
      data.push({
        _type: 'POSTED',
        id: fg.id,
        woNo: fg.woNo,
        productName: fg.productName,
        batchNo: fg.batchNo,
        postedQty: fg.postedQty,
        destination: fg.destination,
        costPerUnit: fg.costs?.costPerUnit || 0,
        status: 'Posted',
        rawFg: fg
      });
    });
    return data;
  }, [pendingFG_WOs, finishedGoods, qualityChecks]);

  const filteredData = useMemo(() => {
    let result = unifiedData;
    if (statusFilter && statusFilter !== '') {
      result = result.filter(row => row.status === statusFilter);
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(row => 
        row.productName.toLowerCase().includes(term) || 
        row.woNo.toLowerCase().includes(term) || 
        row.batchNo.toLowerCase().includes(term)
      );
    }
    return result;
  }, [unifiedData, search, statusFilter]);

  const totalUnitsPosted = finishedGoods.reduce((acc, fg) => acc + (fg.postedQty || 0), 0);
  const avgCostPerUnit = finishedGoods.length > 0 ? (finishedGoods.reduce((acc, fg) => acc + (fg.costs?.costPerUnit || 0), 0) / finishedGoods.length).toFixed(2) : 0;

  const columns = [
    {
      key: 'woNo', label: 'WO NO', sortable: true, className: 'text-left',
      render: (row: any) => (
        <div className="py-0.5 flex flex-col justify-start min-h-[32px]">
          {row._type === 'POSTED' && <div className="font-mono text-[10px] font-bold text-gray-400 mb-0.5">{row.id}</div>}
          <div className="font-mono text-xs font-bold text-gray-900">{row.woNo}</div>
        </div>
      )
    },
    {
      key: 'productName', label: 'PRODUCT NAME', sortable: true, className: 'text-left',
      render: (row: any) => (
        <div className="font-semibold text-xs text-gray-900 max-w-[220px] truncate text-left">{row.productName}</div>
      )
    },
    {
      key: 'batchNo', label: 'BATCH NO', sortable: true, className: 'text-left',
      render: (row: any) => (
        <span className="font-mono text-xs font-medium text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded border border-gray-200/60">
          {row.batchNo}
        </span>
      )
    },
    {
      key: 'postedQty', label: 'QTY', sortable: true, className: 'text-center',
      render: (row: any) => (
        <div className="font-bold text-center text-xs text-gray-900">{row.postedQty}</div>
      )
    },
    {
      key: 'status', label: 'STATUS', sortable: true, className: 'text-center',
      render: (row: any) => (
        <div className="text-center">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${row._type === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${row._type === 'PENDING' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {row.status}
          </span>
        </div>
      )
    },
    {
      key: 'actions', label: 'ACTION', sortable: false, className: 'text-right pr-2',
      render: (row: any) => (
        <div className="flex justify-end pr-2">
          {row._type === 'PENDING' ? (
             <button onClick={() => { handleSelectWO(row.rawWoNo); setIsPostOpen(true); }} className="bg-[#00891D] hover:bg-[#006b17] text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1">
               <Archive size={14} /> Post
             </button>
          ) : (
             <button onClick={() => setSelectedFG(row.rawFg)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1">
               <Calculator size={14} /> Costs
             </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="w-full px-1 sm:px-2 md:px-3 pb-4">
      <div className="mb-2 mt-3 flex justify-between items-end">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            Finished Goods
          </h1>
          <Breadcrumbs />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-full mb-6">
        <StatCard title="Pending Postings" value={pendingFG_WOs.length} icon={Clock} variant="yellow" />
        <StatCard title="Total Posted Logs" value={finishedGoods.length} icon={CheckCircle} variant="green" />
        <StatCard title="Total Units Posted" value={totalUnitsPosted} icon={Package} variant="purple" />
        <StatCard title="Avg Cost / Unit" value={`₹${avgCostPerUnit}`} icon={DollarSign} variant="blue" />
      </div>

      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center mb-6">
        {/* Filters Group */}
        <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm h-10 overflow-x-auto w-full xl:w-auto">
          <div className="px-3 flex items-center justify-center text-gray-500 shrink-0">
            <Filter size={16} />
          </div>
          <div className="w-px h-6 bg-gray-200 shrink-0" />
          
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold text-gray-700 bg-transparent border-none focus:ring-0 outline-none cursor-pointer appearance-none min-w-[120px] shrink-0"
          >
            <option value="">All Status</option>
            <option value="Pending Post">Pending Post</option>
            <option value="Posted">Posted</option>
          </select>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          <button
            onClick={() => { setSearch(''); setStatusFilter(''); }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors bg-transparent cursor-pointer shrink-0"
          >
            <RotateCcw size={14} />
            Reset Filter
          </button>
        </div>

        {/* Search bar & Action */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-stretch">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search FG ledger..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00891D]/20 focus:border-[#00891D] transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setIsPostOpen(true)}
            className="bg-[#00891D] hover:bg-[#006b17] text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0 sm:w-auto w-full h-10"
          >
            <Archive size={16} />
            Post Finished Goods
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-6">
        <DataTable
          columns={columns}
          data={filteredData}
          keyExtractor={(row: any) => row.id}
          onSort={(field) => {
            if (sortField === field) {
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
              setSortField(field);
              setSortDirection('desc');
            }
          }}
          sortField={sortField}
          sortDirection={sortDirection}
        />
      </div>

      {/* Cost Detail Modal */}
      {selectedFG && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 text-left space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">{selectedFG.id}</span>
                <h3 className="font-bold text-slate-800 text-base">{selectedFG.productName}</h3>
              </div>
              <button onClick={() => setSelectedFG(null)} className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100/50 flex justify-between text-emerald-800 font-bold text-sm">
              <span>Post Destination: {selectedFG.destination}</span>
              <span>Yield: {selectedFG.postedQty} units</span>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calculator size={14} />
                <span>Cost Calculation Breakdown</span>
              </h4>
              
              <div className="border border-slate-150 rounded-lg divide-y divide-slate-150 text-xs">
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">Raw Material Cost</span>
                  <span className="font-semibold text-slate-850">₹{selectedFG.costs.rawMaterial}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">Packaging Materials Cost</span>
                  <span className="font-semibold text-slate-850">₹{selectedFG.costs.packaging}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">Labor / Employee Cost</span>
                  <span className="font-semibold text-slate-850">₹{selectedFG.costs.employee}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">Electricity Utility Allocation</span>
                  <span className="font-semibold text-slate-850">₹{selectedFG.costs.electricity}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">Machine Utilization Cost</span>
                  <span className="font-semibold text-slate-850">₹{selectedFG.costs.machine}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">Transportation / Routing Cost</span>
                  <span className="font-semibold text-slate-850">₹{selectedFG.costs.transportation}</span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">Miscellaneous Costs</span>
                  <span className="font-semibold text-slate-850">₹{selectedFG.costs.miscellaneous}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 font-bold text-slate-900">
                  <span>Total Production Cost</span>
                  <span>₹{selectedFG.costs.total}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Cost Per Unit</span>
                <span className="text-base font-bold text-slate-800">₹{selectedFG.costs.costPerUnit}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                <span className="text-[10px] text-emerald-600 block font-bold uppercase">Profit Margin</span>
                <span className="text-base font-bold text-emerald-800">{selectedFG.costs.profitMargin}%</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button onClick={() => setSelectedFG(null)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posting Dialog Form */}
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
                  value={formWoNo}
                  onChange={(e) => handleSelectWO(e.target.value)}
                >
                  <option value="">-- Choose Approved Batch --</option>
                  {pendingFG_WOs.map(w => (
                    <option key={w.id} value={w.woNo}>{w.woNo} - {w.productName} ({w.actualProduced} units)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Posted Quantity</label>
                  <input
                    type="number"
                    required
                    readOnly
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-100 font-bold"
                    value={formPostedQty}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Destination Location *</label>
                  <select
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value as IFG['destination'])}
                  >
                    <option value="Warehouse">Warehouse (Main Stock)</option>
                    <option value="Store">Retail Store Racks</option>
                    <option value="Vehicle">Delivery Van / Vehicle Route</option>
                    <option value="Online Inventory">Online Warehouse Stock</option>
                    <option value="POS">Point of Sale (POS) Rack</option>
                  </select>
                </div>
              </div>

              {/* Posting Summary */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide block">Posting Summary</span>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Approved Quantity</span>
                    <span className="font-semibold text-slate-800">{formPostedQty} units</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Destination Warehouse</span>
                    <span className="font-semibold text-slate-800">{formDestination}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Posting Date</span>
                    <span className="font-semibold text-slate-800">{formatDateTime(new Date().toISOString())}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Posted By</span>
                    <span className="font-semibold text-slate-800">Nisha Reddy Teegala</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Current Status</span>
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[10px]">
                      Ready for Inventory Sync
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 flex justify-end gap-3 -mx-6 -mb-6 p-4 bg-slate-50 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsPostOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle size={16} />
                  <span>Post Finished Goods</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
