  // Printing Logic using HTML5 print window and canvases
  const printLabels = (
    job: { sku: string; batchNo: string; printedQty: number; woNo: string },
    template: string,
    type: string,
  ) => {
    let barcodeDataUrl = "";
    if (type !== "QR Code") {
      const offCanvas = document.createElement("canvas");
      drawBarcode128(offCanvas, job.batchNo);
      barcodeDataUrl = offCanvas.toDataURL("image/png");
    }

    // Set dimensions based on template
    let width = "50mm";
    let height = "25mm";
    if (template === "Bulk Label") {
      width = "100mm";
      height = "50mm";
    } else if (template === "Export Label") {
      width = "100mm";
      height = "150mm";
    }

    const labelCards: string[] = [];
    const productName = selectedWO?.productName || "Product Name";

    const cardBody = `
      <div class="label-card" style="width: ${width}; height: ${height}; display: flex; flex-direction: column; justify-content: space-between; padding: 6px 10px; font-family: sans-serif; overflow: hidden; page-break-inside: avoid; break-inside: avoid; page-break-after: always; break-after: page;">
        <div class="card-header" style="font-size: 10px; font-weight: 805; text-transform: uppercase; color: #00891D; text-align: center; border-b: 1px solid #e5e7eb; padding-bottom: 2px;">
          VillagKart Retail
        </div>
        <div class="product-name" style="font-size: 9px; font-weight: 700; color: #111827; margin-top: 4px; text-align: center;">
          ${productName}
        </div>
        <div class="meta-info" style="font-size: 7.5px; color: #4b5563; margin-top: 4px; line-height: 1.2;">
          <div style="display: flex; justify-content: space-between;">
            <span>SKU: <b>${job.sku}</b></span>
            <span>Batch: <b>${job.batchNo}</b></span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>Lot: <b>${lotNo || "N/A"}</b></span>
            <span>MRP: <b>â‚¹${mrp || 0}.00</b></span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 7px;">
            <span>MFG: ${mfgDate}</span>
            <span>EXP: ${expiryDate}</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 6px; border-t: 1px dashed #e5e7eb; padding-top: 4px;">
          ${
            type !== "QR Code"
              ? `
            <img src="${barcodeDataUrl}" style="width: 85%; height: 24px;" alt="barcode" />
            <div style="font-size: 7px; font-family: monospace; margin-top: 1px; color: #111827;">${type}: ${job.batchNo}</div>
          `
              : `
            <img src="${qrCodeUrl}" style="width: 36px; height: 36px;" alt="QR Code" />
            <div style="font-size: 7px; font-family: monospace; margin-top: 1px; color: #111827;">QR Code</div>
          `
          }
        </div>
      </div>
    `;

    for (let i = 0; i < job.printedQty; i++) {
      labelCards.push(cardBody);
    }
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const printWindow = iframe.contentWindow;
    if (!printWindow) {
      alert("Could not initialize print mechanism.");
      document.body.removeChild(iframe);
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            @page {
              size: ${width} ${height};
              margin: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: #fff;
              padding: 0;
              margin: 0;
            }
            .label-grid {
              display: block;
            }
            @media print {
              body { background: #fff; }
            }
          </style>
        </head>
        <body>
          <div class="label-grid">
            ${labelCards.join("")}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                setTimeout(function() { 
                  window.parent.document.body.removeChild(window.frameElement);
                }, 500);
              }, 100);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();