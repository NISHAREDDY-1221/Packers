import React, { createContext, useContext, useState } from 'react';

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
  status: 'Draft' | 'Pending' | 'Approved' | 'Material Issued' | 'Packing Started' | 'QC Pending' | 'QC Passed' | 'Completed' | 'Cancelled' | 'Labels Printed' | 'QC Printed';
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string;
  actualProduced?: number;
  actualRejected?: number;
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
