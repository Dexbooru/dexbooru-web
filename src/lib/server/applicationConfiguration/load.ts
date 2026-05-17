import {
	buildDefaultApplicationConfiguration,
	flattenApplicationConfigurationYaml,
	type TApplicationConfiguration,
	type TApplicationConfigurationYaml,
	type TPartialApplicationConfiguration,
} from '$lib/shared/applicationConfiguration';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { DEFAULT_APPLICATION_CONFIGURATION_YAML_PATH } from '../constants/applicationConfiguration';
import logger from '../logging/logger';
import { getOrCreateApplicationConfiguration } from '../db/actions/applicationConfiguration';
import { parse } from 'yaml';

export const resolveApplicationConfigurationYamlPath = () => {
	const yamlPath = process.env.APPLICATION_CONFIGURATION_YAML_PATH?.trim();
	const finalPath =
		yamlPath && yamlPath.length > 0 ? yamlPath : DEFAULT_APPLICATION_CONFIGURATION_YAML_PATH;
	return path.isAbsolute(finalPath) ? finalPath : path.resolve(process.cwd(), finalPath);
};

export const loadApplicationConfigurationYamlOverrides =
	async (): Promise<TPartialApplicationConfiguration> => {
		const resolvedPath = resolveApplicationConfigurationYamlPath();
		if (!existsSync(resolvedPath)) return {};

		const yamlString = await readFile(resolvedPath, 'utf8');
		if (!yamlString.trim()) return {};

		const parsedYaml = parse(yamlString) as TApplicationConfigurationYaml;
		return flattenApplicationConfigurationYaml(parsedYaml);
	};

export const loadApplicationConfiguration = async (): Promise<TApplicationConfiguration> => {
	const dbConfiguration = await getOrCreateApplicationConfiguration();
	const defaults = buildDefaultApplicationConfiguration();

	try {
		const yamlOverrides = await loadApplicationConfigurationYamlOverrides();
		return {
			...defaults,
			...dbConfiguration,
			...yamlOverrides,
		};
	} catch (error) {
		logger.error('Failed to load YAML application configuration overrides.', error);
		return {
			...defaults,
			...dbConfiguration,
		};
	}
};
