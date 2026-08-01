import type { Product, Recipe } from '../../api/masterDataService';

export type WoPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Base properties shared between Operator and QC
interface BaseJob {
  id: string;
  woNumber: string;
  productId: string;
  priority: WoPriority;
  requiredQty: number;
  actualProduced?: number;
  batchNumber?: string;
  expectedDate?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  product?: Product;
}

export type OperatorWoStatus = 
  | 'DRAFT'
  | 'PENDING'
  | 'MATERIAL_ISSUED'
  | 'PACKING_STARTED'
  | 'PACKING_IN_PROGRESS'
  | 'PACKING_COMPLETED'
  | 'LABEL_APPLICATION_ASSIGNED'
  | 'LABEL_APPLICATION_IN_PROGRESS'
  | 'LABELS_APPLIED'
  | 'QC_PENDING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface PackingJob extends BaseJob {
  status: OperatorWoStatus;
  recipeId: string;
  actualRejected?: number;
  supervisorId: string;
  isPaused?: boolean;
  pauseReason?: string;
  recipe?: Recipe;
  supervisor?: { id: string; name: string };
}

export type QcWoStatus = 
  | 'QC_PENDING'
  | 'QC_PASSED'
  | 'PACKING_STARTED'; // Used when rework/rejected sends it back

export interface QCInspection extends BaseJob {
  status: QcWoStatus;
}
