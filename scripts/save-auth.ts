import { chromium } from '@playwright/test';
import * as fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create auth directory if it doesn't exist
  if (!fs.existsSync('auth')) {
    fs.mkdirSync('auth');
  }

  await page.goto('https://admin.walle.xyz');
  console.log('Please sign in manually (Continue with Google).');
  console.log('Waiting for you to complete sign-in...');
  console.log('After you reach the dashboard, the auth will be saved automatically.');

  // Wait for navigation to dashboard (URL change after login)
  try {
    await page.waitForURL('**/admin.walle.xyz/**', { timeout: 300000 }); // 5 min timeout

    console.log('Detected navigation to dashboard...');
    console.log('Waiting for page to fully load and Clerk to initialize...');

    // Wait for network to be idle (all resources loaded)
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Wait additional time for Clerk's client-side JavaScript to execute
    console.log('Waiting 15 seconds for Clerk session to initialize...');
    await page.waitForTimeout(15000);

    // Check __client_uat value multiple times
    let clientUat;
    for (let i = 0; i < 3; i++) {
      const cookies = await context.cookies();
      clientUat = cookies.find(c => c.name === '__client_uat');
      console.log(`Check ${i + 1}: __client_uat value:`, clientUat?.value);

      if (clientUat?.value !== '0') {
        console.log('✓ Clerk session authenticated!');
        break;
      }

      if (i < 2) {
        console.log('Still not authenticated, waiting 10 more seconds...');
        await page.waitForTimeout(10000);
      }
    }

    if (clientUat?.value === '0') {
      console.log('\n⚠️  Warning: __client_uat is still 0 after waiting.');
      console.log('The saved state may not work. You might need to stay on the dashboard page longer.');
    }

    // Save the storage state
    await context.storageState({ path: 'auth/storageState.json' });
    console.log('\n✓ Authentication state saved to auth/storageState.json');
    console.log('You can now close this browser window or press Ctrl+C.');

    // Keep browser open for a bit so user can verify
    await page.waitForTimeout(10000);
  } catch (error) {
    console.error('Error during authentication save:', error);
  } finally {
    await browser.close();
  }
})();
