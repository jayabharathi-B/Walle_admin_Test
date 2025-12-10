import { test, expect } from '@playwright/test';
import { AccessCodePage } from '../pages/AccessCodePage';
import fs from 'fs';
import path from 'path';

test.describe('Access Code Management', () => {
    test.use({ storageState: 'auth/storageState.json' });

    const generatedCodesPath = path.join(__dirname, '../fixtures/generatedCodes.json');

    test('Test 1: Generate and verify random access code', async ({ page }) => {
        const accessPage = new AccessCodePage(page);

        await accessPage.goto();
        const code = await accessPage.generateRandomCode();
        console.log(`Test 1 generated random code: ${code}`);

        await accessPage.clickManageTab();
        await accessPage.verifyCodeInTable(code);

        // Save code for Test 3 cleanup
        const codes = { randomCode: code, customCode: '' };
        fs.writeFileSync(generatedCodesPath, JSON.stringify(codes, null, 2));
    });

    test('Test 2: Generate and verify custom access code', async ({ page }) => {
        const accessPage = new AccessCodePage(page);

        // Counter logic
        const counterPath = path.join(__dirname, '../fixtures/counter.json');
        const counter = JSON.parse(fs.readFileSync(counterPath, 'utf-8'));
        const nextCount = counter.lastCount + 1;
        const code = `TEST${String(nextCount).padStart(4, '0')}`;
        const limit = 2;

        await accessPage.goto();
        console.log(`Test 2 creating custom code: ${code} with limit ${limit}`);

        await accessPage.createCustomCode(code, limit);

        await accessPage.clickManageTab();
        await accessPage.verifyCodeInTable(code);

        // Update counter
        counter.lastCount = nextCount;
        fs.writeFileSync(counterPath, JSON.stringify(counter, null, 2));

        // Update generated codes file for Test 3
        const codes = JSON.parse(fs.readFileSync(generatedCodesPath, 'utf-8'));
        codes.customCode = code;
        fs.writeFileSync(generatedCodesPath, JSON.stringify(codes, null, 2));
    });

    test('Test 3: Delete both generated codes', async ({ page }) => {
        const accessPage = new AccessCodePage(page);

        // Read codes generated in Test 1 & 2
        const codes = JSON.parse(fs.readFileSync(generatedCodesPath, 'utf-8'));
        console.log(`Test 3 deleting codes: ${codes.randomCode}, ${codes.customCode}`);

        await accessPage.goto();
        await accessPage.clickManageTab();

        // Delete random code
        if (codes.randomCode) {
            await accessPage.deleteCode(codes.randomCode);
            console.log(`✓ Deleted random code: ${codes.randomCode}`);
        }

        // Delete custom code
        if (codes.customCode) {
            await accessPage.deleteCode(codes.customCode);
            console.log(`✓ Deleted custom code: ${codes.customCode}`);
        }

        // Clean up the file
        fs.writeFileSync(generatedCodesPath, JSON.stringify({ randomCode: '', customCode: '' }, null, 2));
    });
});
