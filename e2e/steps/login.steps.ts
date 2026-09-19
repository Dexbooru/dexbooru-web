import { expect } from '@playwright/test';
import { MOCK_USER_PASSWORD } from '../credentials';
import { Given, Then, When } from '../fixtures';

Given('I am on the login page', async ({ page }) => {
	await page.goto('/login');
	await expect(page.getByRole('heading', { name: 'Login to Dexbooru!' })).toBeVisible();
});

When('I sign in as {string} with the mock password', async ({ page }, username: string) => {
	await page.getByLabel('Username').fill(username);
	await page.getByLabel('Your password').fill(MOCK_USER_PASSWORD);
	await page.getByRole('button', { name: 'Log in' }).click();
});

Then('I should be redirected away from the login page', async ({ page }) => {
	await expect(page).not.toHaveURL(/\/login(?:\?|$|#)/);
});

Then('I should see that I am signed in as {string}', async ({ page }, username: string) => {
	await expect(page.getByRole('button', { name: username })).toBeVisible();
});
