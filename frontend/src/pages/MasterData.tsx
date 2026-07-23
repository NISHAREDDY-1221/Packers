import React, { useState, useEffect } from "react";
import {
  Layers,
  Box,
  Tag,
  Home,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { masterDataService } from "../api/masterDataService";
import type {
  Category,
  UnitOfMeasure,
  Product,
  Warehouse,
} from "../api/masterDataService";

export const MasterData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "categories" | "uom" | "products" | "warehouses"
  >("categories");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [uoms, setUOMs] = useState<UnitOfMeasure[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Form states
  const [isCreating, setIsCreating] = useState(false);

  // Category Form
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // UOM Form
  const [uomName, setUomName] = useState("");
  const [uomAbbr, setUomAbbr] = useState("");

  // Product Form
  const [prodSku, setProdSku] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodUomId, setProdUomId] = useState("");

  // Warehouse Form
  const [whName, setWhName] = useState("");
  const [whLoc, setWhLoc] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "categories") {
        const data = await masterDataService.getCategories();
        setCategories(data);
      } else if (activeTab === "uom") {
        const data = await masterDataService.getUOMs();
        setUOMs(data);
      } else if (activeTab === "products") {
        const data = await masterDataService.getProducts();
        setProducts(data);
        // Also pre-fetch categories and uoms for the product creation dropdowns
        const cats = await masterDataService.getCategories();
        setCategories(cats);
        const ums = await masterDataService.getUOMs();
        setUOMs(ums);
      } else if (activeTab === "warehouses") {
        const data = await masterDataService.getWarehouses();
        setWarehouses(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (activeTab === "categories") {
        await masterDataService.createCategory({
          name: catName,
          description: catDesc,
        });
        setCatName("");
        setCatDesc("");
      } else if (activeTab === "uom") {
        await masterDataService.createUOM({
          name: uomName,
          abbreviation: uomAbbr,
        });
        setUomName("");
        setUomAbbr("");
      } else if (activeTab === "products") {
        await masterDataService.createProduct({
          sku: prodSku,
          name: prodName,
          categoryId: prodCategoryId,
          uomId: prodUomId,
          type: "RAW_MATERIAL", // Hardcoded for simplicity unless specified
        });
        setProdSku("");
        setProdName("");
        setProdCategoryId("");
        setProdUomId("");
      } else if (activeTab === "warehouses") {
        await masterDataService.createWarehouse({
          name: whName,
          location: whLoc,
        });
        setWhName("");
        setWhLoc("");
      }

      setSuccess("Created successfully!");
      setIsCreating(false);
      await fetchData(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.message || "Creation failed.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const tabs = [
    { id: "categories", label: "Categories", icon: <Layers size={16} /> },
    { id: "uom", label: "Units of Measure", icon: <Box size={16} /> },
    { id: "products", label: "Products", icon: <Tag size={16} /> },
    { id: "warehouses", label: "Warehouses", icon: <Home size={16} /> },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Master Data Management
          </h2>
          <p className="text-sm text-slate-500">
            Manage foundational entities for the ERP system.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>{isCreating ? "Cancel Creation" : "Create New"}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setIsCreating(false);
              setError("");
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-green-600 text-green-700 bg-green-50/50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create Form Area */}
      {isCreating && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
            Create {tabs.find((t) => t.id === activeTab)?.label}
          </h3>
          <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
            {activeTab === "categories" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Name
                    </label>
                    <input
                      required
                      type="text"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "uom" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Name (e.g. Kilograms)
                    </label>
                    <input
                      required
                      type="text"
                      value={uomName}
                      onChange={(e) => setUomName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Abbreviation (e.g. kg)
                    </label>
                    <input
                      required
                      type="text"
                      value={uomAbbr}
                      onChange={(e) => setUomAbbr(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "products" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Product SKU
                    </label>
                    <input
                      required
                      type="text"
                      value={prodSku}
                      onChange={(e) => setProdSku(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Product Name
                    </label>
                    <input
                      required
                      type="text"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Category
                    </label>
                    {categories.length === 0 ? (
                      <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Please create a Category first.
                      </div>
                    ) : (
                      <select
                        required
                        value={prodCategoryId}
                        onChange={(e) => setProdCategoryId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white"
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Unit of Measure
                    </label>
                    {uoms.length === 0 ? (
                      <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Please create a Unit of Measure first.
                      </div>
                    ) : (
                      <select
                        required
                        value={prodUomId}
                        onChange={(e) => setProdUomId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white"
                      >
                        <option value="">Select UOM</option>
                        {uoms.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.abbreviation})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === "warehouses" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Warehouse Name
                    </label>
                    <input
                      required
                      type="text"
                      value={whName}
                      onChange={(e) => setWhName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Location / Address
                    </label>
                    <input
                      type="text"
                      value={whLoc}
                      onChange={(e) => setWhLoc(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={
                  loading ||
                  (activeTab === "products" &&
                    (categories.length === 0 || uoms.length === 0))
                }
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List View */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && !isCreating ? (
          <div className="p-10 flex justify-center text-green-600">
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                {activeTab === "categories" && (
                  <>
                    <th className="p-4">Name</th>
                    <th className="p-4">Description</th>
                  </>
                )}
                {activeTab === "uom" && (
                  <>
                    <th className="p-4">Name</th>
                    <th className="p-4">Abbreviation</th>
                  </>
                )}
                {activeTab === "products" && (
                  <>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">UOM</th>
                  </>
                )}
                {activeTab === "warehouses" && (
                  <>
                    <th className="p-4">Name</th>
                    <th className="p-4">Location</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {activeTab === "categories" &&
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-800">
                      {c.name}
                    </td>
                    <td className="p-4 text-slate-600">
                      {c.description || "-"}
                    </td>
                  </tr>
                ))}

              {activeTab === "uom" &&
                uoms.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-800">
                      {u.name}
                    </td>
                    <td className="p-4 text-slate-600 font-mono">
                      {u.abbreviation}
                    </td>
                  </tr>
                ))}

              {activeTab === "products" &&
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-medium text-slate-600">
                      {p.sku}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {p.name}
                    </td>
                    <td className="p-4 text-slate-600">{p.category?.name}</td>
                    <td className="p-4 text-slate-600">
                      {p.uom?.abbreviation}
                    </td>
                  </tr>
                ))}

              {activeTab === "warehouses" &&
                warehouses.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-800">
                      {w.name}
                    </td>
                    <td className="p-4 text-slate-600">{w.location || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
