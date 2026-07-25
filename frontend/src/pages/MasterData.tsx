import React, { useState, useEffect } from 'react';
import { Layers, Box, Tag, Home, Plus, Loader2, CheckCircle2, AlertCircle, Edit2, Trash2, Power, Search } from 'lucide-react';
import { masterDataService } from '../api/masterDataService';
import type { Category, UnitOfMeasure } from '../api/masterDataService';
import DataTable from '../components/ui/Table/DataTable';
import IconButton from '../components/ui/Button/IconButton';
import ConfirmModal from '../components/ui/Modal/ConfirmModal';
import Modal from '../components/ui/Modal/Modal';
import Button from '../components/ui/Button/Button';

export const MasterData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'uom' | 'products' | 'warehouses'>('categories');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [dataList, setDataList] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uoms, setUOMs] = useState<UnitOfMeasure[]>([]);

  // Modals
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'categories') {
        const data = await masterDataService.getCategories();
        setDataList(data);
      } else if (activeTab === 'uom') {
        const data = await masterDataService.getUOMs();
        setDataList(data);
      } else if (activeTab === 'products') {
        const data = await masterDataService.getProducts();
        setDataList(data);
        const cats = await masterDataService.getCategories();
        setCategories(cats);
        const ums = await masterDataService.getUOMs();
        setUOMs(ums);
      } else if (activeTab === 'warehouses') {
        const data = await masterDataService.getWarehouses();
        setDataList(data);
      }
      setSearchQuery('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isCreating) {
        if (activeTab === 'categories') await masterDataService.createCategory(formData);
        if (activeTab === 'uom') await masterDataService.createUOM(formData);
        if (activeTab === 'products') await masterDataService.createProduct({ ...formData, type: formData.type || 'RAW_MATERIAL' });
        if (activeTab === 'warehouses') await masterDataService.createWarehouse(formData);
        setSuccess('Created successfully!');
      } else if (isEditing && selectedRecord) {
        if (activeTab === 'categories') await masterDataService.updateCategory(selectedRecord.id, formData);
        if (activeTab === 'uom') await masterDataService.updateUOM(selectedRecord.id, formData);
        if (activeTab === 'products') await masterDataService.updateProduct(selectedRecord.id, formData);
        if (activeTab === 'warehouses') await masterDataService.updateWarehouse(selectedRecord.id, formData);
        setSuccess('Updated successfully!');
      }
      closeModals();
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (activeTab === 'categories') await masterDataService.deleteCategory(selectedRecord.id);
      if (activeTab === 'uom') await masterDataService.deleteUOM(selectedRecord.id);
      if (activeTab === 'products') await masterDataService.deleteProduct(selectedRecord.id);
      if (activeTab === 'warehouses') await masterDataService.deleteWarehouse(selectedRecord.id);
      setSuccess('Deleted successfully!');
      closeModals();
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed.');
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedRecord) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (activeTab === 'categories') await masterDataService.toggleCategoryStatus(selectedRecord.id);
      if (activeTab === 'uom') await masterDataService.toggleUOMStatus(selectedRecord.id);
      if (activeTab === 'products') await masterDataService.toggleProductStatus(selectedRecord.id);
      if (activeTab === 'warehouses') await masterDataService.toggleWarehouseStatus(selectedRecord.id);
      setSuccess('Status toggled successfully!');
      closeModals();
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Toggle status failed.');
    } finally {
      setLoading(false);
      setIsToggleModalOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const closeModals = () => {
    setIsCreating(false);
    setIsEditing(false);
    setIsDeleteModalOpen(false);
    setIsToggleModalOpen(false);
    setSelectedRecord(null);
    setFormData({});
  };

  const openCreate = () => {
    closeModals();
    setFormData({});
    setIsCreating(true);
  };

  const openEdit = (record: any) => {
    closeModals();
    setSelectedRecord(record);
    setFormData(record);
    setIsEditing(true);
  };

  const openDelete = (record: any) => {
    setSelectedRecord(record);
    setIsDeleteModalOpen(true);
  };

  const openToggle = (record: any) => {
    setSelectedRecord(record);
    setIsToggleModalOpen(true);
  };

  const checkIsReferenced = (row: any) => {
    if (!row._count) return false;
    const { products, recipesAsOutput, recipeItems, workOrders, finishedGoods, storageLocations } = row._count;
    return (products > 0) || (recipesAsOutput > 0) || (recipeItems > 0) || (workOrders > 0) || (finishedGoods > 0) || (storageLocations > 0);
  };

  const filteredData = React.useMemo(() => {
    return dataList.filter(item => {
      if (!searchQuery) return true;
      const lowerQuery = searchQuery.toLowerCase();
      if (activeTab === 'categories') return item.name?.toLowerCase().includes(lowerQuery) || item.description?.toLowerCase().includes(lowerQuery);
      if (activeTab === 'uom') return item.name?.toLowerCase().includes(lowerQuery) || item.abbreviation?.toLowerCase().includes(lowerQuery);
      if (activeTab === 'products') return item.name?.toLowerCase().includes(lowerQuery) || item.sku?.toLowerCase().includes(lowerQuery);
      if (activeTab === 'warehouses') return item.name?.toLowerCase().includes(lowerQuery) || item.location?.toLowerCase().includes(lowerQuery);
      return true;
    });
  }, [dataList, searchQuery, activeTab]);

  const tabs = [
    { id: 'categories', label: 'Categories', icon: <Layers size={16} /> },
    { id: 'uom', label: 'Units of Measure', icon: <Box size={16} /> },
    { id: 'products', label: 'Products', icon: <Tag size={16} /> },
    { id: 'warehouses', label: 'Warehouses', icon: <Home size={16} /> },
  ] as const;

  const renderActions = (row: any) => {
    const isReferenced = checkIsReferenced(row);
    const deleteTooltip = isReferenced ? 'Cannot delete because it is assigned to other records' : 'Delete';
    return (
      <div className="flex justify-center gap-2">
        <IconButton
          icon={Edit2}
          iconSize={14}
          aria-label="Edit"
          title="Edit"
          className="text-amber-600 hover:bg-amber-50"
          onClick={() => openEdit(row)}
        />
        <IconButton
          icon={Power}
          iconSize={14}
          aria-label="Toggle Status"
          title={row.isActive ? 'Deactivate' : 'Activate'}
          className={row.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}
          onClick={() => openToggle(row)}
        />
        <div title={deleteTooltip}>
          <IconButton
            icon={Trash2}
            iconSize={14}
            aria-label="Delete"
            className={`text-red-600 hover:bg-red-50 ${isReferenced ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isReferenced}
            onClick={() => { if (!isReferenced) openDelete(row); }}
          />
        </div>
      </div>
    );
  };

  const getColumns = () => {
    const cols: any[] = [];
    if (activeTab === 'categories') {
      cols.push({ key: 'name', label: 'Name', className: 'w-[35%] text-left p-4', render: (r: any) => <span className="font-semibold text-slate-800 block truncate max-w-[200px]" title={r.name}>{r.name}</span> });
      cols.push({ key: 'description', label: 'Description', className: 'w-[40%] text-left p-4', render: (r: any) => <span className="text-slate-600 block truncate max-w-[300px]" title={r.description}>{r.description || '-'}</span> });
    } else if (activeTab === 'uom') {
      cols.push({ key: 'name', label: 'Name', className: 'w-[45%] text-left p-4', render: (r: any) => <span className="font-semibold text-slate-800 block truncate max-w-[250px]" title={r.name}>{r.name}</span> });
      cols.push({ key: 'abbreviation', label: 'Abbreviation', className: 'w-[30%] text-left p-4', render: (r: any) => <span className="font-mono text-slate-600">{r.abbreviation}</span> });
    } else if (activeTab === 'products') {
      cols.push({ key: 'sku', label: 'SKU', className: 'w-[20%] text-left p-4', render: (r: any) => <span className="font-mono font-medium text-slate-600 block truncate max-w-[120px]" title={r.sku}>{r.sku}</span> });
      cols.push({ key: 'name', label: 'Name', className: 'w-[30%] text-left p-4', render: (r: any) => <span className="font-semibold text-slate-800 block truncate max-w-[200px]" title={r.name}>{r.name}</span> });
      cols.push({ key: 'category', label: 'Category', className: 'w-[15%] text-left p-4', render: (r: any) => <span className="text-slate-600 block truncate max-w-[150px]" title={r.category?.name}>{r.category?.name}</span> });
      cols.push({ key: 'uom', label: 'UOM', className: 'w-[10%] text-left p-4', render: (r: any) => <span className="text-slate-600">{r.uom?.abbreviation}</span> });
    } else if (activeTab === 'warehouses') {
      cols.push({ key: 'name', label: 'Name', className: 'w-[35%] text-left p-4', render: (r: any) => <span className="font-semibold text-slate-800 block truncate max-w-[200px]" title={r.name}>{r.name}</span> });
      cols.push({ key: 'location', label: 'Location', className: 'w-[40%] text-left p-4', render: (r: any) => <span className="text-slate-600 block truncate max-w-[300px]" title={r.location}>{r.location || '-'}</span> });
    }
    cols.push({ 
      key: 'isActive', 
      label: 'Status', 
      className: 'w-[10%] text-center p-4',
      render: (r: any) => (
        <div className="flex justify-center">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {r.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      ) 
    });
    cols.push({ key: 'actions', label: 'Action', className: 'w-[15%] text-center p-4', render: renderActions });
    return cols;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Master Data Management</h2>
          <p className="text-sm text-slate-500">Manage foundational entities for the ERP system.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          <Plus size={16} />
          <span>Create New</span>
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
            onClick={() => { setActiveTab(tab.id); closeModals(); setError(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-green-600 text-green-700 bg-green-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00891D] focus:border-transparent dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>

        {loading && dataList.length === 0 ? (
          <div className="p-10 flex justify-center text-green-600">
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : (
          <DataTable columns={getColumns()} data={filteredData} keyExtractor={(row: any) => row.id} />
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={isCreating || isEditing} onClose={closeModals} title={`${isCreating ? 'Create' : 'Edit'} ${tabs.find(t => t.id === activeTab)?.label}`} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
            {activeTab === 'categories' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                  <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                  <input type="text" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600" />
                </div>
              </div>
            )}

            {activeTab === 'uom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Name (e.g. Kilograms)</label>
                  <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Abbreviation (e.g. kg)</label>
                  <input required type="text" value={formData.abbreviation || ''} onChange={e => setFormData({...formData, abbreviation: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600" />
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Product SKU</label>
                  <input required type="text" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Product Name</label>
                  <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
                  <select required value={formData.categoryId || ''} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Unit of Measure</label>
                  <select required value={formData.uomId || ''} onChange={e => setFormData({...formData, uomId: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white">
                    <option value="">Select UOM</option>
                    {uoms.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'warehouses' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Warehouse Name</label>
                  <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Location / Address</label>
                  <input type="text" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600" />
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4 gap-2 border-t mt-4 border-slate-100">
              <Button type="button" variant="secondary" onClick={closeModals}>Cancel</Button>
              <Button type="submit" variant="primary" isLoading={loading}>Save</Button>
            </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={handleDelete}
        title="Confirm Delete"
        message={`Are you sure you want to delete ${selectedRecord?.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={loading}
      />

      <ConfirmModal
        isOpen={isToggleModalOpen}
        onClose={closeModals}
        onConfirm={handleToggleStatus}
        title="Confirm Status Change"
        message={`Are you sure you want to ${selectedRecord?.isActive ? 'deactivate' : 'activate'} ${selectedRecord?.name}?`}
        confirmText={selectedRecord?.isActive ? 'Deactivate' : 'Activate'}
        variant={selectedRecord?.isActive ? 'danger' : 'info'}
        isLoading={loading}
      />

    </div>
  );
};
