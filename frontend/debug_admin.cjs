const puppeteer = require('puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    await page.goto('http://localhost:5174/');
    await wait(2000); // wait for load
    
    console.log("Selecting Admin role...");
    await page.evaluate(() => {
      const adminBtn = Array.from(document.querySelectorAll('.role-toggle-btn')).find(b => b.textContent.includes('Admin'));
      if(adminBtn) adminBtn.click();
      
      const loginBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Login as Admin'));
      if(loginBtn) loginBtn.click();
    });
    
    await wait(2000);
    console.log("Checking if Admin Dashboard rendered...");
    const html = await page.content();
    if(html.includes('Good')) {
        console.log("Admin Dashboard Rendered Successfully.");
    } else {
        console.log("Admin Dashboard might not have rendered correctly.");
    }
  } catch (err) {
    console.error("Puppeteer script error:", err);
  } finally {
    await browser.close();
  }
})();
