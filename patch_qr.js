const fs = require('fs');
let code = fs.readFileSync('c:/Users/Dell/packer-module/Packers/frontend/src/pages/BarcodesLabels.tsx', 'utf8');

// Insert qrCodeUrl state and effect
const injection = `  const [qrCodeUrl, setQrCodeUrl] = useState("");
  useEffect(() => {
    setQrCodeUrl(\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(batchNo || "9031123456789")}\`);
  }, [batchNo]);

`;

code = code.replace('const [printQty, setPrintQty] = useState(1);', 'const [printQty, setPrintQty] = useState(1);\n' + injection);

fs.writeFileSync('c:/Users/Dell/packer-module/Packers/frontend/src/pages/BarcodesLabels.tsx', code);
console.log('qrCodeUrl injected');
