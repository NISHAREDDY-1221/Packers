const fs = require('fs');

const fix = (file, src, dst) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (src instanceof RegExp) {
      content = content.replace(src, dst);
    } else {
      content = content.split(src).join(dst);
    }
    fs.writeFileSync(file, content);
  }
};

fix('src/modules/packing-operator/layouts/OperatorLayout.tsx', 'import { NavItem }', 'import type { NavItem }');
fix('src/modules/qc-checker/layouts/QCLayout.tsx', 'import { NavItem }', 'import type { NavItem }');
fix('src/shared/components/BottomNavigation.tsx', 'import { NavItem }', 'import type { NavItem }');
fix('src/modules/packing-operator/pages/MyJobs.tsx', 'updatePackingJobStatus', 'updateWorkOrderStatus');
fix('src/modules/qc-checker/pages/ActiveQCInspection.tsx', 'updateQCInspectionStatus', 'updateWorkOrderStatus');
fix('src/modules/packing-operator/pages/PackingHistory.tsx', "import { workOrderService, type PackingJob } from '../../../api/workOrderService';", "import { packingJobsService } from '../services/packingJobsService';\nimport type { PackingJob } from '../../../shared/types';");
fix('src/modules/qc-checker/pages/QCHistory.tsx', "import { workOrderService, type QCInspection } from '../../../api/workOrderService';", "import { qcTasksService } from '../services/qcTasksService';\nimport type { QCInspection } from '../../../shared/types';");
fix('src/shared/components/Sidebar.tsx', "import { useAuth } from '../../../context/AuthContext';", "import { useAuth } from '../../context/AuthContext';");
fix('src/shared/components/StaffHeader.tsx', "import { useAuth } from '../../../context/AuthContext';", "import { useAuth } from '../../context/AuthContext';");
fix('src/shared/types/index.ts', "import { Product, Recipe } from '../../api/masterDataService';", "import type { Product, Recipe } from '../../api/masterDataService';");

console.log('Fixed additional TS errors');
