import { buildDefaultApplicationConfiguration } from './defaults';
import { APPLICATION_CONFIGURATION_SECTIONS } from './registry';
import type {
	TApplicationConfiguration,
	TApplicationConfigurationKey,
	TApplicationConfigurationSection,
	TApplicationConfigurationSectionKey,
	TApplicationConfigurationYaml,
	TPartialApplicationConfiguration,
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
			if (typeof value !== 'number') {
				throw new Error(
					`Invalid value for "${section}.${key}". Expected a number, received ${typeof value}.`,
				);
			}
			flattened[key as TApplicationConfigurationKey] = value;
		}
	}

	return flattened;
};

export const nestApplicationConfiguration = (
	configuration: TApplicationConfiguration,
): TApplicationConfigurationSection => {
	const nested: Partial<TApplicationConfigurationSection> = {};
	for (const section of APPLICATION_CONFIGURATION_SECTIONS) {
		const sectionData: Record<string, number> = {};
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
