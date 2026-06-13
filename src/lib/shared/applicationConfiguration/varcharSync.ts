import {
	APPLICATION_CONFIGURATION_VARCHAR_FIELD_MAPPINGS,
	getMappedVarcharConstraint,
	type TConfigurationSchemaFieldMapping,
} from './registry';
import type {
	TApplicationConfiguration,
	TApplicationConfigurationKey,
	TPartialApplicationConfiguration,
} from './types';

export const SEARCHABLE_DEPENDENT_CONFIG_KEYS = new Set<TApplicationConfigurationKey>([
	'maximumUsernameLength',
	'maximumTagLength',
	'maximumArtistLength',
	'maximumPostDescriptionLength',
	'maximumCollectionTitleLength',
	'maximumCollectionDescriptionLength',
]);

export const SEARCHABLE_DEPENDENT_COLUMNS: Record<string, readonly string[]> = {
	User: ['username'],
	Post: ['description'],
	Tag: ['name'],
	Artist: ['name'],
	PostCollection: ['title', 'description'],
};

export const SEARCHABLE_SYNC_TABLE_LABELS: Record<string, string> = {
	User: 'user search',
	Tag: 'tag search',
	Artist: 'artist search',
	Post: 'post search',
	PostCollection: 'collection search',
};

const COMPUTED_VARCHAR_ADDITIONAL_TRIGGER_KEYS: Partial<
	Record<TApplicationConfigurationKey, readonly TApplicationConfigurationKey[]>
> = {
	maximumTagsPerPost: ['maximumTagLength'],
	maximumArtistsPerPost: ['maximumArtistLength'],
};

export const getMappingTriggerKeys = (
	mapping: TConfigurationSchemaFieldMapping,
): TApplicationConfigurationKey[] => {
	if (mapping.type === 'varchar') {
		return [mapping.configKey];
	}

	const additionalKeys = COMPUTED_VARCHAR_ADDITIONAL_TRIGGER_KEYS[mapping.configKey] ?? [];
	return [mapping.configKey, ...additionalKeys];
};

export const mappingIsAffectedByUpdates = (
	mapping: TConfigurationSchemaFieldMapping,
	updateKeys: ReadonlySet<string>,
) => {
	return getMappingTriggerKeys(mapping).some((key) => updateKeys.has(key));
};

export const getChangedVarcharMappings = (
	updates: TPartialApplicationConfiguration,
	previousConfiguration: TApplicationConfiguration,
	nextConfiguration: TApplicationConfiguration,
): TConfigurationSchemaFieldMapping[] => {
	const updateKeys = new Set(Object.keys(updates));
	if (updateKeys.size === 0) {
		return [];
	}

	return APPLICATION_CONFIGURATION_VARCHAR_FIELD_MAPPINGS.filter((mapping) => {
		if (!mappingIsAffectedByUpdates(mapping, updateKeys)) {
			return false;
		}

		const previousLimit = getMappedVarcharConstraint(mapping, previousConfiguration);
		const nextLimit = getMappedVarcharConstraint(mapping, nextConfiguration);
		return previousLimit !== nextLimit;
	});
};

export type TSearchableSyncImpact = {
	configKeys: TApplicationConfigurationKey[];
	tables: string[];
};

export const getSearchableSyncImpact = (
	changedMappings: TConfigurationSchemaFieldMapping[],
): TSearchableSyncImpact | null => {
	const tables = new Set<string>();
	const configKeys = new Set<TApplicationConfigurationKey>();

	for (const mapping of changedMappings) {
		const dependentColumns = SEARCHABLE_DEPENDENT_COLUMNS[mapping.table];
		if (!dependentColumns?.includes(mapping.column)) {
			continue;
		}

		tables.add(mapping.table);
		for (const triggerKey of getMappingTriggerKeys(mapping)) {
			if (SEARCHABLE_DEPENDENT_CONFIG_KEYS.has(triggerKey)) {
				configKeys.add(triggerKey);
			}
		}
	}

	if (tables.size === 0) {
		return null;
	}

	return {
		configKeys: [...configKeys],
		tables: [...tables],
	};
};

export const getSearchableSyncImpactFromUpdates = (
	updates: TPartialApplicationConfiguration,
	previousConfiguration: TApplicationConfiguration,
	nextConfiguration: TApplicationConfiguration,
): TSearchableSyncImpact | null => {
	const changedMappings = getChangedVarcharMappings(
		updates,
		previousConfiguration,
		nextConfiguration,
	);
	return getSearchableSyncImpact(changedMappings);
};

export const buildSearchableSyncWarningMessage = (
	impact: TSearchableSyncImpact,
	configKeyLabels: Partial<Record<TApplicationConfigurationKey, string>> = {},
): string => {
	const settingLabels =
		impact.configKeys.length > 0
			? impact.configKeys.map((key) => configKeyLabels[key] ?? key).join(', ')
			: 'the selected limits';
	const tableLabels = impact.tables
		.map((table) => SEARCHABLE_SYNC_TABLE_LABELS[table] ?? table)
		.join(', ');

	return `Changing ${settingLabels} will rebuild full-text search indexes for ${tableLabels}. This may take several minutes on large instances and can temporarily slow search.`;
};
