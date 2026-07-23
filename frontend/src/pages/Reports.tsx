import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { useSearchParams } from "react-router-dom";
import {
  Filter,
  Download,
  GitCommit,
  CheckCircle,
  RefreshCw,
  UserCheck,
  DollarSign,
  AlertTriangle,
  Trash2,
  Package,
  Activity,
  RefreshCcw,
  TrendingUp,
  Info,
} from "lucide-react";

export const Reports: React.FC = () => {
  const { finishedGoods, repackings } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab derived from query param, defaults to 'packing'
  const activeTab = searchParams.get("tab") || "packing";

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  // 10 Filters State
  const [filterDate, setFilterDate] = useState("2026-07-16");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [filterProduct, setFilterProduct] = useState("All");
  const [filterBatch, setFilterBatch] = useState("BATCH-2026-RICE-01");
  const [filterWorkOrder, setFilterWorkOrder] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSupervisor, setFilterSupervisor] = useState("All");
  const [filterMachine, setFilterMachine] = useState("All");
  const [filterLocation, setFilterLocation] = useState("All");

  const resetFilters = () => {
    setFilterDate("2026-07-16");
    setFilterCategory("All");
    setFilterEmployee("All");
    setFilterProduct("All");
    setFilterBatch("BATCH-2026-RICE-01");
    setFilterWorkOrder("All");
    setFilterStatus("All");
    setFilterSupervisor("All");
    setFilterMachine("All");
    setFilterLocation("All");
  };

  // 11 Reports configuration
  const reportsList = [
    { id: "packing", label: "Packing Report", icon: CheckCircle },
    { id: "repacking", label: "Repacking Report", icon: RefreshCw },
    { id: "employee", label: "Employee Productivity", icon: UserCheck },
    { id: "traceability", label: "Batch Traceability", icon: GitCommit },
    { id: "cost", label: "Cost Report", icon: DollarSign },
    { id: "rejected", label: "Rejected Report", icon: AlertTriangle },
    { id: "waste", label: "Waste Report", icon: Trash2 },
    { id: "consumption", label: "Material Consumption", icon: Package },
    { id: "machine", label: "Machine Utilization", icon: Activity },
    { id: "conversion", label: "Inventory Conversion", icon: RefreshCcw },
    { id: "profitability", label: "Profitability", icon: TrendingUp },
  ];

  // Helper for Export toast / warning (since it's UI only)
  const handleExport = (type: "Excel" | "PDF") => {
    alert(
      `Exporting current report (${activeTab.toUpperCase()}) as ${type}...`,
    );
  };

  // RENDER REPORT CONTENT BASED ON SELECT TAB
  const renderReportContent = () => {
    switch (activeTab) {
      case "packing":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">
                Packing Production Log
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {finishedGoods.length + 3} records found
              </span>
            </div>
            <div className="overflow-x-auto table-scrollbar vk-table-container">
              <table className="w-full text-left border-collapse vk-table text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">FG Date</th>
                    <th className="p-3">WO No</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3 text-center">Posted Qty</th>
                    <th className="p-3">Destination</th>
                    <th className="p-3">Supervisor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {finishedGoods.map((fg) => (
                    <tr key={fg.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-500">
                        {(fg.postedAt || "2026-07-16").split(" ")[0]}
                      </td>
                      <td className="p-3 font-mono font-semibold">{fg.woNo}</td>
                      <td className="p-3 font-semibold text-slate-700">
                        {fg.productName}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {fg.batchNo}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-850">
                        {fg.postedQty}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {fg.destination}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">Suresh Kumar</td>
                    </tr>
                  ))}
                  {finishedGoods.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-4 text-center text-slate-400"
                      >
                        No packing records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "repacking":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">
                Repacking Recovery Summary
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {repackings.length + 2} records found
              </span>
            </div>
            <div className="overflow-x-auto table-scrollbar vk-table-container">
              <table className="w-full text-left border-collapse vk-table text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">Created Date</th>
                    <th className="p-3">Source Batch</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-center">Recovered Qty</th>
                    <th className="p-3 text-center">Wastage Qty</th>
                    <th className="p-3">New Batch No</th>
                    <th className="p-3">Label Printed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {repackings.map((rp) => (
                    <tr key={rp.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-500">
                        {(rp.createdAt || "-").split(" ")[0]}
                      </td>
                      <td className="p-3 font-mono font-bold text-rose-700">
                        {rp.sourceBatchNo}
                      </td>
                      <td className="p-3 font-semibold text-slate-700">
                        {rp.productName}
                      </td>
                      <td className="p-3 text-center font-bold text-green-700">
                        +{rp.recoverableQuantity}
                      </td>
                      <td className="p-3 text-center font-bold text-rose-600">
                        -{rp.wasteQuantity}
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-800">
                        {rp.newBatchNo}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${rp.newLabelPrinted ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                        >
                          {rp.newLabelPrinted ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {repackings.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-4 text-center text-slate-400"
                      >
                        No repacking records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "employee":
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">
              Employee Productivity Report
            </h3>
            <div className="overflow-x-auto table-scrollbar vk-table-container">
              <table className="w-full text-left border-collapse vk-table text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">
                      No employee productivity records found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "traceability":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-150 pb-2">
              <h3 className="font-bold text-slate-800 text-sm">
                Batch Genealogy & Traceability Drill-down
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  Trace Target:
                </span>
                <input
                  type="text"
                  placeholder="Enter Batch No..."
                  className="px-2 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none"
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                />
              </div>
            </div>

            {/* Traceability Tree Render */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 font-mono text-xs space-y-4">
              <div className="flex items-center gap-2 text-green-700 font-bold">
                <GitCommit size={16} />
                <span>
                  Genealogy Path for: {filterBatch || "BATCH-2026-RICE-01"}
                </span>
              </div>

              <div className="space-y-4 relative pl-4 border-l-2 border-green-200 ml-2">
                <div className="text-slate-400 py-4">
                  No traceability data available.
                </div>
              </div>
            </div>
          </div>
        );

      case "cost":
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">
              Packing Cost Analysis Report
            </h3>
            <div className="overflow-x-auto table-scrollbar vk-table-container">
              <table className="w-full text-left border-collapse vk-table text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-center">Batch Yield</th>
                    <th className="p-3 text-right">Raw Material (₹)</th>
                    <th className="p-3 text-right">Packaging (₹)</th>
                    <th className="p-3 text-right">Labor & Utilities (₹)</th>
                    <th className="p-3 text-right">Total Batch Cost (₹)</th>
                    <th className="p-3 text-right">Unit Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">
                      No cost records found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "rejected":
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">
              QC Rejections Log
            </h3>
            <div className="overflow-x-auto table-scrollbar vk-table-container">
              <table className="w-full text-left border-collapse vk-table text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">QC Date</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-center">Inspected Qty</th>
                    <th className="p-3 text-center">Rejected Qty</th>
                    <th className="p-3">Defect Category</th>
                    <th className="p-3">Action Taken</th>
                    <th className="p-3">Inspector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-400">
                      No rejection records found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "waste":
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">
              Spillage & Scrap Waste Analysis
            </h3>
            <div className="overflow-x-auto table-scrollbar vk-table-container">
              <table className="w-full text-left border-collapse vk-table text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">Material Component</th>
                    <th className="p-3">Waste Category</th>
                    <th className="p-3">Reason / Source</th>
                    <th className="p-3 text-center">Waste Qty</th>
                    <th className="p-3 text-right">Est. Cost Loss (₹)</th>
                    <th className="p-3">Action Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400">
                      No waste records found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "consumption":
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">
              Raw Material & Packaging Consumption Ledger
            </h3>
            <div className="overflow-x-auto table-scrollbar vk-table-container">
              <table className="w-full text-left border-collapse vk-table text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">Item Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">BOM Formula Qty</th>
                    <th className="p-3 text-center">Actual Consumed</th>
                    <th className="p-3 text-center">Variance</th>
                    <th className="p-3 text-center">Wastage %</th>
                    <th className="p-3">Stock Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">
                      No consumption records found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "machine":
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">
              Machine Utilization & OEE Metrics
            </h3>
            <div className="overflow-x-auto table-scrollbar vk-table-container">
              <table className="w-full text-left border-collapse vk-table text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">Machine ID</th>
                    <th className="p-3">Machine Name</th>
                    <th className="p-3 text-center">Run Time</th>
                    <th className="p-3 text-center">Idle / Setup Time</th>
                    <th className="p-3 text-center">Downtime Reason</th>
                    <th className="p-3 text-center">OEE %</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">
                      No machine records found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "conversion":
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">
              Inventory Conversion (Bulk to Retail Yield)
            </h3>
            <div className="overflow-x-auto table-scrollbar vk-table-container">
              <table className="w-full text-left border-collapse vk-table text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">Bulk Input Batch</th>
                    <th className="p-3">Raw Material Used</th>
                    <th className="p-3 text-center">Input Qty (kg)</th>
                    <th className="p-3">Output Retail Product</th>
                    <th className="p-3 text-center">Retail Batch Generated</th>
                    <th className="p-3 text-center">Output Yield Qty</th>
                    <th className="p-3 text-center">Conversion Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">
                      No conversion records found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case "profitability":
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">
              Product Line & Packing Profitability
            </h3>
            <div className="overflow-x-auto table-scrollbar vk-table-container">
              <table className="w-full text-left border-collapse vk-table text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-right">MRP (₹)</th>
                    <th className="p-3 text-right">Selling Price (₹)</th>
                    <th className="p-3 text-right">Packing Cost / Unit (₹)</th>
                    <th className="p-3 text-right">
                      Net Material Cost / Unit (₹)
                    </th>
                    <th className="p-3 text-right">
                      Profit Margin Per Unit (₹)
                    </th>
                    <th className="p-3 text-center">Gross Profit %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400">
                      No profitability records found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-6 text-center text-slate-450 bg-white border border-slate-200 rounded-xl">
            <Info size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold">
              Selected report is currently empty or mock-up data is offline.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 text-left pb-10">
      {/* 10 Filters Grid Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
          <Filter size={14} className="text-green-600" />
          <span>Report Query Filters (10 Dimension Options)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* 1. Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Date
            </label>
            <input
              type="date"
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          {/* 2. Category */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Category
            </label>
            <select
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Staples">Staples</option>
              <option value="Festive">Festive</option>
              <option value="Spices">Spices</option>
              <option value="Dry Fruits">Dry Fruits</option>
            </select>
          </div>

          {/* 3. Employee */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Employee
            </label>
            <select
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none"
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
            >
              <option value="All">All Employees</option>
              <option value="Ramesh Kumar">Ramesh Kumar</option>
              <option value="Sita Sharma">Sita Sharma</option>
              <option value="Amit Patel">Amit Patel</option>
              <option value="Ravi Prasad">Ravi Prasad</option>
            </select>
          </div>

          {/* 4. Product */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Product
            </label>
            <select
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none"
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
            >
              <option value="All">All Products</option>
              <option value="Sona Masoori Rice 500g">
                Sona Masoori Rice 500g
              </option>
              <option value="Premium Almonds 200g">Premium Almonds 200g</option>
              <option value="Dry Fruits Festival Gift Hamper">
                Dry Fruits Festival Gift Hamper
              </option>
            </select>
          </div>

          {/* 5. Batch */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Batch
            </label>
            <select
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none"
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
            >
              <option value="BATCH-2026-RICE-01">BATCH-2026-RICE-01</option>
              <option value="BATCH-2026-FEST-01">BATCH-2026-FEST-01</option>
              <option value="BATCH-2026-ALM-02">BATCH-2026-ALM-02</option>
            </select>
          </div>

          {/* 6. Work Order */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Work Order
            </label>
            <select
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none"
              value={filterWorkOrder}
              onChange={(e) => setFilterWorkOrder(e.target.value)}
            >
              <option value="All">All WOs</option>
              <option value="WO-2026-001">WO-2026-001</option>
              <option value="WO-2026-002">WO-2026-002</option>
              <option value="WO-2026-003">WO-2026-003</option>
            </select>
          </div>

          {/* 7. Status */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Status
            </label>
            <select
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Approved">Approved</option>
              <option value="Material Issued">Material Issued</option>
              <option value="QC Passed">QC Passed</option>
              <option value="QC Pending">QC Pending</option>
            </select>
          </div>

          {/* 8. Supervisor */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Supervisor
            </label>
            <select
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none"
              value={filterSupervisor}
              onChange={(e) => setFilterSupervisor(e.target.value)}
            >
              <option value="All">All Supervisors</option>
              <option value="Suresh Kumar">Suresh Kumar</option>
              <option value="Meena Sharma">Meena Sharma</option>
              <option value="Rajesh Varma">Rajesh Varma</option>
              <option value="Ravi Prasad">Ravi Prasad</option>
            </select>
          </div>

          {/* 9. Machine */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Machine
            </label>
            <select
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none"
              value={filterMachine}
              onChange={(e) => setFilterMachine(e.target.value)}
            >
              <option value="All">All Machines</option>
              <option value="Packer-A1">Packer-A1</option>
              <option value="Packer-A2">Packer-A2</option>
              <option value="Sealer-B1">Sealer-B1</option>
              <option value="Labeler-C1">Labeler-C1</option>
            </select>
          </div>

          {/* 10. Location */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Location
            </label>
            <select
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-green-600 focus:border-green-600 focus:outline-none"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="All">All Locations</option>
              <option value="Hub #4">Hub #4</option>
              <option value="Warehouse Racks">Warehouse Racks (Aisle D)</option>
              <option value="Silo A-1">Silo A-1</option>
            </select>
          </div>
        </div>

        {/* Filter buttons & Export Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-350 bg-white rounded-lg cursor-pointer transition-all"
          >
            Reset Filters
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport("Excel")}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleExport("PDF")}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Reports Layout with Sidebar Switcher */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left hand Report Selection sidebar */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2 h-fit">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider px-3 pb-3 border-b border-slate-100 mb-2">
            Available Reports
          </h3>

          <div className="space-y-1.5 sidebar-scrollbar max-h-[480px] overflow-y-auto pr-1">
            {reportsList.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                    isSelected
                      ? "bg-green-50 text-green-750 border border-green-200/50"
                      : "text-slate-650 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon
                    size={16}
                    className={isSelected ? "text-green-650" : "text-slate-400"}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right hand Report Content Area */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-6 shadow-xs min-h-[400px]">
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};
