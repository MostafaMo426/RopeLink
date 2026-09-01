import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePDFs() {
  console.log('🚀 Launching Headless Browser with Puppeteer...');
  
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

    // 1. Generate Arabic PDF Report
    const arHtml = fs.readFileSync(path.join(__dirname, 'report-ar.html'), 'utf8');
    console.log('📄 Rendering Arabic Template (report-ar.html)...');
    await page.setContent(arHtml, { waitUntil: 'load', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000)); // wait for Tailwind CDN & Google Fonts to hydrate
    await page.evaluateHandle('document.fonts.ready');

    const arPdfPath = path.join(__dirname, 'RopeLink-Executive-Report-AR.pdf');
    await page.pdf({
      path: arPdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', bottom: '12mm', left: '15mm', right: '15mm' },
    });
    console.log(`✅ [SUCCESS] Created Arabic PDF: ${arPdfPath}`);

    // 2. Generate English PDF Report
    const enHtml = fs.readFileSync(path.join(__dirname, 'report-en.html'), 'utf8');
    console.log('📄 Rendering English Template (report-en.html)...');
    await page.setContent(enHtml, { waitUntil: 'load', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000)); // wait for Tailwind CDN & Google Fonts to hydrate
    await page.evaluateHandle('document.fonts.ready');

    const enPdfPath = path.join(__dirname, 'RopeLink-Executive-Report-EN.pdf');
    await page.pdf({
      path: enPdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', bottom: '12mm', left: '15mm', right: '15mm' },
    });
    console.log(`✅ [SUCCESS] Created English PDF: ${enPdfPath}`);

    console.log('\n🎉 BOTH EXECUTIVE PDF REPORTS GENERATED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Error generating PDFs:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generatePDFs();
