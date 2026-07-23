import apiClient from "./axios";
import type { Product, Recipe } from "./masterDataService";

export type WoStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "MATERIAL_ISSUED"
  | "PACKING_STARTED"
  | "QC_PENDING"
  | "QC_PASSED"
  | "COMPLETED"
  | "CANCELLED";

export type WoPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface WorkOrder {
  id: string;
  woNumber: string;
  productId: string;
  recipeId: string;
  status: WoStatus;
  priority: WoPriority;
  requiredQty: number;
  actualProduced?: number;
  actualRejected?: number;
  batchNumber?: string;
  supervisorId: string;
  expectedDate?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relational data
  product?: Product;
  recipe?: Recipe;
  supervisor?: { id: string; name: string };
}

export interface MaterialIssueRecord {
  id: string;
  issueNo: string;
  woId: string;
  issuedById: string;
  status: "PENDING" | "ISSUED";
  payload: any;
  createdAt: string;
  updatedAt: string;
}

export const workOrderService = {
  async getWorkOrders(
    params?: Record<string, any>,
  ): Promise<{ data: WorkOrder[]; total: number; page: number }> {
    const res = await apiClient.get<any>("/work-orders", { params });
    // Handle nested data structures correctly (based on backend sendResponse wrapping)
    const result = res.data.data;
    if (result && Array.isArray(result.data)) {
      return result as { data: WorkOrder[]; total: number; page: number };
    }
    // Fallback if structure is just array
    if (Array.isArray(result)) {
      return { data: result, total: result.length, page: 1 };
    }
    return { data: [], total: 0, page: 1 };
  },

  async createWorkOrder(data: {
    productId: string;
    recipeId: string;
    requiredQty: number;
    priority: WoPriority;
    expectedDate?: string;
    supervisorId?: string;
  }): Promise<WorkOrder> {
    const res = await apiClient.post<{ success: boolean; data: WorkOrder }>(
      "/work-orders",
      data,
    );
    return res.data.data;
  },

  async updateWorkOrderStatus(
    id: string,
    status: WoStatus,
  ): Promise<WorkOrder> {
    const res = await apiClient.patch<{ success: boolean; data: WorkOrder }>(
      `/work-orders/${id}/status`,
      { status },
    );
    return res.data.data;
  },

  async issueMaterials(
    id: string,
    payload: any,
  ): Promise<{ issue: MaterialIssueRecord; updatedWO: WorkOrder }> {
    const res = await apiClient.post<{
      success: boolean;
      data: { issue: MaterialIssueRecord; updatedWO: WorkOrder };
    }>(`/work-orders/${id}/issue-materials`, { payload });
    return res.data.data;
  },

  async startPacking(id: string): Promise<WorkOrder> {
    const res = await apiClient.post<{ success: boolean; data: WorkOrder }>(
      `/work-orders/${id}/start-packing`,
    );
    return res.data.data;
  },

  async completePacking(
    id: string,
    actualProduced: number,
    actualRejected: number,
  ): Promise<WorkOrder> {
    const res = await apiClient.post<{ success: boolean; data: WorkOrder }>(
      `/work-orders/${id}/complete-packing`,
      { actualProduced, actualRejected },
    );
    return res.data.data;
  },
};
