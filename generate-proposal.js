import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateFinancialProposalPDF() {
  console.log('🚀 Launching Puppeteer Headless Browser for Financial Proposal...');

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

    const htmlPath = path.join(__dirname, 'financial-proposal.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    console.log('📄 Rendering Financial Proposal Template (financial-proposal.html)...');
    await page.setContent(htmlContent, { waitUntil: 'load', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000)); // allow Tailwind CDN & Google Fonts to hydrate
    await page.evaluateHandle('document.fonts.ready');

    const pdfPath = path.join(__dirname, 'RopeLink-Financial-Proposal.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '30px',
        bottom: '30px',
        left: '30px',
        right: '30px',
      },
    });

    console.log(`\n🎉 [SUCCESS] Created Financial Proposal PDF: ${pdfPath}`);
  } catch (error) {
    console.error('❌ Error generating financial proposal PDF:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generateFinancialProposalPDF();
