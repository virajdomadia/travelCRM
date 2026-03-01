import puppeteer from 'puppeteer';
import { formatMoney } from './money';
import { QuotationWithItems } from '../types';

export async function generateQuotationPDF(quotation: QuotationWithItems): Promise<Uint8Array> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Create a minimal HTML template mapping the requested items
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Quotation v${quotation.version}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 40px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eaeaea; padding-bottom: 20px; margin-bottom: 30px; }
        .agency-details h1 { margin: 0; color: #1a1a1a; font-size: 24px; }
        .quote-details { text-align: right; }
        .quote-details h2 { margin: 0; color: #666; font-size: 20px; }
        .client-info { margin-bottom: 40px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { text-align: left; background: #f8f9fa; padding: 12px; border-bottom: 2px solid #dee2e6; color: #495057; }
        td { padding: 12px; border-bottom: 1px solid #dee2e6; }
        .totals { width: 300px; margin-left: auto; }
        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .totals-row.final { font-weight: bold; font-size: 1.2em; border-bottom: 2px solid #666; }
        .footer { margin-top: 50px; font-size: 12px; color: #888; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="agency-details">
          <h1>${quotation.agencyNameSnapshot || 'Travel Agency'}</h1>
        </div>
        <div class="quote-details">
          <h2>QUOTATION</h2>
          <p><strong>Version:</strong> v${quotation.version}</p>
          <p><strong>Date:</strong> ${new Date(quotation.createdAt).toLocaleDateString()}</p>
          ${quotation.validUntil ? `<p><strong>Valid Until:</strong> ${new Date(quotation.validUntil).toLocaleDateString()}</p>` : ''}
        </div>
      </div>

      <div class="client-info">
        <h3>Prepared For:</h3>
        <p><strong>${quotation.leadNameSnapshot || 'Valued Client'}</strong></p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${quotation.lineItems.map(item => `
            <tr>
              <td>${item.name}</td>
              <td style="text-align: right">${formatMoney(item.finalAmount, quotation.currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row final">
          <span>Total Amount:</span>
          <span>${formatMoney(quotation.totalAmount, quotation.currency)}</span>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for choosing ${quotation.agencyNameSnapshot || 'our agency'} for your travel needs.</p>
      </div>
    </body>
    </html>
  `;

    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();
    return pdfBuffer;
}
