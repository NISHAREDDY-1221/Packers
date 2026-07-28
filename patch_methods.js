const fs = require('fs');
let code = fs.readFileSync('c:/Users/Dell/packer-module/Packers/frontend/src/pages/BarcodesLabels.tsx', 'utf8');

const newHandlePrint = `  const handlePrint = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccessBanner(null);

    if (printerStatus === 'Offline') {
      setValidationError('Printer is Offline. Please check printer connection.');
      return;
    }
    if (!batchNo) {
      setValidationError('Batch Number is not available.');
      return;
    }
    if (mrp <= 0) {
      setValidationError('MRP must be configured (> 0).');
      return;
    }
    if (!mfgDate || !expiryDate) {
      setValidationError('MFG and EXP dates are required.');
      return;
    }

    try {
      if (!selectedWO) return;
      // 1. Call backend to persist the print job
      const newJob = await barcodeService.printLabels(selectedWO.id, batchNo, barcodeType, printQty);

      // 2. Trigger HTML5 visual print window
      printLabels(newJob, labelTemplate, barcodeType);

      // 3. Update local state
      setHistory([newJob, ...history]);
      setLabelsPrinted(prev => prev + printQty);
      setLabelsRequired(printQty);

      setSuccessBanner({
        totalPrinted: printQty,
        timestamp: newJob.timestamp,
        printer: selectedPrinter,
        jobId: newJob.id
      });
    } catch (err) {
      console.error('Print failed', err);
      setValidationError('Failed to execute print job on the server.');
    }
  };`;

const newHandleReprint = `  const handleReprint = async (job: PrintJob) => {
    const reason = prompt('Please enter the reprint reason:');
    if (reason === null) return; 
    if (!reason.trim()) {
      alert('Reprint reason is required.');
      return;
    }

    try {
      const res = await barcodeService.reprintLabels(job.id, reason);
      
      if (res.requiresApproval) {
        alert(res.message);
      } else if (res.job) {
        // Trigger HTML5 visual print window
        printLabels(res.job, labelTemplate, barcodeType);

        setHistory([res.job, ...history]);
        setSuccessBanner({
          totalPrinted: res.job.printedQty,
          timestamp: res.job.timestamp,
          printer: selectedPrinter,
          jobId: res.job.id
        });
      }
    } catch (err) {
      console.error('Reprint failed', err);
      alert('Failed to execute reprint job.');
    }
  };`;

// Replace handlePrint
const handlePrintRegex = /\s*\/\/\s*Handle Generate and Print[\s\S]*?(?=\s*\/\/\s*Handle Reprint Action)/;
code = code.replace(handlePrintRegex, '\n  // Handle Generate and Print\n' + newHandlePrint + '\n\n');

// Replace handleReprint
const handleReprintRegex = /\s*\/\/\s*Handle Reprint Action[\s\S]*?(?=\s*return \()/;
code = code.replace(handleReprintRegex, '\n  // Handle Reprint Action\n' + newHandleReprint + '\n\n');

fs.writeFileSync('c:/Users/Dell/packer-module/Packers/frontend/src/pages/BarcodesLabels.tsx', code);
console.log('Methods Patched');
