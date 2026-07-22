import apiClient from './axios';

export interface QualityCheckPayload {
  woId: string;
  checkedQty: number;
  result: string;
  severity?: string;
  failureReason?: string;
  remarks?: string;
  checksPayload: any;
}

export interface FinishedGoodsPayload {
  woId: string;
  batchNumber: string;
  postedQty: number;
  destination: string;
}

export interface RepackingPayload {
  sourceWoId: string;
  targetRecipeId: string;
  repackType?: string;
  recoverableQty: number;
  wasteQty: number;
}

export const workflowService = {
  async getQualityChecks(params?: Record<string, any>) {
    const res = await apiClient.get<any>('/workflows/quality-checks', { params });
    const result = res.data.data;
    if (result && Array.isArray(result.data)) {
      return result;
    }
    if (Array.isArray(result)) {
      return { data: result, total: result.length, page: 1 };
    }
    return { data: [], total: 0, page: 1 };
  },

  async submitQualityCheck(payload: QualityCheckPayload) {
    const res = await apiClient.post<any>('/workflows/quality-checks', payload);
    return res.data.data;
  },

  async getFinishedGoods(params?: Record<string, any>) {
    const res = await apiClient.get<any>('/workflows/finished-goods', { params });
    const result = res.data.data;
    if (result && Array.isArray(result.data)) return result;
    if (Array.isArray(result)) return { data: result, total: result.length, page: 1 };
    return { data: [], total: 0, page: 1 };
  },

  async postFinishedGoods(payload: FinishedGoodsPayload) {
    const res = await apiClient.post<any>('/workflows/finished-goods', payload);
    return res.data.data;
  },

  async logRepacking(payload: RepackingPayload) {
    const res = await apiClient.post<any>('/workflows/repacking', payload);
    return res.data.data;
  },

  async getRepacking(params?: Record<string, any>) {
    const res = await apiClient.get<any>('/workflows/repacking', { params });
    const result = res.data.data;
    if (result && Array.isArray(result.data)) return result;
    if (Array.isArray(result)) return { data: result, total: result.length, page: 1 };
    return { data: [], total: 0, page: 1 };
  }
};
