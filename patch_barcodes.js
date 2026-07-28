const fs = require('fs');
let code = fs.readFileSync('c:/Users/Dell/packer-module/Packers/frontend/src/pages/BarcodesLabels.tsx', 'utf8');
const drawCode = fs.readFileSync('c:/Users/Dell/packer-module/Packers/inject_code.ts', 'utf8');
const printCode = fs.readFileSync('c:/Users/Dell/packer-module/Packers/inject_print.ts', 'utf8');

code = code.replace('export const BarcodesLabels: React.FC = () => {', drawCode + '\nexport const BarcodesLabels: React.FC = () => {\n  const previewCanvasRef = React.useRef<HTMLCanvasElement | null>(null);\n');

code = code.replace('const [validationError, setValidationError] = useState<string>("");', 'const [validationError, setValidationError] = useState<string>("");\n\n  useEffect(() => {\n    if (previewCanvasRef.current && barcodeType !== "QR Code") {\n      drawBarcode128(previewCanvasRef.current, batchNo || "9031123456789");\n    }\n  }, [barcodeType, batchNo, selectedWO]);\n\n' + printCode + '\n');

fs.writeFileSync('c:/Users/Dell/packer-module/Packers/frontend/src/pages/BarcodesLabels.tsx', code);
console.log('Patched');
