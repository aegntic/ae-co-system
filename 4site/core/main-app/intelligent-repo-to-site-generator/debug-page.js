import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/');
  
  // Get actual page content to see what's wrong
  const content = await page.content();
  console.log('=== ACTUAL PAGE CONTENT ===');
  console.log(content.substring(0, 2000));
  
  const h1Text = await page.$eval('h1', el => el.textContent).catch(() => 'H1 NOT FOUND');
  console.log('\n=== H1 TEXT ===');
  console.log(h1Text);
  
  const inputs = await page.$$eval('input', els => els.map(el => ({ type: el.type, placeholder: el.placeholder })));
  console.log('\n=== INPUTS FOUND ===');
  console.log(inputs);
  
  await browser.close();
})();