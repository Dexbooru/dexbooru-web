import path from 'path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
	migrations: {
		seed: 'tsx scripts/dbSeed.ts',
		path: path.join('prisma', 'migrations'),
	},
	schema: path.join('prisma', 'schema'),
});
