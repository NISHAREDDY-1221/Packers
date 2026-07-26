import { workOrderService } from '../../../api/workOrderService';
import type { PackingJob } from '../../../shared/types';
import type { OperatorWoStatus } from '../../../shared/types';

export const packingJobsService = {
  async getWorkOrders(params?: Record<string, any>): Promise<{ data: PackingJob[]; total: number; page: number }> {
    return workOrderService.getWorkOrders(params) as unknown as Promise<{ data: PackingJob[]; total: number; page: number }>;
  },
  async updateWorkOrderStatus(id: string, status: OperatorWoStatus): Promise<PackingJob> {
    return workOrderService.updateWorkOrderStatus(id, status as any) as unknown as Promise<PackingJob>;
  },
  async issueMaterials(id: string, payload: any): Promise<any> {
    return workOrderService.issueMaterials(id, payload);
  },
  async startPacking(id: string): Promise<PackingJob> {
    return workOrderService.startPacking(id) as unknown as Promise<PackingJob>;
  },
  async updateQuantity(id: string, data: { actualProduced?: number; actualRejected?: number }): Promise<PackingJob> {
    return workOrderService.updateQuantity(id, data) as unknown as Promise<PackingJob>;
  },
  async pausePacking(id: string, reason: string): Promise<PackingJob> {
    return workOrderService.pausePacking(id, reason) as unknown as Promise<PackingJob>;
  },
  async resumePacking(id: string): Promise<PackingJob> {
    return workOrderService.resumePacking(id) as unknown as Promise<PackingJob>;
  },
  async completePacking(id: string): Promise<PackingJob> {
    return workOrderService.completePacking(id) as unknown as Promise<PackingJob>;
  },
  async getWorkOrderAuditLogs(id: string): Promise<any[]> {
    return workOrderService.getWorkOrderAuditLogs(id);
  }
};
