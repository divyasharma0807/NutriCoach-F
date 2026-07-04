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
    
    // Attempt to login as client
    console.log("Logging in...");
    await page.evaluate(() => {
      const clientBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Client'));
      if(clientBtn) clientBtn.click();
    });
    
    await wait(1000);
    
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passInput = document.querySelector('input[type="password"]');
      if(emailInput) emailInput.value = 'client@example.com';
      if(passInput) passInput.value = 'password';
      
      const loginBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign In'));
      if(loginBtn) loginBtn.click();
    });
    
    await wait(1000);
    
    // Click topbar avatar
    console.log("Opening profile menu...");
    await page.evaluate(() => {
      const avatarBtn = document.querySelector('.topbar-avatar');
      if(avatarBtn) avatarBtn.click();
    });
    
    await wait(500);
    
    console.log("Clicking My Profile...");
    await page.evaluate(() => {
      const myProfileBtn = Array.from(document.querySelectorAll('.profile-dropdown button')).find(b => b.textContent.includes('My Profile'));
      if(myProfileBtn) myProfileBtn.click();
    });
    
    await wait(1000);
    
    console.log("Done");
  } catch (err) {
    console.error("Puppeteer script error:", err);
  } finally {
    await browser.close();
  }
})();
