import api from '../api/axios';

export interface WorkOrder {
  id: string;
  woNumber: string;
  status: string;
  requiredQty: number;
  batchNumber?: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  recipe: {
    id: string;
    mrp: number;
    shelfLife: number;
  };
  supervisor: {
    id: string;
    name: string;
  };
}

export const workOrderService = {
  getWorkOrders: async (params?: any): Promise<WorkOrder[]> => {
    const response = await api.get('/work-orders', { params });
    // Handle the generic API response format { success: true, data: { workOrders: [...] } }
    // Note: Depends on backend implementation. Assuming standard response format:
    return response.data.data.workOrders || response.data.data;
  },
  
  updateStatus: async (id: string, status: string): Promise<any> => {
    const response = await api.patch(`/work-orders/${id}/status`, { status });
    return response.data.data;
  }
};
