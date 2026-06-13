import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import {
	APPLICATION_CONFIGURATION_VARCHAR_FIELD_MAPPINGS,
	getMappedVarcharConstraint,
	type TApplicationConfiguration,
} from '$lib/shared/applicationConfiguration';

const replaceModelFieldVarcharLimit = (
	source: string,
	modelName: string,
	fieldName: string,
	newLimit: number,
) => {
	const modelPattern = new RegExp(`model\\s+${modelName}\\s+\\{[\\s\\S]*?\\n\\}`, 'm');
	const modelMatch = source.match(modelPattern);
	if (!modelMatch) return source;

	const modelBlock = modelMatch[0];
	const fieldPattern = new RegExp(`(^\\s*${fieldName}\\s+[^\\n]*@db\\.VarChar\\()(\\d+)(\\))`, 'm');
	if (!fieldPattern.test(modelBlock)) return source;

	const nextModelBlock = modelBlock.replace(
		fieldPattern,
		(_match, left, _limit, right) => `${left}${newLimit}${right}`,
	);
	return source.replace(modelBlock, nextModelBlock);
};

export const syncPrismaSchemaVarcharConstraints = async (
	configuration: TApplicationConfiguration,
	rootDirectory: string = process.cwd(),
) => {
	const updatesBySchema = new Map<string, { model: string; field: string; limit: number }[]>();

	for (const mapping of APPLICATION_CONFIGURATION_VARCHAR_FIELD_MAPPINGS) {
		const schemaPath = path.resolve(rootDirectory, mapping.schemaFile);
		const limit = getMappedVarcharConstraint(mapping, configuration);
		const currentMappings = updatesBySchema.get(schemaPath) ?? [];
		currentMappings.push({
			model: mapping.table,
			field: mapping.column,
			limit,
		});
		updatesBySchema.set(schemaPath, currentMappings);
	}

	for (const [schemaPath, mappings] of updatesBySchema.entries()) {
		const currentSource = await readFile(schemaPath, 'utf8');
		let nextSource = currentSource;

		for (const mapping of mappings) {
			nextSource = replaceModelFieldVarcharLimit(
				nextSource,
				mapping.model,
				mapping.field,
				mapping.limit,
			);
		}

		if (nextSource !== currentSource) {
			await writeFile(schemaPath, nextSource, 'utf8');
		}
	}
};
