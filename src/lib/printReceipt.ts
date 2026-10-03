import { SaleType } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

/**
 * Sends a clean, ESC/POS-ready thermal receipt to the connected bill printer.
 * Uses an isolated print frame so only the receipt prints—never the surrounding app or web page.
 */
export function printThermalReceipt(sale: SaleType) {
  if (typeof window === 'undefined') return;

  // Create isolated hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  } const itemsRows = (sale.items || [])
    .map(
      (item) => `
      <div style="border-bottom: 2px dashed #444; padding: 10px 0;">
        <div style="font-size: 26px; font-weight: 500; color: #000; line-height: 1.25; word-break: break-word;">
          ${item.itemName}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 6px; font-size: 24px; font-weight: 400; font-variant-numeric: tabular-nums;">
          <div style="color: #222;">
            <span style="font-size: 25px; font-weight: 500; border: 1.5px solid #000; padding: 1px 7px; border-radius: 4px; margin-right: 6px;">x${item.quantity}</span>
            <span style="font-size: 22px; font-weight: 400; color: #333;">@ ${formatCurrency(item.price)}</span>
          </div>
          <div style="font-size: 26px; font-weight: 500; color: #000;">
            ${formatCurrency(item.total)}
          </div>
        </div>
      </div>
    `
    )
    .join('');

  const discountRow =
    sale.discount > 0
      ? `
      <div style="display: flex; justify-content: space-between; font-size: 24px; font-weight: 400; margin-top: 5px;">
        <span>Discount:</span>
        <span style="font-variant-numeric: tabular-nums;">-${formatCurrency(sale.discount)}</span>
      </div>
    `
      : '';

  const tableOrCustomerHtml = sale.customerOrTable
    ? `<div style="font-size: 25px; margin-top: 8px; font-weight: 500; color: #000; border: 2px solid #000; padding: 5px 10px; display: inline-block;">Ref / Table: ${sale.customerOrTable}</div>`
    : '';

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${sale.billNumber}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: 80mm 297mm;
            margin: 0mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .receipt-wrapper {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 24px;
            font-weight: 400;
            line-height: 1.35;
            color: #000000;
            background: #ffffff;
            width: 90%;
            box-sizing: border-box;
            margin: 0 auto;
            padding: 1mm 0 24mm 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .divider {
            border-top: 2px dashed #000000;
            margin: 22px 0;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
        </style>
      </head>
      <body>
        <div class="receipt-wrapper">
          <div class="text-center">
            <div style="margin-bottom: 10px;">
              <img src="/logo.jpg" alt="Logo" style="max-width: 160px; width: 100%; height: auto; display: inline-block; filter: grayscale(100%) contrast(150%);" />
            </div>
            <div style="font-size: 38px; font-weight: 900; letter-spacing: 1px; line-height: 1.1;">FOOD CORNER</div>
            <div style="font-size: 20px; font-weight: 400; margin-top: 5px; color: #222;">No. 30 Teldeniya Road Menikhinna</div>
            <div style="font-size: 20px; font-weight: 400; margin-top: 3px; color: #222;">Phone: 0756655172</div>
            <div class="divider"></div>
            <div style="font-size: 27px; font-weight: 500; letter-spacing: 0.5px;">BILL: ${sale.billNumber}</div>
            <div style="font-size: 22px; font-weight: 400; margin-top: 6px;">${formatDate(sale.saleDate)} • ${formatTime(sale.createdAt)}</div>
          </div>

          <div class="divider"></div>

          <div style="font-size: 22px; font-weight: 400; text-transform: uppercase; margin-bottom: 12px; display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 8px;">
            <span>ORDERED ITEMS</span>
            <span>AMOUNT</span>
          </div>

          <div>
            ${itemsRows}
          </div>

          <div class="divider"></div>

          <div style="padding: 6px 0;">
            <div style="display: flex; justify-content: space-between; font-size: 24px; font-weight: 400;">
              <span>Subtotal:</span>
              <span style="font-variant-numeric: tabular-nums;">${formatCurrency(sale.subtotal)}</span>
            </div>
            ${discountRow}

            <div style="margin: 16px 0; padding: 14px 0; border-top: 3px solid #000; border-bottom: 3px solid #000; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 32px; font-weight: 900; letter-spacing: 0.5px;">TOTAL:</span>
              <span style="font-size: 36px; font-weight: 900; font-variant-numeric: tabular-nums; letter-spacing: 0.5px;">${formatCurrency(sale.grandTotal)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 22px; font-weight: 400; margin-top: 6px;">
              <span>Paid by:</span>
              <span>${(sale.paymentMethod || 'Cash').toUpperCase()}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="text-center" style="margin-top: 18px;">
            <div style="font-size: 22px; font-weight: 400;">Thank you for dining with us!</div>
            <div style="font-size: 25px; font-weight: 500; margin-top: 6px; letter-spacing: 0.5px;">*** Please Visit Again ***</div>
          </div>

          <!-- Thermal printer paper tear-off buffer -->
          <div style="height: 25mm;"></div>
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(receiptHtml);
  doc.close();

  // Wait for iframe rendering then trigger print dialog
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Thermal print error:', e);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  }, 200);
}

/**
 * Prints a clean thermal running order ticket / kitchen slip.
 */
export function printRunningTicket(sale: {
  orderNumber: string;
  customerOrTable?: string;
  items: Array<{ itemName?: string; name?: string; quantity: number; price?: number; total?: number }>;
  grandTotal?: number;
  createdAt?: string;
}) {
  if (typeof window === 'undefined') return;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  const itemsRows = (sale.items || [])
    .map(
      (item) => `
      <div style="border-bottom: 2px dashed #444; padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-weight: 500; font-size: 26px; color: #000; line-height: 1.25; word-break: break-word; flex: 1; padding-right: 10px;">
          ${item.itemName || item.name}
        </div>
        <div style="font-size: 30px; font-weight: 500; color: #000; border: 2px solid #000; padding: 2px 10px; border-radius: 4px; shrink-0;">
          x${item.quantity}
        </div>
      </div>
    `
    )
    .join('');

  const ticketHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Running Order - ${sale.orderNumber}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: 80mm 297mm; margin: 0mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .ticket-wrapper {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            font-size: 24px;
            font-weight: 400;
            color: #000000;
            background: #ffffff;
            width: 100%;
            box-sizing: border-box;
            margin: 0;
            padding: 1mm 0 25mm 0;
          }
          .divider { border-top: 2px dashed #000000; margin: 22px 0; }
          .text-center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="ticket-wrapper">
          <div class="text-center">
            <div style="margin-bottom: 10px;">
              <img src="/logo.jpg" alt="Logo" style="max-width: 150px; width: 100%; height: auto; display: inline-block; filter: grayscale(100%) contrast(150%);" />
            </div>
            <div style="font-size: 30px; font-weight: 900; letter-spacing: 0.5px;">** RUNNING ORDER TAB **</div>
            <div style="font-size: 28px; font-weight: 500; margin-top: 6px;">${sale.orderNumber}</div>
          <div style="font-size: 28px; font-weight: 500; margin-top: 6px; border: 2px solid #000; padding: 6px; border-radius: 4px;">
            ${sale.customerOrTable || 'COUNTER TAB'}
          </div>
          <div style="font-size: 22px; font-weight: 400; margin-top: 6px;">Time: ${formatDate(sale.createdAt || new Date().toISOString())} • ${formatTime(sale.createdAt || new Date().toISOString())}</div>
        </div>

        <div class="divider"></div>

        <div>
          ${itemsRows}
        </div>

        <div class="divider"></div>

        ${sale.grandTotal !== undefined
      ? `
          <div style="display: flex; justify-content: space-between; font-weight: 500; font-size: 28px; margin-top: 8px;">
            <span>Estimated Total:</span>
            <span>${formatCurrency(sale.grandTotal)}</span>
          </div>
        `
      : ''
    }

        <div class="text-center" style="margin-top: 16px; font-size: 22px; font-weight: 500;">
          [ PENDING PAYMENT / OPEN TAB ]
        </div>
        <div style="height: 25mm;"></div>
      </div>
    </body>
  </html>
  `;

  doc.open();
  doc.write(ticketHtml);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error('Ticket print error:', e);
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  }, 200);
}

