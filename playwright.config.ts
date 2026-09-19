import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
	features: 'e2e/features/**/*.feature',
	steps: 'e2e/steps/**/*.ts',
	outputDir: '.features-gen',
	quotes: 'single',
});

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
	testDir,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		viewport: { width: 1280, height: 720 },
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'pnpm dev',
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
