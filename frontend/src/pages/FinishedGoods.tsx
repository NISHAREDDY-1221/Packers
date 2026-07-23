import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import type { FinishedGoods as IFG } from "../context/AppContext";
import { Archive, X, Search, Calculator, CheckCircle } from "lucide-react";

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const time = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${day}-${month}-${year} ${time}`;
};

export const FinishedGoods: React.FC = () => {
  const { workOrders, qualityChecks, finishedGoods, addFinishedGoods } =
    useApp();
  const [search, setSearch] = useState("");
  const [selectedFG, setSelectedFG] = useState<IFG | null>(null);
  const [isPostOpen, setIsPostOpen] = useState(false);

  // Form states
  const [formWoNo, setFormWoNo] = useState("");
  const [formPostedQty, setFormPostedQty] = useState(100);
  const [formDestination, setFormDestination] =
    useState<IFG["destination"]>("Warehouse");

  // Costs calculation state
  const [rawCost, setRawCost] = useState(3000);
  const [packagingCost, setPackagingCost] = useState(400);
  const [employeeCost, setEmployeeCost] = useState(250);
  const [electricity, setElectricity] = useState(30);
  const [machineCost, setMachineCost] = useState(120);
  const [transportation, setTransportation] = useState(80);
  const [miscellaneous, setMiscellaneous] = useState(50);

  const pendingFG_WOs = workOrders.filter((w) => w.status === "QC Passed");

  const totalCost =
    rawCost +
    packagingCost +
    employeeCost +
    electricity +
    machineCost +
    transportation +
    miscellaneous;
  const costPerUnit =
    formPostedQty > 0 ? Number((totalCost / formPostedQty).toFixed(2)) : 0;
  const sellingPrice = 0;
  const profitMargin =
    costPerUnit > 0 && sellingPrice > 0
      ? Number((((sellingPrice - costPerUnit) / sellingPrice) * 100).toFixed(1))
      : 0;

  const handleSelectWO = (woNo: string) => {
    setFormWoNo(woNo);
    const wo = workOrders.find((w) => w.woNo === woNo);
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

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWoNo) return;

    const wo = workOrders.find((w) => w.woNo === formWoNo)!;

    const fgEntry: IFG = {
      id: `FG-${Date.now().toString().slice(-4)}`,
      woNo: formWoNo,
      productName: wo.productName,
      batchNo: `BATCH-2026-${wo.woNo.split("-").pop()}`,
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
        profitMargin,
      },
    };

    addFinishedGoods(fgEntry);
    setIsPostOpen(false);

    alert("Batch has been successfully posted to Finished Goods.");

    // Reset Form
    setFormWoNo("");
  };

  return (
    <div className="space-y-6">
      {/* Search and posting trigger */}
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
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-150 pb-3">
            QC Approved Batches
          </h3>

          <div className="space-y-3">
            {pendingFG_WOs.map((wo) => {
              const qc = qualityChecks.find(
                (q) =>
                  q.woId === wo.id &&
                  ["Pass", "Partial Pass"].includes(q.result),
              );
              const batchNo =
                wo.batchNumber ||
                qc?.batchNo ||
                `BATCH-2026-${wo.woNo.split("-").pop()}`;
              const approvedQty = wo.actualProduced || qc?.checkedQty || 0;
              const rejectedQty = wo.actualRejected || 0;
              const qcDate = qc?.completionTime || qc?.date || wo.lastUpdated;
              const inspector =
                qc?.inspector || wo.supervisor || "System Auto-Passed";

              return (
                <div
                  key={wo.id}
                  className="p-4 border border-slate-200 hover:border-slate-300 rounded-xl bg-slate-50 transition-all space-y-3 text-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        QC ID
                      </div>
                      <div className="font-mono font-bold text-slate-700">
                        {qc?.id || `QC-${wo.woNo}`}
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                      QC Passed
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {wo.productName}
                    </h4>
                    <div className="text-slate-500 font-mono text-[10px]">
                      {wo.woNo}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">
                        Batch Number
                      </span>
                      <span className="font-mono font-medium text-slate-700">
                        {batchNo}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">
                        QC Approved
                      </span>
                      <span className="font-medium text-slate-700">
                        {formatDateTime(qcDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">
                        Approved Qty
                      </span>
                      <span className="font-medium text-slate-700">
                        {approvedQty} units
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">
                        Waste Qty
                      </span>
                      <span className="font-medium text-slate-700">
                        {rejectedQty} units
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">
                        Inspector Name
                      </span>
                      <span className="font-medium text-slate-700">
                        {inspector}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleSelectWO(wo.woNo);
                      setIsPostOpen(true);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Archive size={14} />
                    Post to Finished Goods
                  </button>
                </div>
              );
            })}
            {pendingFG_WOs.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No pending postings. Queue empty.
              </div>
            )}
          </div>
        </div>

        {/* Ledger list */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-150 pb-3">
            Finished Goods Ledger
          </h3>

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
                  <th className="p-3 text-center">Cost Per Unit</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {finishedGoods
                  .filter((fg) =>
                    fg.productName.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((fg) => (
                    <tr key={fg.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-semibold text-slate-500">
                        {fg.id}
                      </td>
                      <td className="p-3 font-mono">{fg.woNo}</td>
                      <td className="p-3 font-semibold text-slate-900">
                        {fg.productName}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        {fg.batchNo}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {fg.postedQty}
                      </td>
                      <td className="p-3 font-medium text-indigo-600">
                        {fg.destination}
                      </td>
                      <td className="p-3 text-center font-bold">
                        ₹{fg.costs?.costPerUnit ?? 0}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedFG(fg)}
                          className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-2 py-1 rounded cursor-pointer"
                        >
                          Costs Matrix
                        </button>
                      </td>
                    </tr>
                  ))}
                {finishedGoods.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      No stock postings registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cost Detail Modal */}
      {selectedFG && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-center items-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg shadow-2xl p-6 text-left space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {selectedFG.id}
                </span>
                <h3 className="font-bold text-slate-800 text-base">
                  {selectedFG.productName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFG(null)}
                className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
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
                  <span className="font-semibold text-slate-850">
                    ₹{selectedFG.costs?.rawMaterial ?? 0}
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">
                    Packaging Materials Cost
                  </span>
                  <span className="font-semibold text-slate-850">
                    ₹{selectedFG.costs?.packaging ?? 0}
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">Labor / Employee Cost</span>
                  <span className="font-semibold text-slate-850">
                    ₹{selectedFG.costs?.employee ?? 0}
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">
                    Electricity Utility Allocation
                  </span>
                  <span className="font-semibold text-slate-850">
                    ₹{selectedFG.costs?.electricity ?? 0}
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">
                    Machine Utilization Cost
                  </span>
                  <span className="font-semibold text-slate-850">
                    ₹{selectedFG.costs?.machine ?? 0}
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">
                    Transportation / Routing Cost
                  </span>
                  <span className="font-semibold text-slate-850">
                    ₹{selectedFG.costs?.transportation ?? 0}
                  </span>
                </div>
                <div className="flex justify-between p-2.5">
                  <span className="text-slate-500">Miscellaneous Costs</span>
                  <span className="font-semibold text-slate-850">
                    ₹{selectedFG.costs?.miscellaneous ?? 0}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 font-bold text-slate-900">
                  <span>Total Production Cost</span>
                  <span>₹{selectedFG.costs?.total ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">
                  Cost Per Unit
                </span>
                <span className="text-base font-bold text-slate-800">
                  ₹{selectedFG.costs?.costPerUnit ?? 0}
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                <span className="text-[10px] text-emerald-600 block font-bold uppercase">
                  Profit Margin
                </span>
                <span className="text-base font-bold text-emerald-800">
                  {selectedFG.costs?.profitMargin ?? 0}%
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedFG(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer"
              >
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
              <button
                onClick={() => setIsPostOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handlePostSubmit}
              className="p-6 space-y-4 flex-1 text-left text-xs"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Select QC Passed Batch *
                </label>
                <select
                  required
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                  value={formWoNo}
                  onChange={(e) => handleSelectWO(e.target.value)}
                >
                  <option value="">-- Choose Approved Batch --</option>
                  {pendingFG_WOs.map((w) => (
                    <option key={w.id} value={w.woNo}>
                      {w.woNo} - {w.productName} ({w.actualProduced} units)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Posted Quantity
                  </label>
                  <input
                    type="number"
                    required
                    readOnly
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-100 font-bold"
                    value={formPostedQty}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Destination Location *
                  </label>
                  <select
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
                    value={formDestination}
                    onChange={(e) =>
                      setFormDestination(e.target.value as IFG["destination"])
                    }
                  >
                    <option value="Warehouse">Warehouse (Main Stock)</option>
                    <option value="Store">Retail Store Racks</option>
                    <option value="Vehicle">
                      Delivery Van / Vehicle Route
                    </option>
                    <option value="Online Inventory">
                      Online Warehouse Stock
                    </option>
                    <option value="POS">Point of Sale (POS) Rack</option>
                  </select>
                </div>
              </div>

              {/* Posting Summary */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide block">
                  Posting Summary
                </span>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">
                      Approved Quantity
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formPostedQty} units
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">
                      Destination Warehouse
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formDestination}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">
                      Posting Date
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatDateTime(new Date().toISOString())}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">
                      Posted By
                    </span>
                    <span className="font-semibold text-slate-800">
                      Nisha Reddy Teegala
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                      Current Status
                    </span>
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
