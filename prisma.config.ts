import "dotenv/config";

import path from 'path';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
	datasource: {
		url: env('DATABASE_URL'),
	},
	migrations: {
		seed: 'tsx scripts/dbSeed.ts',
		path: path.join('prisma', 'migrations'),
	},
	schema: path.join('prisma', 'schema'),
});
