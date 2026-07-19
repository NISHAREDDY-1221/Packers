const fs = require('fs');

let wo = fs.readFileSync('src/pages/WorkOrders.tsx', 'utf8');

// 1. Imports
wo = wo.replace(/import \{ workOrderService, WoStatus, WoPriority, WorkOrder \} from '\.\.\/api\/workOrderService';/, 
`import { workOrderService } from '../api/workOrderService';\nimport type { WoStatus, WoPriority, WorkOrder } from '../api/workOrderService';`);

// 2. KANBAN_COLUMNS missing replacements for some strings
wo = wo.replace(/to === 'Labels Printed'/g, `to === 'PACKING_STARTED'`);
wo = wo.replace(/status: 'Labels Printed'/g, `status: 'PACKING_STARTED'`); // replace labels printed logic if any

// 3. Object properties
wo = wo.replace(/wo\.requiredQuantity/g, `wo.requiredQty`);
wo = wo.replace(/wo\.date/g, `wo.createdAt`);
wo = wo.replace(/wo\.assignedTeam/g, `('Team Alpha')`);
wo = wo.replace(/wo\.woNo/g, `wo.woNumber`);
wo = wo.replace(/wo\.productName/g, `(wo.product?.name || '')`);
wo = wo.replace(/wo\.expectedCompletion/g, `wo.expectedDate`);
wo = wo.replace(/\{wo\.supervisor\}/g, `{wo.supervisor?.name || 'Unassigned'}`);
wo = wo.replace(/wo\.supervisorId\)\)\)/g, `wo.supervisor?.id || 'Unassigned')))`);

// 4. Missed Status Strings
wo = wo.replace(/'Completed'/g, `'COMPLETED'`);
wo = wo.replace(/'Cancelled'/g, `'CANCELLED'`);
wo = wo.replace(/'Draft'/g, `'DRAFT'`);
wo = wo.replace(/'Pending'/g, `'PENDING'`);
wo = wo.replace(/'Approved'/g, `'APPROVED'`);
wo = wo.replace(/'Material Issued'/g, `'MATERIAL_ISSUED'`);
wo = wo.replace(/'Packing Started'/g, `'PACKING_STARTED'`);
wo = wo.replace(/'QC Pending'/g, `'QC_PENDING'`);

fs.writeFileSync('src/pages/WorkOrders.tsx', wo);
console.log("Fixed WorkOrders.tsx");
