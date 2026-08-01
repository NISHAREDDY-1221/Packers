import { workOrderService } from '../../../api/workOrderService';
import type { QCInspection } from '../../../shared/types';
import type { QcWoStatus } from '../../../shared/types';

export const qcTasksService = {
  async getWorkOrders(params?: Record<string, any>): Promise<{ data: QCInspection[]; total: number; page: number }> {
    return workOrderService.getWorkOrders({ limit: 500, ...params }) as unknown as Promise<{ data: QCInspection[]; total: number; page: number }>;
  },
  async updateWorkOrderStatus(id: string, status: QcWoStatus): Promise<QCInspection> {
    return workOrderService.updateWorkOrderStatus(id, status as any) as unknown as Promise<QCInspection>;
  },
  async getWorkOrderAuditLogs(id: string): Promise<any[]> {
    return workOrderService.getWorkOrderAuditLogs(id);
  }
};
