const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const fixFile = (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix context imports
    content = content.replace(/from '\.\.\/(\.\.\/)?context\//g, "from '../../../context/");
    // Fix api imports
    content = content.replace(/from '\.\.\/(\.\.\/)?api\//g, "from '../../../api/");
    // Fix components imports
    content = content.replace(/from '\.\.\/(\.\.\/)?components\//g, "from '../../../components/");
    
    // Fix Duplicate identifier QCInspection
    content = content.replace(/import type \{ QCInspection \} from '\.\.\/\.\.\/\.\.\/shared\/types';\r?\nimport type \{ QCInspection \} from '\.\.\/\.\.\/\.\.\/shared\/types';/g, "import type { QCInspection } from '../../../shared/types';");
    content = content.replace(/import type \{ PackingJob \} from '\.\.\/\.\.\/\.\.\/shared\/types';\r?\nimport type \{ PackingJob \} from '\.\.\/\.\.\/\.\.\/shared\/types';/g, "import type { PackingJob } from '../../../shared/types';");
    
    // Fallback for duplicates
    content = content.replace(/import \{ QCInspection \} from '\.\.\/\.\.\/\.\.\/shared\/types';\r?\nimport type \{ QCInspection \} from '\.\.\/\.\.\/\.\.\/shared\/types';/g, "import type { QCInspection } from '../../../shared/types';");
    content = content.replace(/import \{ PackingJob \} from '\.\.\/\.\.\/\.\.\/shared\/types';\r?\nimport type \{ PackingJob \} from '\.\.\/\.\.\/\.\.\/shared\/types';/g, "import type { PackingJob } from '../../../shared/types';");
    
    content = content.replace(/(import type \{ [A-Za-z]+ \} from '\.\.\/\.\.\/\.\.\/shared\/types';)\r?\n\1/g, "$1");

    // Fix getQCInspections and getPackingJobs
    content = content.replace(/\.getQCInspections/g, ".getWorkOrders");
    content = content.replace(/\.getPackingJobs/g, ".getWorkOrders");
    
    // Fix startDate
    content = content.replace(/task\.startDate/g, "task.startedAt || task.createdAt");
    
    // Fix implicit any
    content = content.replace(/\(a, b\) => new Date\(b/g, "(a: any, b: any) => new Date(b");
    content = content.replace(/wo =>/g, "(wo: any) =>");
    content = content.replace(/res =>/g, "(res: any) =>");
    content = content.replace(/o =>/g, "(o: any) =>");

    // Fix verbatimModuleSyntax imports
    content = content.replace(/import \{ NavItem \}/g, "import type { NavItem }");
    content = content.replace(/import \{ Product, Recipe \}/g, "import type { Product, Recipe }");
    
    fs.writeFileSync(filePath, content);
  }
};

walkDir('src/modules', fixFile);
walkDir('src/shared', fixFile);
console.log('Fixed imports and types');
