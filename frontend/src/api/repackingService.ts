import apiClient from './axios';

export interface RepackingLog {
  id: string;
  rpNumber: string;
  sourceWoId: string;
  repackType: string;
  recoverableQty: number;
  wasteQty: number;
  newBatchNumber: string;
  targetRecipeId?: string;
  loggedById: string;
  createdAt: string;
  updatedAt: string;
  sourceWorkOrder?: {
    id: string;
    woNumber: string;
    batchNumber?: string;
    requiredQty: number;
    actualProduced?: number;
    priority: string;
    createdAt: string;
    product?: { id: string; name: string; sku?: string };
    supervisor?: { id: string; name: string };
    operator?: { id: string; name: string };
  };
  loggedBy?: { id: string; name: string; email: string };
}

export interface PendingRepackWorkOrder {
  id: string;
  woNumber: string;
  batchNumber?: string;
  requiredQty: number;
  actualProduced?: number;
  actualRejected?: number;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  product?: { id: string; name: string; sku?: string };
  supervisor?: { id: string; name: string };
  operator?: { id: string; name: string };
}

export interface RPListResponse {
  data: RepackingLog[];
  total: number;
  page: number;
}

export const repackingService = {
  /** Fetch completed Repacking records from backend */
  async getRepackingLogs(params?: Record<string, any>): Promise<RPListResponse> {
    try {
      const res = await apiClient.get<any>('/workflows/repacking', { params: { limit: 500, ...params } });
      const result = res.data.data;
      if (result && Array.isArray(result.data)) return result as RPListResponse;
      if (Array.isArray(result)) return { data: result, total: result.length, page: 1 };
      return { data: [], total: 0, page: 1 };
    } catch (e) {
      console.warn('Failed to fetch repacking logs:', e);
      return { data: [], total: 0, page: 1 };
    }
  },

  /** Fetch pending Work Orders for Repacking.
   *  Only WOs that have failed QC (or rework) should be repacked.
   */
  async getPendingRepackWorkOrders(): Promise<PendingRepackWorkOrder[]> {
    try {
      // 1. Fetch all work orders
      const woRes = await apiClient.get<any>('/work-orders', { params: { limit: 500 } });
      const woResult = woRes.data.data;
      let orders: PendingRepackWorkOrder[] = [];
      if (woResult && Array.isArray(woResult.data)) orders = woResult.data;
      else if (Array.isArray(woResult)) orders = woResult;

      // 2. Fetch all quality checks to find which ones failed
      const qcRes = await apiClient.get<any>('/workflows/quality-checks', { params: { limit: 500 } });
      const qcResult = qcRes.data.data;
      let qcs: any[] = [];
      if (qcResult && Array.isArray(qcResult.data)) qcs = qcResult.data;
      else if (Array.isArray(qcResult)) qcs = qcResult;

      // 3. Find woIds that have a Failed, Discard, or Rework QC
      const failedWoIds = new Set(
        qcs.filter(qc => ['REJECT', 'REWORK', 'DISCARD'].includes(qc.result)).map(qc => qc.woId)
      );

      // 4. Return only Work Orders that have a failed QC
      return orders.filter(wo => failedWoIds.has(wo.id));
    } catch (e) {
      console.error('Failed to fetch pending repack work orders', e);
      return [];
    }
  },

  /** Fetch all team members/users from backend for assignment */
  async getOperators(): Promise<{ id: string; name: string; email: string }[]> {
    try {
      const res = await apiClient.get<any>('/auth/users');
      const result = res.data.data;
      if (Array.isArray(result)) return result;
      return [];
    } catch {
      return [];
    }
  },

  /** Submit a Repacking Log */
  async logRepacking(data: {
    sourceWoId: string;
    repackType: string;
    recoverableQty: number;
    wasteQty: number;
    targetRecipeId?: string;
  }): Promise<any> {
    const res = await apiClient.post<any>('/workflows/repacking', data);
    return res.data.data;
  },
};
