import api from '../api/axios';

export interface PrintJob {
  id: string;
  woNo: string;
  sku: string;
  batchNo: string;
  printedQty: number;
  printedBy: string;
  status: 'Printed' | 'Reprinted';
  timestamp: string;
  reprintReason?: string;
}

export const barcodeService = {
  getPrintHistory: async (): Promise<PrintJob[]> => {
    const response = await api.get('/barcodes/history');
    return response.data.data;
  },

  printLabels: async (
    workOrderId: string,
    batchNumber: string,
    barcodeType: string,
    printedQty: number
  ): Promise<PrintJob> => {
    const response = await api.post('/barcodes/print', {
      workOrderId,
      batchNumber,
      barcodeType,
      printedQty,
    });
    return response.data.data;
  },

  reprintLabels: async (
    jobId: string,
    reprintReason?: string
  ): Promise<{ job?: PrintJob; requiresApproval: boolean; message: string }> => {
    const response = await api.post('/barcodes/reprint', { jobId, reprintReason });
    return {
      job: response.data.data,
      requiresApproval: response.data.requiresApproval,
      message: response.data.message,
    };
  },
};
