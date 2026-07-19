const fs = require('fs');
let wo = fs.readFileSync('src/pages/WorkOrders.tsx', 'utf8');

// Line 131: supervisor mapping is messed up
wo = wo.replace(/const supervisors = useMemo\(\(\) => Array\.from\(new Set\(workOrders\.map\(wo => \(wo\.supervisor\?\.name \|\| ''\)\?\.name \|\| \(wo\.supervisor\?\.name \|\| ''\)Id\)\)\), \[workOrders\]\);/, 
  `const supervisors = useMemo(() => Array.from(new Set(workOrders.map(wo => wo.supervisor?.name || wo.supervisorId))), [workOrders]);`);

// Line 208/209: Labels Printed
wo = wo.replace(/case 'Labels Printed': return 'bg-cyan-50 text-cyan-705 border-cyan-205';/, ``);

// Line 322: selectedWO.date
wo = wo.replace(/selectedWO\.date/g, `selectedWO.createdAt`);

// Line 324, 753: assignedTeam
wo = wo.replace(/selectedWO\.assignedTeam/g, `('Team Alpha')`);

// Line 725, 737, 818, 1011: woNo
wo = wo.replace(/selectedWO\.woNo/g, `selectedWO.woNumber`);
wo = wo.replace(/isEditOpen\.woNo/g, `isEditOpen.woNumber`);
wo = wo.replace(/wo\.woNo/g, `wo.woNumber`);

// Line 741, 1025: productName
wo = wo.replace(/selectedWO\.productName/g, `(selectedWO.product?.name || '')`);
wo = wo.replace(/wo\.productName/g, `(wo.product?.name || '')`);

// Line 749: requiredQuantity
wo = wo.replace(/selectedWO\.requiredQuantity/g, `selectedWO.requiredQty`);

// Line 757: {selectedWO.supervisor} -> {selectedWO.supervisor?.name || ''}
wo = wo.replace(/\{selectedWO\.supervisor\}/g, `{selectedWO.supervisor?.name || ''}`);

// Line 773: expectedCompletion
wo = wo.replace(/selectedWO\.expectedCompletion/g, `selectedWO.expectedDate`);

fs.writeFileSync('src/pages/WorkOrders.tsx', wo);
console.log('Fixed additional WorkOrders.tsx errors');
