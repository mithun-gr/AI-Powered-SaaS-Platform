const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🎬 Starting Morchantra Automated Video Production...');
  
  // Create video output directory
  const videoDir = path.join(__dirname, 'videos');
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir);

  const browser = await chromium.launch({ headless: true });
  
  // Set up context with 1080p recording
  const context = await browser.newContext({
    recordVideo: { dir: videoDir, size: { width: 1920, height: 1080 } },
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'dark'
  });
  
  const page = await context.newPage();
  
  // Helper to mimic slow human scrolling
  const autoScroll = async (direction = 'down', distance = 600) => {
    let currentPosition = 0;
    while (currentPosition < distance) {
      await page.mouse.wheel(0, direction === 'down' ? 100 : -100);
      currentPosition += 100;
      await page.waitForTimeout(400); 
    }
  };

  // ── PART 1: CLIENT TOUR ── 
  console.log('▶️ Recording Client flow...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(4000); // Intro pause
  
  // Login
  await page.click('button:has-text("Client Portal")');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Demo Client Credentials")');
  await page.waitForTimeout(2500);
  await page.click('button:has-text("Sign In as Client")');
  await page.waitForTimeout(6000); // Wait for redirect and dashboard animation

  // Dashboard
  console.log('   - Dashboard...');
  await autoScroll('down', 1000);
  await page.waitForTimeout(3000);
  await autoScroll('up', 1000);
  await page.waitForTimeout(3000);

  // My Requests
  console.log('   - Requests...');
  await page.click('a[href="/requests"]');
  await page.waitForTimeout(5000);
  
  // Vault
  console.log('   - Document Vault...');
  await page.click('a[href="/documents"]');
  await page.waitForTimeout(6000);
  
  // Payments
  console.log('   - Payments...');
  await page.click('a[href="/payments"]');
  await page.waitForTimeout(4000);
  await autoScroll('down', 800);
  await page.waitForTimeout(3000);
  await autoScroll('up', 800);

  // Settings
  console.log('   - Settings...');
  await page.click('a[href="/settings"]');
  await page.waitForTimeout(5000);
  await autoScroll('down', 400);
  await page.waitForTimeout(4000);

  // AI Chat Demo
  console.log('   - Live Chat AI Demo...');
  // Open widget
  await page.click('button:has-text("Chat with Morchantra AI")');
  await page.waitForTimeout(3000);
  
  // Type message slowly
  const message = "What are the core services you provide?";
  await page.focus('input[placeholder="Type a message or press / for commands..."]');
  for (let i = 0; i < message.length; i++) {
    await page.keyboard.type(message[i]);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(1000);
  await page.keyboard.press('Enter');
  
  // Wait for the LLM to stream the entire response
  await page.waitForTimeout(12000);

  // Logout
  console.log('   - Logout...');
  await page.click('button.rounded-full'); // Avatar dropdown
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Log out")');
  await page.waitForTimeout(6000);


  // ── PART 2: ADMIN TOUR ──
  console.log('▶️ Recording Admin flow...');
  await page.click('button:has-text("Admin Dashboard")');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Demo Admin Credentials")');
  await page.waitForTimeout(2500);
  await page.click('button:has-text("Sign In as Admin")');
  await page.waitForTimeout(6000); // Enter admin

  // Admin Home
  console.log('   - Admin Home...');
  await autoScroll('down', 800);
  await page.waitForTimeout(4000);
  await autoScroll('up', 800);
  await page.waitForTimeout(3000);

  // Admin Clients
  console.log('   - Admin Clients...');
  await page.click('a[href="/admin/clients"]');
  await page.waitForTimeout(7000);

  // Admin Analytics
  console.log('   - Admin Analytics...');
  await page.click('a[href="/admin/analytics"]');
  await page.waitForTimeout(4000);
  await autoScroll('down', 600);
  await page.waitForTimeout(5000);
  
  // Open Download Report modal
  await page.click('button:has-text("Download Report")');
  await page.waitForTimeout(5000);
  
  // Download simulation
  await page.click('button:has-text("PDF Report")');
  await page.waitForTimeout(10000); // 10s wait to mock the PDF gen viewing

  // 15 seconds cinematic end pause
  console.log('   - Cinematic Exit Pause...');
  await page.waitForTimeout(15000);
  
  // Finish
  console.log('✅ Finishing video encode...');
  await context.close();
  await browser.close();
  
  // Find generated webm and copy to Desktop
  const files = fs.readdirSync(videoDir);
  const webmFile = files.find(f => f.endsWith('.webm'));
  
  if (webmFile) {
    const srcPath = path.join(videoDir, webmFile);
    const destPath = path.join(process.env.HOME, 'Desktop', 'Morchantra_Cinematic_Tour_5Min.webm');
    fs.copyFileSync(srcPath, destPath);
    console.log(`🎉 VIDEO SAVED TO DESKTOP: ${destPath}`);
  }

})();
