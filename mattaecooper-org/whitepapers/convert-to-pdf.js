const puppeteer = require('puppeteer');
const path = require('path');

async function convertToPDF() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Load the HTML file
        const htmlPath = path.join(__dirname, 'aegntic-mcp-whitepaper.html');
        await page.goto(`file://${htmlPath}`, {
            waitUntil: 'networkidle0'
        });
        
        // Generate PDF with settings similar to Bitcoin whitepaper
        await page.pdf({
            path: 'aegntic-mcp-whitepaper.pdf',
            format: 'A4',
            margin: {
                top: '1in',
                right: '1in',
                bottom: '1in',
                left: '1in'
            },
            printBackground: true,
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });
        
        console.log('PDF generated successfully!');
    } catch (error) {
        console.error('Error generating PDF:', error);
    } finally {
        await browser.close();
    }
}

convertToPDF();