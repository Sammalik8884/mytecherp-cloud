import puppeteer from 'puppeteer';

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: 'new', executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => {
     console.log(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    console.log("Navigating to login...");
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    
    // Login
    await page.type('input[type="email"]', 's.alikhan57@gmail.com');
    await page.type('input[type="password"]', 'Malik@8884');
    await page.click('button[type="submit"]');
    
    console.log("Waiting for navigation...");
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log("Navigating to project documents...");
    await page.goto('http://localhost:5173/project-documents', { waitUntil: 'networkidle2' });
    
    console.log("Clicking spot check button...");
    
    // Wait for the button to appear. Find the button by text "Create Spot Check" or "Project Spot Check Site"
    await page.waitForFunction(() => {
       const buttons = Array.from(document.querySelectorAll('button'));
       return buttons.some(b => b.innerText.includes('Project Spot Check Site'));
    }, { timeout: 10000 });
    
    // Click the button
    await page.evaluate(() => {
       const buttons = Array.from(document.querySelectorAll('button'));
       const btn = buttons.find(b => b.innerText.includes('Project Spot Check Site'));
       if (btn) btn.click();
    });
    
    console.log("Button clicked. Waiting to see if modal appears or error is logged...");
    await new Promise(r => setTimeout(r, 5000));
    
  } catch (err) {
    console.error("Test script failed:", err);
  } finally {
    await browser.close();
  }
})();
