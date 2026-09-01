import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePricingPDF() {
  console.log('🚀 Launching Headless Browser for Pricing Proposal...');
  
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

    const htmlContent = fs.readFileSync(path.join(__dirname, 'pricing-proposal.html'), 'utf8');
    console.log('📄 Rendering Pricing Proposal Template (pricing-proposal.html)...');
    
    await page.setContent(htmlContent, { waitUntil: 'load', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000)); // allow Tailwind & fonts to hydrate
    await page.evaluateHandle('document.fonts.ready');

    const pdfPath = path.join(__dirname, 'RopeLink-Pricing-Proposal.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '12mm', right: '12mm' },
    });

    console.log(`\n🎉 [SUCCESS] Created Pricing Proposal PDF: ${pdfPath}`);
  } catch (error) {
    console.error('❌ Error generating pricing PDF:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generatePricingPDF();
