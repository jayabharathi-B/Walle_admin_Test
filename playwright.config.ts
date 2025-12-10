import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config(); // loads local .env files if present

const baseUrl = process.env.BASE_URL || 'https://admin.walle.xyz';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    headless: true,
    baseURL: baseUrl,
    // don't set storageState here globally if you want per-project control
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', storageState: 'auth/storageState.json' } }
  ],
});
