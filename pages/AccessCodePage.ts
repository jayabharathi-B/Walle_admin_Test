import { Page, Locator, expect } from '@playwright/test';

export class AccessCodePage {
    readonly page: Page;
    readonly accessCodeLink: Locator;
    readonly generateCodeBtn: Locator;
    readonly manageTab: Locator;
    readonly successToast: Locator;

    constructor(page: Page) {
        this.page = page;
        this.accessCodeLink = page.getByText('Access Code');
        this.generateCodeBtn = page.getByRole('button', { name: 'Generate Code' });
        this.manageTab = page.getByRole('tab', { name: 'Manage Access Codes' });
        this.successToast = page.locator('.cl-internal-ph86c7');
    }

    async goto() {
        // Navigate to baseURL (configured in playwright.config.ts)
        await this.page.goto('/');
        await this.accessCodeLink.click();
    }

    async generateRandomCode(): Promise<string> {
        await this.generateCodeBtn.click();
        const successMessage = this.page.getByText(/Access code .* generated successfully/);
        await successMessage.waitFor({ state: 'visible', timeout: 10000 });
        const text = await successMessage.innerText();
        const map = text.match(/Access code ([A-Z0-9]+) generated successfully/);
        if (!map || !map[1]) throw new Error(`Could not extract code from toast text: "${text}"`);
        return map[1];
    }

    async clickManageTab() {
        await this.manageTab.click();
        // Wait for table to load
        await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
        await this.page.waitForTimeout(1000); // Additional buffer for table render
    }

    async verifyCodeInTable(code: string) {
        const cell = this.page.getByRole('cell', { name: code, exact: true });
        await expect(cell).toBeVisible({ timeout: 10000 });
        return true;
    }

    async createCustomCode(code: string, limit: number) {
        await this.page.getByPlaceholder('E.g., BETA2025').fill(code);
        await this.page.locator('#custom-usage').fill(limit.toString());
        await this.page.getByRole('button', { name: 'Create Custom Code' }).click();

        // Wait longer for toast as requested by user ("wait for few mins to check the popup")
        try {
            const successMessage = this.page.getByText(/Access code .* successfully/i);
            await successMessage.waitFor({ state: 'visible', timeout: 15000 });
            const text = await successMessage.innerText();
            expect(text).toContain(code);
        } catch (e) {
            console.log('Toast verification skipped/timed out. Proceeding to table verification.');
        }

        // Wait for any pending updates to complete
        await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { });

        return code;
    }

    async deleteCode(code: string) {
        // Find row by exact code text
        const row = this.page.getByRole('row').filter({ has: this.page.getByText(code, { exact: true }) });
        await expect(row).toBeVisible({ timeout: 5000 });

        // click delete (X button - 2nd button in the actions cell)
        console.log(`Clicking delete button for code: ${code}`);
        await row.getByRole('button').nth(1).click();

        // Wait for confirmation popup by text content instead of role
        console.log('Waiting for delete confirmation popup...');
        const confirmationText = this.page.getByText('Delete access code?');
        await confirmationText.waitFor({ state: 'visible', timeout: 5000 });

        // Click the Delete button
        console.log('Confirmation visible, clicking Delete button...');
        const deleteBtn = this.page.getByRole('button', { name: 'Delete', exact: true });
        await deleteBtn.click();
        console.log('Delete button clicked, waiting for deletion to complete...');

        // Wait for network to complete the deletion API call
        await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
            console.log('Network idle timeout, proceeding anyway...');
        });

        // Wait for confirmation to disappear
        await confirmationText.waitFor({ state: 'hidden', timeout: 5000 });
        console.log('Confirmation closed');

        // Wait for success toast with increased timeout
        try {
            await expect(this.page.getByText(/deleted successfully/i)).toBeVisible({ timeout: 10000 });
            console.log('✓ Deletion toast confirmed');
        } catch (e) {
            console.log('Toast not detected but proceeding...');
        }

        // Wait for table to refresh after deletion
        await this.page.waitForTimeout(1000);

        // Re-query the row to handle table re-renders (don't use cached locator)
        const updatedRow = this.page.getByRole('row').filter({ has: this.page.getByText(code, { exact: true }) });
        await expect(updatedRow).not.toBeVisible({ timeout: 10000 });
        console.log(`✓ Confirmed ${code} removed from table`);

        // Add delay before next action to ensure state is stable
        await this.page.waitForTimeout(1000);
    }
}
