import { Order } from '@/types/database';

/**
 * Thermal Receipt Printer Utility
 * ─────────────────────────────────
 * Designed for 58mm thermal printers (POS-5890U and similar).
 * 58mm paper ≈ 48mm printable area ≈ 32 characters in monospace.
 *
 * Instead of using window.print() which sends PostScript/PDF
 * (which thermal printers can't interpret), this opens a minimal
 * popup window with a pre-formatted plain-text receipt and triggers
 * the browser's raw text printing.
 */

const LINE_WIDTH = 32; // Characters per line for 58mm paper

function center(text: string): string {
    const pad = Math.max(0, Math.floor((LINE_WIDTH - text.length) / 2));
    return ' '.repeat(pad) + text;
}

function line(char: string = '-'): string {
    return char.repeat(LINE_WIDTH);
}

function leftRight(left: string, right: string): string {
    const space = LINE_WIDTH - left.length - right.length;
    if (space < 1) {
        // If too long, truncate the left side
        const truncLeft = left.substring(0, LINE_WIDTH - right.length - 1);
        return truncLeft + ' ' + right;
    }
    return left + ' '.repeat(space) + right;
}

function wrapText(text: string, maxWidth: number = LINE_WIDTH): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if (currentLine.length + word.length + 1 <= maxWidth) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function formatCurrency(amount: number): string {
    return `P${amount.toFixed(2)}`;
}

export function generateReceiptText(order: Order): string {
    const lines: string[] = [];

    // Header
    lines.push('');
    lines.push(center('M Café & Thrift Shop'));
    lines.push(center('~ ~ ~ ~ ~ ~ ~'));
    lines.push('');
    lines.push(center('Thank you for'));
    lines.push(center('your order!'));
    lines.push(line('='));

    // Order info
    lines.push(`Order: #${order.order_number}`);
    const date = new Date(order.created_at);
    const dateStr = date.toLocaleDateString('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
    lines.push(`Date: ${dateStr} ${timeStr}`);
    lines.push(
        `Type: ${order.customer_type}${order.table_no ? ` | Table ${order.table_no}` : ''}`
    );
    lines.push(`Payment: ${order.payment_method}`);
    lines.push(line('-'));

    // Items
    for (const item of order.items) {
        const qtyName = `${item.quantity}x ${item.name}`;
        const price = formatCurrency(item.subtotal);

        // If item name is too long, wrap it
        if (qtyName.length + price.length + 1 > LINE_WIDTH) {
            const wrappedName = wrapText(qtyName, LINE_WIDTH - price.length - 1);
            for (let i = 0; i < wrappedName.length; i++) {
                if (i === wrappedName.length - 1) {
                    lines.push(leftRight(wrappedName[i], price));
                } else {
                    lines.push(wrappedName[i]);
                }
            }
        } else {
            lines.push(leftRight(qtyName, price));
        }
    }
    lines.push(line('-'));

    // Totals
    lines.push(leftRight('Subtotal', formatCurrency(order.subtotal)));
    lines.push(leftRight('Tax', formatCurrency(order.tax)));
    lines.push(line('='));
    lines.push(leftRight('TOTAL', formatCurrency(order.total)));
    lines.push(line('='));

    // Cash details
    if (order.payment_method === 'Cash') {
        lines.push(leftRight('Amount Paid', formatCurrency(order.amount_paid)));
        lines.push(leftRight('Change', formatCurrency(order.change)));
        lines.push(line('-'));
    }

    // Footer
    lines.push('');
    lines.push(center('* * * * * * *'));
    lines.push(center('Thank you!'));
    lines.push(center('Please come again'));
    lines.push('');
    lines.push(''); // Extra blank lines for paper feed
    lines.push('');

    return lines.join('\n');
}

/**
 * Opens a new window with the receipt formatted for thermal printing
 * and triggers the print dialog. This method avoids sending PostScript
 * to the printer by using a minimal HTML document with monospace text.
 */
export function printReceipt(order: Order): void {
    const receiptText = generateReceiptText(order);

    // Build a minimal HTML page with ONLY the receipt text
    // No complex CSS, no gradients, no colors — just plain monospace text
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt #${order.order_number}</title>
<style>
  /* Reset everything */
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @page {
    /* 58mm paper width, minimal margins */
    size: 58mm auto;
    margin: 0mm;
  }

  body {
    font-family: 'Courier New', 'Courier', 'Lucida Console', monospace;
    font-size: 12px;
    line-height: 1.3;
    color: #000;
    background: #fff;
    width: 58mm;
    padding: 2mm;
    -webkit-print-color-adjust: exact;
  }

  pre {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    white-space: pre;
    word-break: keep-all;
    overflow: hidden;
  }

  @media print {
    body {
      width: 58mm;
      padding: 0mm 1mm;
      margin: 0;
    }
  }

  /* Screen preview styling */
  @media screen {
    html {
      display: flex;
      justify-content: center;
      background: #f0f0f0;
      min-height: 100vh;
      padding: 20px 0;
    }
    body {
      background: white;
      box-shadow: 0 2px 20px rgba(0,0,0,0.1);
      min-height: auto;
      border-radius: 4px;
      padding: 4mm;
      margin: auto;
    }
  }
</style>
</head>
<body>
<pre>${receiptText}</pre>
<script>
  // Auto-print when the window loads
  window.onload = function() {
    setTimeout(function() {
      window.print();
    }, 300);
  };

  // Close the window after printing (or if cancelled)
  window.onafterprint = function() {
    window.close();
  };
</script>
</body>
</html>`;

    // Open a small popup window
    const printWindow = window.open(
        '',
        'receipt_print',
        'width=350,height=600,scrollbars=yes,resizable=no'
    );

    if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    } else {
        // Fallback: if popup is blocked, use an iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.top = '-10000px';
        iframe.style.left = '-10000px';
        iframe.style.width = '58mm';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(html);
            iframeDoc.close();

            iframe.onload = () => {
                setTimeout(() => {
                    iframe.contentWindow?.print();
                    // Clean up after a delay
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                }, 300);
            };
        }
    }
}
