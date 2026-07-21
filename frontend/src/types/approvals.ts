export type ApprovalType = 
  | 'WORK_ORDER'
  | 'MATERIAL_ISSUE'
  | 'PACKING_VARIANCE'
  | 'QC_REWORK'
  | 'REPACKING'
  | 'BARCODE_REPRINT'
  | 'FINISHED_GOODS'
  | 'WASTAGE_SCRAP';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  relatedEntityId: string;
  relatedEntityName: string;
  requestedBy: string;
  requestedDate: string;
  reason: string;
  priority: Priority;
  status: ApprovalStatus;
  
  // Context details
  existingValues?: Record<string, any>;
  proposedValues?: Record<string, any>;
  remarks?: string;
  attachments?: string[];
  
  // History
  history: ApprovalHistory[];
}

export interface ApprovalHistory {
  action: string;
  actionBy: string;
  actionDate: string;
  comments?: string;
}

