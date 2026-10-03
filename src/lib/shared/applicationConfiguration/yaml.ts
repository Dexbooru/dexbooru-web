import { buildDefaultApplicationConfiguration } from './defaults';
import { APPLICATION_CONFIGURATION_SECTIONS } from './registry';
import {
	normalizeSauceNaoEnabledIndexIds,
	SAUCE_NAO_MINIMUM_SIMILARITY_LOWER_BOUND,
	SAUCE_NAO_MINIMUM_SIMILARITY_UPPER_BOUND,
} from './sauceNao';
import {
	isNumericApplicationConfigurationKey,
	type TApplicationConfiguration,
	type TApplicationConfigurationKey,
	type TApplicationConfigurationSection,
	type TApplicationConfigurationSectionKey,
	type TApplicationConfigurationYaml,
	type TNumericApplicationConfigurationKey,
	type TPartialApplicationConfiguration,
} from './types';

type TSectionConfigurationMap = {
	[K in TApplicationConfigurationSectionKey]: readonly TApplicationConfigurationKey[];
};

const SECTION_CONFIGURATION_KEYS = {
	labels: [
		'maximumTagLength',
		'maximumArtistLength',
		'maximumTagDescriptionLength',
		'maximumArtistDescriptionLength',
		'maximumArtistSocialMediaLength',
		'maximumArtistSocialMediasLength',
		'maximumLabelsPerPage',
		'maximumBlacklistedTags',
		'maximumBlacklistedArtists',
	],
	posts: [
		'maximumSourceLinkLength',
		'maximumPostsPerPage',
		'maximumSimilarPostsPerPost',
		'maximumTagsPerPost',
		'maximumArtistsPerPost',
		'maximumPostDescriptionLength',
		'maximumCommentsPerPost',
		'maximumDuplicatesToSearchOnPostUpload',
	],
	images: [
		'maximumImagesPerPost',
		'maximumPostImageUploadSizeMb',
		'maximumProfilePictureImageUploadSizeMb',
		'maximumCollectionThumbnailSizeMb',
	],
	comments: ['maximumCommentContentLength', 'maximumCommentsPerPage'],
	collections: [
		'maximumCollectionTitleLength',
		'maximumCollectionDescriptionLength',
		'maximumPostsPerCollection',
		'maximumCollectionsPerPage',
	],
	auth: [
		'minimumUsernameLength',
		'maximumUsernameLength',
		'minimumPasswordLength',
		'maximumPasswordLength',
	],
	preferences: ['maximumSiteWideCssLength'],
	reports: ['maximumReportReasonDescriptionLength', 'maximumReportsPerPage'],
	pagination: ['maximumTagsPerPage', 'maximumArtistsPerPage'],
	rateLimit: ['likePostRateLimitMax', 'likePostRateLimitWindowMs'],
	sauceNao: ['sauceNaoEnabledIndexes', 'sauceNaoMinimumSimilarity'],
} as const satisfies TSectionConfigurationMap;

const SECTION_CONFIGURATION_KEY_SETS = Object.fromEntries(
	APPLICATION_CONFIGURATION_SECTIONS.map((section) => [
		section,
		new Set<string>(SECTION_CONFIGURATION_KEYS[section]),
	]),
) as Record<TApplicationConfigurationSectionKey, Set<string>>;

const assertKnownSections = (yaml: Record<string, unknown>) => {
	for (const section of Object.keys(yaml)) {
		if (
			!APPLICATION_CONFIGURATION_SECTIONS.includes(section as TApplicationConfigurationSectionKey)
		) {
			throw new Error(`Unknown application configuration section: "${section}"`);
		}
	}
};

const assertKnownSectionKeys = (section: TApplicationConfigurationSectionKey, values: unknown) => {
	if (values === null || typeof values !== 'object' || Array.isArray(values)) {
		throw new Error(`Section "${section}" must be a key-value object.`);
	}

	for (const key of Object.keys(values as Record<string, unknown>)) {
		if (!SECTION_CONFIGURATION_KEY_SETS[section].has(key)) {
			throw new Error(`Unknown key "${key}" in application configuration section "${section}"`);
		}
	}
};

const parseNumericYamlValue = (value: unknown, path: string): number => {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new Error(`Invalid value for "${path}". Expected a number, received ${typeof value}.`);
	}
	return value;
};

const parseEnabledIndexesYamlValue = (value: unknown, path: string): number[] => {
	if (
		!Array.isArray(value) ||
		value.some((indexId) => typeof indexId !== 'number' || !Number.isInteger(indexId))
	) {
		throw new Error(`Invalid value for "${path}". Expected an array of SauceNAO index ids.`);
	}
	return normalizeSauceNaoEnabledIndexIds(value);
};

const parseMinimumSimilarityYamlValue = (value: unknown, path: string): number => {
	const parsed = parseNumericYamlValue(value, path);
	if (
		parsed < SAUCE_NAO_MINIMUM_SIMILARITY_LOWER_BOUND ||
		parsed > SAUCE_NAO_MINIMUM_SIMILARITY_UPPER_BOUND
	) {
		throw new Error(`"${path}" must be between 1 and 100.`);
	}
	return parsed;
};

const NUMERIC_YAML_FIELD_PARSERS: Partial<
	Record<TNumericApplicationConfigurationKey, (value: unknown, path: string) => number>
> = {
	sauceNaoMinimumSimilarity: parseMinimumSimilarityYamlValue,
};

const parseYamlField = (
	key: TNumericApplicationConfigurationKey,
	value: unknown,
	path: string,
): number => {
	const parser = NUMERIC_YAML_FIELD_PARSERS[key];
	if (parser) return parser(value, path);
	return parseNumericYamlValue(value, path);
};

export const flattenApplicationConfigurationYaml = (
	yaml: TApplicationConfigurationYaml,
): TPartialApplicationConfiguration => {
	const flattened: TPartialApplicationConfiguration = {};
	const yamlAsRecord = yaml as unknown as Record<string, unknown>;
	assertKnownSections(yamlAsRecord);

	for (const section of APPLICATION_CONFIGURATION_SECTIONS) {
		const sectionValue = yaml[section];
		if (!sectionValue) continue;
		assertKnownSectionKeys(section, sectionValue);

		for (const [key, value] of Object.entries(sectionValue)) {
			const configurationKey = key as TApplicationConfigurationKey;
			const path = `${section}.${key}`;
			if (!isNumericApplicationConfigurationKey(configurationKey)) {
				flattened[configurationKey] = parseEnabledIndexesYamlValue(value, path);
				continue;
			}
			flattened[configurationKey] = parseYamlField(configurationKey, value, path);
		}
	}

	return flattened;
};

export const nestApplicationConfiguration = (
	configuration: TApplicationConfiguration,
): TApplicationConfigurationSection => {
	const nested: Partial<TApplicationConfigurationSection> = {};
	for (const section of APPLICATION_CONFIGURATION_SECTIONS) {
		const sectionData: Record<string, number | number[]> = {};
		for (const key of SECTION_CONFIGURATION_KEYS[section]) {
			sectionData[key] = configuration[key];
		}
		nested[section] = sectionData as never;
	}
	return nested as TApplicationConfigurationSection;
};

export const withDefaultConfiguration = (
	configuration: TPartialApplicationConfiguration,
): TApplicationConfiguration => {
	return {
		...buildDefaultApplicationConfiguration(),
		...configuration,
	};
};
