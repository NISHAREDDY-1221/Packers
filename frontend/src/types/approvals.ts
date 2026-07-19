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

// Mock Data
export const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: 'APR-2023-001',
    type: 'WORK_ORDER',
    relatedEntityId: 'WO-2310-001',
    relatedEntityName: 'Work Order #WO-2310-001',
    requestedBy: 'John Doe',
    requestedDate: '2023-10-25T10:30:00Z',
    reason: 'Urgent customer request',
    priority: 'HIGH',
    status: 'PENDING',
    existingValues: { priority: 'Normal' },
    proposedValues: { priority: 'High' },
    remarks: 'Need approval to expedite.',
    history: [
      {
        action: 'Created',
        actionBy: 'John Doe',
        actionDate: '2023-10-25T10:30:00Z'
      }
    ]
  },
  {
    id: 'APR-2023-002',
    type: 'MATERIAL_ISSUE',
    relatedEntityId: 'MI-2310-045',
    relatedEntityName: 'Material Issue #MI-2310-045',
    requestedBy: 'Jane Smith',
    requestedDate: '2023-10-26T14:15:00Z',
    reason: 'Extra material needed due to spillage',
    priority: 'MEDIUM',
    status: 'PENDING',
    existingValues: { requestedQty: 500, issuedQty: 500 },
    proposedValues: { requestedQty: 550, issuedQty: 550 },
    history: [
      {
        action: 'Created',
        actionBy: 'Jane Smith',
        actionDate: '2023-10-26T14:15:00Z'
      }
    ]
  },
  {
    id: 'APR-2023-003',
    type: 'PACKING_VARIANCE',
    relatedEntityId: 'PE-2310-112',
    relatedEntityName: 'Packing Execution #PE-2310-112',
    requestedBy: 'Mike Johnson',
    requestedDate: '2023-10-26T16:45:00Z',
    reason: 'Yield was lower than expected',
    priority: 'LOW',
    status: 'APPROVED',
    history: [
      {
        action: 'Created',
        actionBy: 'Mike Johnson',
        actionDate: '2023-10-26T16:45:00Z'
      },
      {
        action: 'Approved',
        actionBy: 'Admin User',
        actionDate: '2023-10-27T09:00:00Z',
        comments: 'Variance within acceptable limits.'
      }
    ]
  }
];
