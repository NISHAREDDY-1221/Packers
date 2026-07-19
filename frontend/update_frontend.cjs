const fs = require('fs');

// --- WorkOrders.tsx update ---
let wo = fs.readFileSync('src/pages/WorkOrders.tsx', 'utf8');

// 1. Imports
wo = wo.replace(/import type \{ WorkOrder \} from '\.\.\/context\/AppContext';/, `import { workOrderService, WoStatus, WoPriority, WorkOrder } from '../api/workOrderService';`);
// 2. KANBAN_COLUMNS
wo = wo.replace(/const KANBAN_COLUMNS: WorkOrder\['status'\]\[\] = \[[\s\S]*?\];/, 
`const KANBAN_COLUMNS: WoStatus[] = [
  'DRAFT',
  'PENDING',
  'APPROVED',
  'MATERIAL_ISSUED',
  'PACKING_STARTED',
  'QC_PENDING',
  'COMPLETED',
  'CANCELLED'
];`);
// Timeline step
wo = wo.replace(/status: WorkOrder\['status'\];/, `status: WoStatus;`);
// App Context destructuring
wo = wo.replace(/const \{ workOrders, addWorkOrder, updateWorkOrderStatus, deleteWorkOrder \} = useApp\(\);/, 
`const { workOrders: _, addWorkOrder, updateWorkOrderStatus, deleteWorkOrder } = useApp();

  const [apiWorkOrders, setApiWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const workOrders = apiWorkOrders;

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const res = await workOrderService.getWorkOrders();
      setApiWorkOrders(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWorkOrders();
  }, []);
`);
// Derived maps
wo = wo.replace(/const categories = useMemo\(\(\) => Array\.from\(new Set\(workOrders\.map\(wo => wo\.category\)\)\), \[workOrders\]\);/g, `const categories = useMemo(() => Array.from(new Set(workOrders.map(wo => wo.product?.category?.name || 'Unknown'))), [workOrders]);`);
wo = wo.replace(/const supervisors = useMemo\(\(\) => Array\.from\(new Set\(workOrders\.map\(wo => wo\.supervisor\)\)\), \[workOrders\]\);/g, `const supervisors = useMemo(() => Array.from(new Set(workOrders.map(wo => wo.supervisor?.name || wo.supervisorId))), [workOrders]);`);
wo = wo.replace(/const teams = useMemo\(\(\) => Array\.from\(new Set\(workOrders\.map\(wo => wo\.assignedTeam\)\)\), \[workOrders\]\);/g, `const teams = useMemo(() => ['Packing Team Alpha', 'Packing Team Beta', 'Quality Assurance'], []);`);

// Summary
wo = wo.replace(/workOrders\.filter\(w => w\.status === 'Draft'\)/g, `workOrders.filter(w => w.status === 'DRAFT')`);
wo = wo.replace(/workOrders\.filter\(w => w\.status === 'Pending'\)/g, `workOrders.filter(w => w.status === 'PENDING')`);
wo = wo.replace(/workOrders\.filter\(w => w\.status === 'Approved'\)/g, `workOrders.filter(w => w.status === 'APPROVED')`);
wo = wo.replace(/workOrders\.filter\(w => w\.status === 'Packing Started'\)/g, `workOrders.filter(w => w.status === 'PACKING_STARTED')`);
wo = wo.replace(/workOrders\.filter\(w => w\.status === 'QC Pending'\)/g, `workOrders.filter(w => w.status === 'QC_PENDING')`);
wo = wo.replace(/workOrders\.filter\(w => w\.status === 'Completed'\)/g, `workOrders.filter(w => w.status === 'COMPLETED')`);

wo = wo.replace(/matchesKpi = wo\.status === 'Draft'/g, `matchesKpi = wo.status === 'DRAFT'`);
wo = wo.replace(/matchesKpi = wo\.status === 'Pending'/g, `matchesKpi = wo.status === 'PENDING'`);
wo = wo.replace(/matchesKpi = wo\.status === 'Approved'/g, `matchesKpi = wo.status === 'APPROVED'`);
wo = wo.replace(/matchesKpi = wo\.status === 'Packing Started'/g, `matchesKpi = wo.status === 'PACKING_STARTED'`);
wo = wo.replace(/matchesKpi = wo\.status === 'QC Pending'/g, `matchesKpi = wo.status === 'QC_PENDING'`);
wo = wo.replace(/matchesKpi = wo\.status === 'Completed'/g, `matchesKpi = wo.status === 'COMPLETED'`);

// Status Colors
wo = wo.replace(/case 'Draft':/g, `case 'DRAFT':`);
wo = wo.replace(/case 'Pending':/g, `case 'PENDING':`);
wo = wo.replace(/case 'Approved':/g, `case 'APPROVED':`);
wo = wo.replace(/case 'Material Issued':/g, `case 'MATERIAL_ISSUED':`);
wo = wo.replace(/case 'Packing Started':/g, `case 'PACKING_STARTED':`);
wo = wo.replace(/case 'QC Pending':/g, `case 'QC_PENDING':`);
wo = wo.replace(/case 'QC Passed':/g, `case 'QC_PASSED':`);
wo = wo.replace(/case 'Completed':/g, `case 'COMPLETED':`);
wo = wo.replace(/case 'Cancelled':/g, `case 'CANCELLED':`);

// Priority Colors
wo = wo.replace(/case 'Urgent':/g, `case 'URGENT':`);
wo = wo.replace(/case 'High':/g, `case 'HIGH':`);
wo = wo.replace(/case 'Medium':/g, `case 'MEDIUM':`);
wo = wo.replace(/case 'Low':/g, `case 'LOW':`);

// Handle Create WO
wo = wo.replace(/const handleCreateWO = \(e: React\.FormEvent\) => \{[\s\S]*?showToast\(\`Work order \$\{newWO\.woNo\} created as Draft\.\`\);[\s\S]*?setFormPriority\('Medium'\);\n  \};/,
`const handleCreateWO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecipeId) return;
    const recipe = apiRecipes.find(r => r.id === formRecipeId)!;
    try {
      await workOrderService.createWorkOrder({
        productId: recipe.outputProductId,
        recipeId: formRecipeId,
        requiredQty: Number(formQty),
        priority: formPriority as WoPriority,
        expectedDate: formExpectedCompletion,
        supervisorId: '00000000-0000-0000-0000-000000000000'
      });
      setIsCreateOpen(false);
      showToast('Work order created successfully.');
      fetchWorkOrders();
      setFormRecipeId('');
      setFormQty(100);
      setFormPriority('MEDIUM');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating Work Order');
    }
  };`);
  
wo = wo.replace(/const handleSaveEdit = \(e: React\.FormEvent\) => \{[\s\S]*?showToast\(\`Work order \$\{isEditOpen\.woNo\} updated successfully\.\`\);\n  \};/,
`const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditOpen) return;
    try {
      await workOrderService.updateWorkOrderStatus(isEditOpen.id, isEditOpen.status);
      setIsEditOpen(null);
      showToast('Work order updated successfully.');
      fetchWorkOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating Work Order');
    }
  };`);
  
wo = wo.replace(/const handleRefresh = \(\) => \{\n    showToast\("Work orders list refreshed successfully!"\);\n  \};/,
`const handleRefresh = () => {
    fetchWorkOrders();
    showToast("Work orders list refreshed successfully!");
  };`);

// Transition helper
wo = wo.replace(/case 'Draft':/g, `case 'DRAFT':`);
wo = wo.replace(/to === 'Pending'/g, `to === 'PENDING'`);
wo = wo.replace(/to === 'Approved'/g, `to === 'APPROVED'`);
wo = wo.replace(/to === 'Cancelled'/g, `to === 'CANCELLED'`);
wo = wo.replace(/case 'Pending':/g, `case 'PENDING':`);
wo = wo.replace(/case 'Approved':/g, `case 'APPROVED':`);
wo = wo.replace(/to === 'Material Issued'/g, `to === 'MATERIAL_ISSUED'`);
wo = wo.replace(/case 'Material Issued':/g, `case 'MATERIAL_ISSUED':`);
wo = wo.replace(/to === 'Packing Started'/g, `to === 'PACKING_STARTED'`);
wo = wo.replace(/case 'Packing Started':/g, `case 'PACKING_STARTED':`);
wo = wo.replace(/to === 'QC Pending'/g, `to === 'QC_PENDING'`);
wo = wo.replace(/case 'QC Pending':/g, `case 'QC_PENDING':`);
wo = wo.replace(/to === 'Completed'/g, `to === 'COMPLETED'`);
wo = wo.replace(/updateWorkOrderStatus\(woId, targetStatus\);/g, 
`workOrderService.updateWorkOrderStatus(woId, targetStatus).then(fetchWorkOrders).catch(console.error);`);

wo = wo.replace(/\{ status: 'Draft'/gi, `{ status: 'DRAFT'`);
wo = wo.replace(/\{ status: 'Pending'/gi, `{ status: 'PENDING'`);
wo = wo.replace(/\{ status: 'Approved'/gi, `{ status: 'APPROVED'`);
wo = wo.replace(/\{ status: 'Material Issued'/gi, `{ status: 'MATERIAL_ISSUED'`);
wo = wo.replace(/\{ status: 'Packing Started'/gi, `{ status: 'PACKING_STARTED'`);
wo = wo.replace(/\{ status: 'QC Pending'/gi, `{ status: 'QC_PENDING'`);
wo = wo.replace(/\{ status: 'Completed'/gi, `{ status: 'COMPLETED'`);

wo = wo.replace(/<option value="Low">Low<\/option>/g, `<option value="LOW">Low</option>`);
wo = wo.replace(/<option value="Medium">Medium<\/option>/g, `<option value="MEDIUM">Medium</option>`);
wo = wo.replace(/<option value="High">High<\/option>/g, `<option value="HIGH">High</option>`);
wo = wo.replace(/<option value="Urgent">Urgent<\/option>/g, `<option value="URGENT">Urgent</option>`);

wo = wo.replace(/setFormPriority\('Medium'\)/g, `setFormPriority('MEDIUM')`);
wo = wo.replace(/formPriority, setFormPriority] = useState<WorkOrder\['priority'\]>\('Medium'\)/g, `formPriority, setFormPriority] = useState<WoPriority>('MEDIUM')`);
wo = wo.replace(/editPriority, setEditPriority] = useState<WorkOrder\['priority'\]>\('Medium'\)/g, `editPriority, setEditPriority] = useState<WoPriority>('MEDIUM')`);

// Table accessors mapping
wo = wo.replace(/wo\.woNo/g, `(wo.woNumber || wo.id)`);
wo = wo.replace(/wo\.productName/g, `(wo.product?.name || '')`);
wo = wo.replace(/wo\.recipeId/g, `(wo.recipe?.code || wo.recipeId)`);
wo = wo.replace(/wo\.assignedTeam/g, `('Team Alpha')`);
wo = wo.replace(/wo\.supervisor/g, `(wo.supervisor?.name || '')`);
wo = wo.replace(/wo\.expectedCompletion/g, `(wo.expectedDate || '')`);
wo = wo.replace(/wo\.date/g, `(wo.createdAt)`);
wo = wo.replace(/wo\.category/g, `(wo.product?.category?.name || 'Misc')`);

wo = wo.replace(/deleteWorkOrder\(selectedWO\.id\);[\s\S]*?setSelectedWO\(null\);/g, 
`workOrderService.updateWorkOrderStatus(selectedWO.id, 'CANCELLED').then(() => { showToast('Cancelled work order.'); setSelectedWO(null); fetchWorkOrders(); }).catch(console.error);`);

wo = wo.replace(/updateWorkOrderStatus\(selectedWO\.id, 'Pending'\);[\s\S]*?setSelectedWO\(null\);/g, 
`workOrderService.updateWorkOrderStatus(selectedWO.id, 'PENDING').then(() => { showToast('Submitted for approval.'); setSelectedWO(null); fetchWorkOrders(); }).catch(console.error);`);

wo = wo.replace(/updateWorkOrderStatus\(selectedWO\.id, 'Approved'\);[\s\S]*?setSelectedWO\(null\);/g, 
`workOrderService.updateWorkOrderStatus(selectedWO.id, 'APPROVED').then(() => { showToast('Approved work order.'); setSelectedWO(null); fetchWorkOrders(); }).catch(console.error);`);

wo = wo.replace(/updateWorkOrderStatus\(selectedWO\.id, 'Cancelled'\);[\s\S]*?setSelectedWO\(null\);/g, 
`workOrderService.updateWorkOrderStatus(selectedWO.id, 'CANCELLED').then(() => { showToast('Rejected work order.'); setSelectedWO(null); fetchWorkOrders(); }).catch(console.error);`);

fs.writeFileSync('src/pages/WorkOrders.tsx', wo);

// --- MaterialIssue.tsx update ---
let mi = fs.readFileSync('src/pages/MaterialIssue.tsx', 'utf8');

mi = mi.replace(/import \{ useApp \} from '\.\.\/context\/AppContext';\nimport type \{ MaterialIssue as IMaterialIssue \} from '\.\.\/context\/AppContext';/, 
`import { useApp } from '../context/AppContext';
import { workOrderService, WorkOrder } from '../api/workOrderService';
import type { MaterialIssueRecord as IMaterialIssue } from '../api/workOrderService';
import React, { useEffect } from 'react';
`);

mi = mi.replace(/const \{ materialIssues, issueMaterials, workOrders \} = useApp\(\);/,
`const { materialIssues: _mi, issueMaterials: _im, workOrders: _wo } = useApp();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const fetchWO = async () => {
    try {
      const res = await workOrderService.getWorkOrders();
      setWorkOrders(res.data);
    } catch(e) {}
  };
  useEffect(() => { fetchWO(); }, []);

  // Compute pending issues from APPROVED work orders
  const pendingIssues = useMemo(() => {
    return workOrders.filter(w => w.status === 'APPROVED').map(w => ({
      id: 'MI-PEND-' + w.woNumber,
      woId: w.id,
      woNo: w.woNumber,
      status: 'Pending',
      materials: w.recipe?.items?.map(item => ({
        item: item.inputProduct?.name || 'Unknown',
        required: item.requiredQty * w.requiredQty,
        available: 9999, // mock for now
        issued: 0,
        batchNo: '',
        location: '',
        type: item.isPackaging ? 'Packaging' : 'Raw'
      })) || []
    }));
  }, [workOrders]);

  // Compute completed issues from MATERIAL_ISSUED work orders
  const completedIssues = useMemo(() => {
    return workOrders.filter(w => w.status === 'MATERIAL_ISSUED' || w.status === 'PACKING_STARTED' || w.status === 'COMPLETED').map(w => ({
      id: 'MI-COMP-' + w.woNumber,
      woId: w.id,
      woNo: w.woNumber,
      status: 'Issued',
      issuedAt: w.updatedAt,
      materials: []
    }));
  }, [workOrders]);
`);

mi = mi.replace(/const pendingIssues = useMemo\(\(\) => materialIssues\.filter\(mi => mi\.status === 'Pending'\), \[materialIssues\]\);/, '');
mi = mi.replace(/const completedIssues = useMemo\(\(\) => materialIssues\.filter\(mi => mi\.status === 'Issued'\), \[materialIssues\]\);/, '');

// Handle submit
mi = mi.replace(/issueMaterials\(selectedIssue\.id, updatedMaterials\);[\s\S]*?setSelectedIssue\(null\);/, 
`workOrderService.issueMaterials(selectedIssue.woId, updatedMaterials).then(() => {
      setShowConfirmModal(false);
      setSelectedIssue(null);
      fetchWO();
      showToast('Materials issued successfully.');
    }).catch((e: any) => {
      alert(e.response?.data?.message || 'Error issuing materials');
    });`);
    
mi = mi.replace(/wo\.woNo/g, `wo.woNumber`);
// Type issue fixing for selectedIssue, make it any as we mapped it dynamically
mi = mi.replace(/const \[selectedIssue, setSelectedIssue\] = useState<IMaterialIssue \| null>\(null\);/, `const [selectedIssue, setSelectedIssue] = useState<any | null>(null);`);

fs.writeFileSync('src/pages/MaterialIssue.tsx', mi);

console.log("Updated both files.");
