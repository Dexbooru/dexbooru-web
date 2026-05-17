import "dotenv/config";

import path from 'path';
import { defineConfig, env } from 'prisma/config';

// GITHUB_ACTIONS is set to "true" on every GitHub Actions runner (no workflow env needed).
const prismaGenerateOnlyDatabaseUrl = 'postgresql://unused:unused@127.0.0.1:5432/unused';

function resolveDatabaseUrl(): string {
	if (process.env.DATABASE_URL) {
		return process.env.DATABASE_URL;
	}
	if (process.env.GITHUB_ACTIONS === 'true') {
		return prismaGenerateOnlyDatabaseUrl;
	}
	return env('DATABASE_URL');
}

export default defineConfig({
	datasource: {
		url: resolveDatabaseUrl(),
	},
	migrations: {
		seed: 'tsx scripts/dbSeed.ts',
		path: path.join('prisma', 'migrations'),
	},
	schema: path.join('prisma', 'schema'),
});
