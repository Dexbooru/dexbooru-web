import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const skip = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD;
if (skip === '1' || skip === 'true') {
	process.stdout.write(
		'Skipping Playwright browser download (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD is set).\n',
	);
	process.exit(0);
}

const require = createRequire(import.meta.url);
const playwrightCli = require.resolve('@playwright/test/cli');
const result = spawnSync(process.execPath, [playwrightCli, 'install', 'chromium'], {
	stdio: 'inherit',
});

process.exit(result.status ?? 1);
