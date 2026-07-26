
const fs = require('fs');
const path = require('path');
const files = [
  'src/pages/staff/AssignedTasks.tsx',
  'src/pages/staff/TaskExecution.tsx'
];
const replacements = [
  { pattern: /\bbg-white\b(?! dark:bg-gray-800)/g, replace: 'bg-white dark:bg-gray-800' },
  { pattern: /\bbg-slate-50\b(?! dark:bg-gray-900)/g, replace: 'bg-slate-50 dark:bg-gray-900' },
  { pattern: /\btext-gray-800\b(?! dark:text-gray-100)/g, replace: 'text-gray-800 dark:text-gray-100' },
  { pattern: /\btext-gray-700\b(?! dark:text-gray-200)/g, replace: 'text-gray-700 dark:text-gray-200' },
  { pattern: /\btext-gray-600\b(?! dark:text-gray-300)/g, replace: 'text-gray-600 dark:text-gray-300' },
  { pattern: /\btext-gray-500\b(?! dark:text-gray-400)/g, replace: 'text-gray-500 dark:text-gray-400' },
  { pattern: /\bborder-gray-100\b(?! dark:border-gray-700)/g, replace: 'border-gray-100 dark:border-gray-700' },
  { pattern: /\bborder-gray-200\b(?! dark:border-gray-700)/g, replace: 'border-gray-200 dark:border-gray-700' },
  { pattern: /\bborder-slate-100\b(?! dark:border-gray-700)/g, replace: 'border-slate-100 dark:border-gray-700' },
  { pattern: /\bborder-slate-200\b(?! dark:border-gray-700)/g, replace: 'border-slate-200 dark:border-gray-700' }
];

for(const file of files){
  const fp = path.join(process.cwd(), file);
  if(fs.existsSync(fp)){
    let c = fs.readFileSync(fp, 'utf8');
    for(const {pattern, replace} of replacements){
      c = c.replace(pattern, replace);
    }
    fs.writeFileSync(fp, c, 'utf8');
    console.log('Updated', file);
  }
}

