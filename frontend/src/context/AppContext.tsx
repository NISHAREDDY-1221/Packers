import React, { createContext, useContext, useState, useEffect } from "react";
import { workOrderService } from "../api/workOrderService";
import { workflowService } from "../api/workflowService";

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
  priority: "Low" | "Medium" | "High" | "Urgent";
  category: string;
  productName: string;
  recipeId: string;
  requiredQuantity: number;
  expectedCompletion: string;
  assignedTeam: string;
  supervisor: string;
  status:
    | "Draft"
    | "Pending"
    | "Approved"
    | "Material Issued"
    | "Packing Started"
    | "QC Pending"
    | "QC Passed"
    | "Completed"
    | "Cancelled"
    | "Labels Printed";
  progress?: number;
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
    type: "Raw" | "Packaging";
  }[];
  issuedAt?: string;
  status: "Pending" | "Issued";
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
  result: "Pass" | "Partial Pass" | "Reject" | "Rework" | "Discard";
  severity?: "Minor" | "Major" | "Critical";
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
  destination: "Store" | "Warehouse" | "Vehicle" | "Online Inventory" | "POS";
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
  updateWorkOrderStatus: (
    woId: string,
    status: WorkOrder["status"],
    extra?: Partial<WorkOrder>,
  ) => void;
  addMaterialIssue: (issue: MaterialIssue) => void;
  issueMaterials: (
    issueId: string,
    updatedMaterials: MaterialIssue["materials"],
  ) => void;
  addQualityCheck: (qc: QualityCheck) => Promise<void>;
  addFinishedGoods: (fg: FinishedGoods) => Promise<void>;
  addRepacking: (rp: RepackingRecord) => Promise<void>;
  deleteWorkOrder: (woId: string) => void;
  refreshGlobalData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_RECIPES: RecipeConfig[] = [];

const INITIAL_WORK_ORDERS: WorkOrder[] = [];

const INITIAL_MATERIAL_ISSUES: MaterialIssue[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const refreshGlobalData = async () => {
    try {
      const res = await workOrderService.getWorkOrders();
      if (res && Array.isArray(res.data)) {
        const statusMap: Record<string, WorkOrder["status"]> = {
          DRAFT: "Draft",
          PENDING: "Pending",
          APPROVED: "Approved",
          MATERIAL_ISSUED: "Material Issued",
          PACKING_STARTED: "Packing Started",
          QC_PENDING: "QC Pending",
          QC_PASSED: "QC Passed",
          COMPLETED: "Completed",
          CANCELLED: "Cancelled",
          LABELS_PRINTED: "Labels Printed",
        };
        const mappedData = res.data.map((wo: any) => ({
          ...wo,
          woNo: wo.woNumber || wo.woNo,
          requiredQuantity: wo.requiredQty || wo.requiredQuantity,
          productName: wo.product?.name || wo.productName || "Unknown Product",
          assignedTeam: wo.supervisor?.name
            ? `Team ${wo.supervisor.name}`
            : "Packing Team Alpha",
          supervisor: wo.supervisor?.name || wo.supervisorId,
          status: statusMap[wo.status] || wo.status,
          date: wo.createdAt
            ? new Date(wo.createdAt).toISOString().split("T")[0]
            : wo.date || "",
          expectedCompletion: wo.expectedDate
            ? new Date(wo.expectedDate).toISOString().split("T")[0]
            : wo.expectedCompletion || "",
        }));
        setWorkOrders((prev) => {
          return (mappedData as WorkOrder[]).map((newWo) => {
            const existing = prev.find((p) => p.id === newWo.id);
            // If the UI has advanced the status to 'Labels Printed', preserve it locally!
            if (
              existing &&
              existing.status === "Labels Printed" &&
              newWo.status === "Completed"
            ) {
              return { ...newWo, status: "Labels Printed" };
            }
            return newWo;
          });
        });
      }

      const qcRes = await workflowService.getQualityChecks();
      if (qcRes && Array.isArray(qcRes.data)) {
        const resultFormatter = (resStr: string) => {
          if (!resStr) return "";
          if (resStr === "PARTIAL_PASS") return "Partial Pass";
          return resStr.charAt(0).toUpperCase() + resStr.slice(1).toLowerCase();
        };
        const severityFormatter = (sevStr: string) => {
          if (!sevStr) return undefined;
          return sevStr.charAt(0).toUpperCase() + sevStr.slice(1).toLowerCase();
        };

        const mappedQCs = qcRes.data.map((qc: any) => ({
          id: qc.id,
          woId: qc.woId,
          woNo: qc.workOrder?.woNumber || qc.woNo || "",
          productName: qc.workOrder?.product?.name || "Unknown Product",
          batchNo: qc.workOrder?.batchNumber || "",
          inspectionType: "Sampling Inspection",
          checkedQty: qc.checkedQty,
          checks: qc.checksPayload || {},
          result: resultFormatter(qc.result),
          severity: severityFormatter(qc.severity),
          failureReason: qc.failureReason,
          inspector: qc.inspector?.name || "Inspector",
          remarks: qc.remarks || "",
          photoAttached: false,
          date: qc.createdAt
            ? new Date(qc.createdAt).toISOString().split("T")[0]
            : "",
        }));
        setQualityChecks(mappedQCs as QualityCheck[]);
      }

      const fgRes = await workflowService.getFinishedGoods();
      if (fgRes && Array.isArray(fgRes.data)) {
        const mappedFGs = fgRes.data.map((fg: any) => ({
          id: fg.id,
          woNo: fg.workOrder?.woNumber || "",
          productName: fg.workOrder?.product?.name || "",
          batchNo: fg.batchNumber,
          postedQty: fg.postedQty,
          destination: fg.destination,
          date: fg.createdAt
            ? new Date(fg.createdAt).toISOString().split("T")[0]
            : "",
        }));
        setFinishedGoods(mappedFGs as FinishedGoods[]);
      }

      const rpRes = await workflowService.getRepacking();
      if (rpRes && Array.isArray(rpRes.data)) {
        const mappedRPs = rpRes.data.map((rp: any) => ({
          id: rp.id,
          sourceBatchNo: rp.sourceWo?.batchNumber || "",
          sourceProduct: rp.sourceWo?.product?.name || "Unknown",
          repackType: rp.repackType || "Salvage",
          recoverableQuantity: rp.recoverableQty,
          wasteQuantity: rp.wasteQty,
          repackRecipeId: rp.targetRecipeId || "",
          date: rp.createdAt
            ? new Date(rp.createdAt).toISOString().split("T")[0]
            : "",
        }));
        setRepackings(mappedRPs as RepackingRecord[]);
      }
    } catch (err) {
      console.error("Failed to fetch data in global context", err);
    }
  };

  // Fetch initial data from backend and set up polling for real-time sync across portals
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // Don't fetch data if not logged in

    refreshGlobalData();
    const interval = setInterval(() => {
      refreshGlobalData();
    }, 5000); // 5 seconds polling
    return () => clearInterval(interval);
  }, []);

  const [recipes, setRecipes] = useState<RecipeConfig[]>(INITIAL_RECIPES);

  const [workOrders, setWorkOrders] =
    useState<WorkOrder[]>(INITIAL_WORK_ORDERS);

  const [materialIssues, setMaterialIssues] = useState<MaterialIssue[]>(
    INITIAL_MATERIAL_ISSUES,
  );

  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([]);

  const [finishedGoods, setFinishedGoods] = useState<FinishedGoods[]>([]);
  const [repackings, setRepackings] = useState<RepackingRecord[]>([]);

  const incrementBarcodeCount = (by: number) => {
    setBarcodeCount((prev) => prev + by);
  };

  const addRecipe = (recipe: RecipeConfig) => {
    setRecipes((prev) => [recipe, ...prev]);
  };

  const addWorkOrder = (wo: WorkOrder) => {
    setWorkOrders((prev) => [wo, ...prev]);
    // Automatically create a pending material issue if approved or pending
    const recipe = recipes.find((r) => r.id === wo.recipeId);
    if (recipe) {
      const issueMaterials = [
        ...recipe.bomItems.map((item) => ({
          item: item.inputItem,
          required:
            (item.requiredQuantity / recipe.outputQuantity) *
            wo.requiredQuantity,
          available: Math.round(
            (item.requiredQuantity / recipe.outputQuantity) *
              wo.requiredQuantity *
              (1.2 + Math.random()),
          ),
          issued: 0,
          batchNo: "",
          location: "",
          type: "Raw" as const,
        })),
        ...recipe.packagingMaterials.map((pkg) => ({
          item: pkg.material,
          required:
            (pkg.quantity / recipe.outputQuantity) * wo.requiredQuantity,
          available: Math.round(
            (pkg.quantity / recipe.outputQuantity) *
              wo.requiredQuantity *
              (1.5 + Math.random()),
          ),
          issued: 0,
          batchNo: "",
          location: "",
          type: "Packaging" as const,
        })),
      ];

      const newIssue: MaterialIssue = {
        id: `MI-${Date.now().toString().slice(-4)}`,
        woId: wo.id,
        woNo: wo.woNo,
        status: "Pending",
        materials: issueMaterials,
      };
      setMaterialIssues((prev) => [newIssue, ...prev]);
    }
  };

  const updateWorkOrderStatus = (
    woId: string,
    status: WorkOrder["status"],
    extra?: Partial<WorkOrder>,
  ) => {
    setWorkOrders((prev) =>
      prev.map((wo) => (wo.id === woId ? { ...wo, status, ...extra } : wo)),
    );
  };

  const addMaterialIssue = (issue: MaterialIssue) => {
    setMaterialIssues((prev) => [issue, ...prev]);
  };

  const issueMaterials = (
    issueId: string,
    updatedMaterials: MaterialIssue["materials"],
  ) => {
    setMaterialIssues((prev) =>
      prev.map((issue) => {
        if (issue.id === issueId) {
          // Update the corresponding Work Order status to "Material Issued"
          updateWorkOrderStatus(issue.woId, "Material Issued");
          return {
            ...issue,
            materials: updatedMaterials,
            status: "Issued" as const,
            issuedAt: new Date().toLocaleString(),
          };
        }
        return issue;
      }),
    );
  };

  const addQualityCheck = async (qc: QualityCheck) => {
    try {
      await workflowService.submitQualityCheck({
        woId: qc.woId,
        checkedQty: qc.checkedQty,
        result: qc.result.toUpperCase().replace(" ", "_"),
        severity: qc.severity ? qc.severity.toUpperCase() : undefined,
        failureReason: qc.failureReason,
        remarks: qc.remarks,
        checksPayload: qc.checks,
      });
      // Optimistic update
      setQualityChecks((prev) => [qc, ...prev]);
      if (qc.result === "Pass" || qc.result === "Partial Pass") {
        updateWorkOrderStatus(qc.woId, "QC Passed");
      } else {
        updateWorkOrderStatus(qc.woId, "QC Pending", { status: "QC Pending" }); // flag for repacking or rework
      }
    } catch (err: any) {
      console.error("Failed to submit QC", err.response?.data || err);
      alert(
        "Failed to submit QC: " +
          JSON.stringify(err.response?.data?.message || err.message),
      );
    }
  };

  const addFinishedGoods = async (fg: FinishedGoods) => {
    try {
      await workflowService.postFinishedGoods({
        woId: workOrders.find((w) => w.woNo === fg.woNo)?.id || "",
        batchNumber: fg.batchNo,
        postedQty: fg.postedQty,
        destination: fg.destination,
      });
      setFinishedGoods((prev) => [fg, ...prev]);
      const wo = workOrders.find((w) => w.woNo === fg.woNo);
      if (wo) {
        updateWorkOrderStatus(wo.id, "Completed");
      }
    } catch (err) {
      console.error("Failed to post finished goods", err);
    }
  };

  const addRepacking = async (rp: RepackingRecord) => {
    try {
      await workflowService.logRepacking({
        sourceWoId:
          workOrders.find((w) => w.batchNumber === rp.sourceBatchNo)?.id || "",
        targetRecipeId: rp.repackRecipeId,
        repackType: rp.repackType,
        recoverableQty: rp.recoverableQuantity,
        wasteQty: rp.wasteQuantity,
      });
      setRepackings((prev) => [rp, ...prev]);
    } catch (err) {
      console.error("Failed to log repacking", err);
    }
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
        deleteWorkOrder,
        incrementBarcodeCount,
        refreshGlobalData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
