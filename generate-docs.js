import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateContractAndSchedulePDFs() {
  console.log('🚀 Launching Puppeteer Headless Browser...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // 1. Generate RopeLink-Contract.pdf
    const contractHtml = fs.readFileSync(path.join(__dirname, 'contract.html'), 'utf8');
    console.log('📄 Rendering Agreement Template (contract.html)...');
    await page.setContent(contractHtml, { waitUntil: 'load', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000)); // allow Tailwind CDN & Google Fonts to hydrate
    await page.evaluateHandle('document.fonts.ready');

    const contractPdfPath = path.join(__dirname, 'RopeLink-Contract.pdf');
    await page.pdf({
      path: contractPdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '30px',
        bottom: '30px',
        left: '30px',
        right: '30px',
      },
    });
    console.log(`✅ [SUCCESS] Created Contract PDF: ${contractPdfPath}`);

    // 2. Generate RopeLink-Payment-Schedule.pdf
    const paymentHtml = fs.readFileSync(path.join(__dirname, 'payment-schedule.html'), 'utf8');
    console.log('📄 Rendering Payment Schedule Template (payment-schedule.html)...');
    await page.setContent(paymentHtml, { waitUntil: 'load', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000)); // allow Tailwind CDN & Google Fonts to hydrate
    await page.evaluateHandle('document.fonts.ready');

    const paymentPdfPath = path.join(__dirname, 'RopeLink-Payment-Schedule.pdf');
    await page.pdf({
      path: paymentPdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '30px',
        bottom: '30px',
        left: '30px',
        right: '30px',
      },
    });
    console.log(`✅ [SUCCESS] Created Payment Schedule PDF: ${paymentPdfPath}`);

    console.log('\n🎉 BOTH LEGAL & FINANCIAL PDF DOCUMENTS GENERATED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Error generating PDFs:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generateContractAndSchedulePDFs();
