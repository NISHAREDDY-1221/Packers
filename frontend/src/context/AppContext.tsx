import React, { createContext, useContext, useState, useEffect } from 'react';
import { workOrderService } from '../api/workOrderService';
import { qualityCheckService } from '../api/qualityCheckService';
import { repackingService } from '../api/repackingService';
import apiClient from '../api/axios';

export interface RecipeConfig {
  id: string;
  packingName: string;
  category: string;
  packingType: string;
  brand: string;
  outputSku: string;
  outputQuantity: number;
  unit: string;
  defaultBatchFormula: string;
  defaultBarcodeFormat: string;
  shelfLife: number;
  storageCondition: string;
  labelTemplate: string;
  gst: number;
  hsn: string;
  mrp: number;
  sellingPrice: number;
  bomItems: {
    inputItem: string;
    requiredQuantity: number;
    expectedLoss: number;
    tolerance: number;
  }[];
  packagingMaterials: {
    material: string;
    quantity: number;
  }[];
}

export interface WorkOrder {
  id: string;
  woNo: string;
  date: string;
  requestedBy: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category: string;
  productName: string;
  recipeId: string;
  requiredQuantity: number;
  expectedCompletion: string;
  assignedTeam: string;
  supervisor: string;
  operatorId?: string;
  operator?: { id: string; name: string };
  status: 'Draft' | 'Pending' | 'Approved' | 'Material Issued' | 'Packing Started' | 'QC Pending' | 'QC Passed' | 'Completed' | 'Cancelled' | 'Labels Printed' | 'QC Printed' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'MATERIAL_ISSUED' | 'PACKING_STARTED' | 'PACKING_COMPLETED' | 'LABEL_APPLICATION_ASSIGNED' | 'LABEL_APPLICATION_IN_PROGRESS' | 'LABELS_APPLIED' | 'QC_PENDING' | 'QC_PASSED' | 'COMPLETED' | 'CANCELLED' | 'LABELS_PRINTED';
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string;
  actualProduced?: number;
  actualRejected?: number;
  labelsPrinted?: number;
  labelsApplied?: number;
  packingTimeSeconds?: number;
  machine?: string;
  shift?: string;
  warehouse?: string;
  productionLine?: string;
  batchNumber?: string;
  lastUpdated?: string;
  rejectedQuantity?: number;
  wastePercent?: number;
}

export interface MaterialIssue {
  id: string;
  woId: string;
  woNo: string;
  materials: {
    item: string;
    required: number;
    available: number;
    issued: number;
    batchNo: string;
    location: string;
    type: 'Raw' | 'Packaging';
  }[];
  issuedAt?: string;
  status: 'Pending' | 'Issued';
}

export interface QualityCheck {
  id: string;
  woId: string;
  woNo: string;
  productName: string;
  batchNo: string;
  inspectionType: string;
  checkedQty: number;
  checks: {
    // Packaging
    sealIntegrity: boolean;
    packagingDamage: boolean;
    tamperCheck: boolean;
    // Product
    weightAccuracy: boolean;
    quantityVerification: boolean;
    productAppearance: boolean;
    // Label
    barcodeReadability: boolean;
    labelPlacement: boolean;
    mrpVerification: boolean;
    manufacturingDate: boolean;
    expiryDate: boolean;
  };
  result: 'Pass' | 'Partial Pass' | 'Reject' | 'Rework' | 'Discard';
  severity?: 'Minor' | 'Major' | 'Critical';
  failureReason?: string;
  inspector: string;
  remarks: string;
  photoAttached?: boolean;
  photos?: string[];
  signature?: string;
  startTime?: string;
  completionTime?: string;
  date: string;
}

export interface FinishedGoods {
  id: string;
  woNo: string;
  productName: string;
  batchNo: string;
  postedQty: number;
  destination: 'Store' | 'Warehouse' | 'Vehicle' | 'Online Inventory' | 'POS';
  postedAt: string;
  costs: {
    rawMaterial: number;
    packaging: number;
    employee: number;
    electricity: number;
    machine: number;
    transportation: number;
    miscellaneous: number;
    total: number;
    costPerUnit: number;
    profitMargin: number;
  };
}

export interface RepackingRecord {
  id: string;
  sourceBatchNo: string;
  productName: string;
  repackRecipeId: string;
  repackType: string; // e.g. Damaged Pack -> New Pack, Large Pack -> Small Packs
  recoverableQuantity: number;
  wasteQuantity: number;
  newBatchNo: string;
  newLabelPrinted: boolean;
  createdAt: string;
}

interface AppContextType {
  recipes: RecipeConfig[];
  workOrders: WorkOrder[];
  materialIssues: MaterialIssue[];
  qualityChecks: QualityCheck[];
  finishedGoods: FinishedGoods[];
  repackings: RepackingRecord[];
  addRecipe: (recipe: RecipeConfig) => void;
  addWorkOrder: (wo: WorkOrder) => void;
  updateWorkOrderStatus: (woId: string, status: WorkOrder['status'], extra?: Partial<WorkOrder>) => void;
  addMaterialIssue: (issue: MaterialIssue) => void;
  issueMaterials: (issueId: string, updatedMaterials: MaterialIssue['materials']) => void;
  addQualityCheck: (qc: QualityCheck) => void;
  addFinishedGoods: (fg: FinishedGoods) => void;
  addRepacking: (rp: RepackingRecord) => void;
  deleteWorkOrder: (woId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_RECIPES: RecipeConfig[] = [];

const INITIAL_WORK_ORDERS: WorkOrder[] = [];

const INITIAL_MATERIAL_ISSUES: MaterialIssue[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<RecipeConfig[]>(INITIAL_RECIPES);

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);

  const [materialIssues, setMaterialIssues] = useState<MaterialIssue[]>(INITIAL_MATERIAL_ISSUES);

  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);

  const [finishedGoods, setFinishedGoods] = useState<FinishedGoods[]>([]);

  const [repackings, setRepackings] = useState<RepackingRecord[]>([]);



  useEffect(() => {
    const fetchApiData = async () => {
      try {
        const [woRes, qcRes, fgRes, rpRes] = await Promise.allSettled([
          workOrderService.getWorkOrders({ limit: 500 }),
          qualityCheckService.getQualityChecks({ limit: 500 }),
          apiClient.get('/workflows/finished-goods', { params: { limit: 500 } }),
          repackingService.getRepackingLogs({ limit: 500 }),
        ]);

        if (woRes.status === 'fulfilled' && woRes.value.data) {
          const apiWOs = woRes.value.data.map((wo: any) => ({
            id: wo.id,
            woNo: wo.woNumber,
            date: wo.createdAt ? new Date(wo.createdAt).toISOString().split('T')[0] : '',
            requestedBy: 'System',
            priority: wo.priority ? wo.priority.charAt(0) + wo.priority.slice(1).toLowerCase() : 'Medium',
            category: wo.product?.category?.name || 'Unknown',
            productName: wo.product?.name || '',
            recipeId: wo.recipeId || '',
            requiredQuantity: wo.requiredQty || 0,
            expectedCompletion: wo.expectedDate ? new Date(wo.expectedDate).toISOString().split('T')[0] : '',
            assignedTeam: 'Packing',
            supervisor: wo.operator?.name || wo.supervisor?.name || 'Unassigned',
            status: wo.status,
            progress: wo.actualProduced ? (wo.actualProduced / wo.requiredQty) * 100 : 0,
            actualProduced: wo.actualProduced || 0,
            batchNumber: wo.batchNumber || ''
          })) as WorkOrder[];
          
          setWorkOrders(prev => apiWOs.length > 0 ? apiWOs : prev);
        }

        if (qcRes.status === 'fulfilled' && qcRes.value.data) {
          const rawQCs = Array.isArray(qcRes.value.data) ? qcRes.value.data : (qcRes.value.data.data || []);
          const mappedQCs: QualityCheck[] = rawQCs.map((q: any) => ({
            id: q.id,
            woId: q.woId,
            woNo: q.workOrder?.woNumber || '—',
            productName: q.workOrder?.product?.name || '—',
            batchNo: q.workOrder?.batchNumber || '—',
            inspectionType: 'Standard',
            checkedQty: q.checkedQty || 0,
            checks: q.checksPayload || {},
            result: q.result === 'PASS' ? 'Pass' : q.result === 'PARTIAL_PASS' ? 'Partial Pass' : q.result === 'REWORK' ? 'Rework' : 'Reject',
            severity: q.severity ? (q.severity.charAt(0) + q.severity.slice(1).toLowerCase()) as any : undefined,
            failureReason: q.failureReason,
            inspector: q.inspector?.name || 'Inspector',
            remarks: q.remarks || '',
            date: q.createdAt ? new Date(q.createdAt).toISOString().split('T')[0] : '',
          }));
          setQualityChecks(mappedQCs);
        }

        if (fgRes.status === 'fulfilled' && fgRes.value.data) {
          const rawFGs = fgRes.value.data.data?.data || fgRes.value.data.data || [];
          const mappedFGs: FinishedGoods[] = (Array.isArray(rawFGs) ? rawFGs : []).map((f: any) => ({
            id: f.id,
            woNo: f.workOrder?.woNumber || f.fgNumber || '—',
            productName: f.product?.name || f.workOrder?.product?.name || '—',
            batchNo: f.batchNumber || f.workOrder?.batchNumber || '—',
            postedQty: f.postedQty || 0,
            destination: f.destination || 'Warehouse',
            postedAt: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '',
            costs: { rawMaterial: 0, packaging: 0, employee: 0, electricity: 0, machine: 0, transportation: 0, miscellaneous: 0, total: 0, costPerUnit: 0, profitMargin: 0 }
          }));
          setFinishedGoods(mappedFGs);
        }

        if (rpRes.status === 'fulfilled' && rpRes.value.data) {
          const rawRPs = Array.isArray(rpRes.value.data) ? rpRes.value.data : (rpRes.value.data.data || []);
          const mappedRPs: RepackingRecord[] = (Array.isArray(rawRPs) ? rawRPs : []).map((r: any) => ({
            id: r.id,
            sourceBatchNo: r.sourceWorkOrder?.batchNumber || '—',
            productName: r.sourceWorkOrder?.product?.name || '—',
            repackRecipeId: '',
            repackType: r.repackType || 'Standard Repack',
            recoverableQuantity: r.recoverableQty || 0,
            wasteQuantity: r.wasteQty || 0,
            newBatchNo: r.newBatchNumber || '—',
            newLabelPrinted: true,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
          }));
          setRepackings(mappedRPs);
        }
      } catch (err) {
        console.error('Failed to fetch API data in AppContext', err);
      }
    };
    fetchApiData();
    const interval = setInterval(fetchApiData, 5000);
    return () => clearInterval(interval);
  }, []);

  const addRecipe = (recipe: RecipeConfig) => {
    setRecipes((prev) => [recipe, ...prev]);
  };

  const addWorkOrder = (wo: WorkOrder) => {
    setWorkOrders((prev) => [wo, ...prev]);
    // Automatically create a pending material issue if approved or pending
    const recipe = recipes.find(r => r.id === wo.recipeId);
    if (recipe) {
      const issueMaterials = [
        ...recipe.bomItems.map(item => ({
          item: item.inputItem,
          required: (item.requiredQuantity / recipe.outputQuantity) * wo.requiredQuantity,
          available: Math.round(((item.requiredQuantity / recipe.outputQuantity) * wo.requiredQuantity) * (1.2 + Math.random())),
          issued: 0,
          batchNo: '',
          location: '',
          type: 'Raw' as const
        })),
        ...recipe.packagingMaterials.map(pkg => ({
          item: pkg.material,
          required: (pkg.quantity / recipe.outputQuantity) * wo.requiredQuantity,
          available: Math.round(((pkg.quantity / recipe.outputQuantity) * wo.requiredQuantity) * (1.5 + Math.random())),
          issued: 0,
          batchNo: '',
          location: '',
          type: 'Packaging' as const
        }))
      ];

      const newIssue: MaterialIssue = {
        id: `MI-${Date.now().toString().slice(-4)}`,
        woId: wo.id,
        woNo: wo.woNo,
        status: 'Pending',
        materials: issueMaterials
      };
      setMaterialIssues(prev => [newIssue, ...prev]);
    }
  };

  const updateWorkOrderStatus = (woId: string, status: WorkOrder['status'], extra?: Partial<WorkOrder>) => {
    setWorkOrders((prev) =>
      prev.map((wo) => (wo.id === woId ? { ...wo, status, ...extra } : wo))
    );
  };

  const addMaterialIssue = (issue: MaterialIssue) => {
    setMaterialIssues((prev) => [issue, ...prev]);
  };

  const issueMaterials = (issueId: string, updatedMaterials: MaterialIssue['materials']) => {
    setMaterialIssues((prev) =>
      prev.map((issue) => {
        if (issue.id === issueId) {
          // Update the corresponding Work Order status to "Material Issued"
          updateWorkOrderStatus(issue.woId, 'Material Issued');
          return {
            ...issue,
            materials: updatedMaterials,
            status: 'Issued' as const,
            issuedAt: new Date().toLocaleString()
          };
        }
        return issue;
      })
    );
  };

  const addQualityCheck = (qc: QualityCheck) => {
    setQualityChecks((prev) => [qc, ...prev]);
    if (qc.result === 'Pass' || qc.result === 'Partial Pass') {
      updateWorkOrderStatus(qc.woId, 'QC Passed');
    } else {
      updateWorkOrderStatus(qc.woId, 'QC Pending', { status: 'QC Pending' }); // flag for repacking or rework
    }
  };

  const addFinishedGoods = (fg: FinishedGoods) => {
    setFinishedGoods((prev) => [fg, ...prev]);
    // Find work order matching batch or woNo to mark complete
    const wo = workOrders.find(w => w.woNo === fg.woNo);
    if (wo) {
      updateWorkOrderStatus(wo.id, 'Completed');
    }
  };

  const addRepacking = (rp: RepackingRecord) => {
    setRepackings((prev) => [rp, ...prev]);
  };

  const deleteWorkOrder = (woId: string) => {
    setWorkOrders((prev) => prev.filter((wo) => wo.id !== woId));
    setMaterialIssues((prev) => prev.filter((mi) => mi.woId !== woId));
  };

  return (
    <AppContext.Provider
      value={{
        recipes,
        workOrders,
        materialIssues,
        qualityChecks,
        finishedGoods,
        repackings,
        addRecipe,
        addWorkOrder,
        updateWorkOrderStatus,
        addMaterialIssue,
        issueMaterials,
        addQualityCheck,
        addFinishedGoods,
        addRepacking,
        deleteWorkOrder
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
