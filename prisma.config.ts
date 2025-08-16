import path from 'path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
	migrations: {
		seed: 'tsx scripts/dbSeed.ts',
	},
	schema: path.join('prisma', 'schema'),
});
