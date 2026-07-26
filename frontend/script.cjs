const fs = require('fs');
const path = require('path');

const replaceInDir = (dir, fromService, toService, fromType, toType) => {
  fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.tsx')) {
      const p = path.join(dir, file);
      let content = fs.readFileSync(p, 'utf8');
      
      // Replace service import
      content = content.replace(/import \{ workOrderService(?:, type WorkOrder )? \} from '.*?api\/workOrderService';/g, `import { ${toService} } from '../services/${toService}';\nimport type { ${toType} } from '../../../shared/types';`);
      content = content.replace(/import type \{ WorkOrder \} from '.*?api\/workOrderService';/g, `import type { ${toType} } from '../../../shared/types';`);
      
      // Replace service usages
      content = content.replace(/workOrderService\./g, `${toService}.`);
      
      // Replace type usages
      content = content.replace(/WorkOrder/g, toType);
      
      fs.writeFileSync(p, content);
      console.log('Processed ' + p);
    }
  });
};

replaceInDir('src/modules/packing-operator/pages', 'packingJobsService', 'packingJobsService', 'PackingJob', 'PackingJob');
replaceInDir('src/modules/qc-checker/pages', 'qcTasksService', 'qcTasksService', 'QCInspection', 'QCInspection');
