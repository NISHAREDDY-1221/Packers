const fs = require('fs');
let code = fs.readFileSync('c:/Users/Dell/packer-module/Packers/frontend/src/pages/BarcodesLabels.tsx', 'utf8');

const regex = /<div className="w-full h-10 bg-slate-900 dark:bg-gray-800 flex gap-0\.5 px-3 py-1 items-stretch rounded-xs">[\s\S]*?<\/div>/;
const canvasJSX = '<canvas\n                      ref={previewCanvasRef}\n                      className="w-full h-12 bg-white p-1 border rounded-xs"\n                    />';
code = code.replace(regex, canvasJSX);

const qrRegex = /<QrCode size=\{48\} className="text-slate-900 dark:text-gray-200 border border-slate-200 dark:border-gray-750 p-1 bg-white rounded" \/>/;
const qrJSX = '<img\n                      src={qrCodeUrl}\n                      className="w-16 h-16 border p-1 bg-white rounded"\n                      alt="QR Code"\n                    />';
code = code.replace(qrRegex, qrJSX);

const qrRegex2 = /<QrCode size=\{30\} className="text-slate-900 dark:text-gray-200 border border-slate-200 dark:border-gray-750 p-0\.5 bg-white rounded" \/>/;
const qrJSX2 = '<img\n                      src={qrCodeUrl}\n                      className="w-10 h-10 border p-0.5 bg-white rounded"\n                      alt="QR Code"\n                    />';
code = code.replace(qrRegex2, qrJSX2);

fs.writeFileSync('c:/Users/Dell/packer-module/Packers/frontend/src/pages/BarcodesLabels.tsx', code);
console.log('JSX Patched');
