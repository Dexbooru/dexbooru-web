import { Prisma } from '$generated/prisma/client';
import {
	APPLICATION_CONFIGURATION_VARCHAR_FIELD_MAPPINGS,
	type TApplicationConfiguration,
	type TApplicationConfigurationKey,
	type TPartialApplicationConfiguration,
} from '$lib/shared/applicationConfiguration';
import prisma from '../db/prisma';

const MINIMUM_LIMITS: Partial<Record<TApplicationConfigurationKey, number>> = {
	maximumTagLength: 1,
	maximumArtistLength: 1,
	maximumTagDescriptionLength: 1,
	maximumArtistDescriptionLength: 1,
	maximumArtistSocialMediaLength: 1,
	maximumArtistSocialMediasLength: 1,
	maximumLabelsPerPage: 1,
	maximumBlacklistedTags: 1,
	maximumBlacklistedArtists: 1,
	maximumSourceLinkLength: 1,
	maximumPostsPerPage: 1,
	maximumSimilarPostsPerPost: 1,
	maximumTagsPerPost: 1,
	maximumArtistsPerPost: 1,
	maximumPostDescriptionLength: 1,
	maximumCommentsPerPost: 1,
	maximumDuplicatesToSearchOnPostUpload: 1,
	maximumImagesPerPost: 1,
	maximumPostImageUploadSizeMb: 0.1,
	maximumProfilePictureImageUploadSizeMb: 0.1,
	maximumCollectionThumbnailSizeMb: 0.1,
	maximumCommentContentLength: 1,
	maximumCommentsPerPage: 1,
	maximumCollectionTitleLength: 1,
	maximumCollectionDescriptionLength: 1,
	maximumPostsPerCollection: 1,
	maximumCollectionsPerPage: 1,
	minimumUsernameLength: 1,
	maximumUsernameLength: 1,
	minimumPasswordLength: 1,
	maximumPasswordLength: 1,
	maximumSiteWideCssLength: 1,
	maximumReportReasonDescriptionLength: 1,
	maximumReportsPerPage: 1,
	maximumTagsPerPage: 1,
	maximumArtistsPerPage: 1,
	likePostRateLimitMax: 1,
	likePostRateLimitWindowMs: 1,
};

const assertRelationalLimits = (
	updates: TPartialApplicationConfiguration,
	current: TApplicationConfiguration,
) => {
	const minimumUsernameLength = updates.minimumUsernameLength ?? current.minimumUsernameLength;
	const maximumUsernameLength = updates.maximumUsernameLength ?? current.maximumUsernameLength;
	if (minimumUsernameLength > maximumUsernameLength) {
		throw new Error('minimumUsernameLength must be less than or equal to maximumUsernameLength.');
	}

	const minimumPasswordLength = updates.minimumPasswordLength ?? current.minimumPasswordLength;
	const maximumPasswordLength = updates.maximumPasswordLength ?? current.maximumPasswordLength;
	if (minimumPasswordLength > maximumPasswordLength) {
		throw new Error('minimumPasswordLength must be less than or equal to maximumPasswordLength.');
	}
};

const assertMinimumBounds = (updates: TPartialApplicationConfiguration) => {
	for (const [key, value] of Object.entries(updates)) {
		const minimum = MINIMUM_LIMITS[key as TApplicationConfigurationKey];
		if (minimum === undefined) continue;
		if (value < minimum) {
			throw new Error(`"${key}" must be greater than or equal to ${minimum}.`);
		}
	}
};

const assertExistingUsernamesMeetMinimumLength = async (
	updates: TPartialApplicationConfiguration,
	current: TApplicationConfiguration,
) => {
	if (updates.minimumUsernameLength === undefined) return;

	const nextMinimumUsernameLength = updates.minimumUsernameLength;
	if (nextMinimumUsernameLength <= current.minimumUsernameLength) return;

	const rows = (await prisma.$queryRaw(
		Prisma.sql`
			SELECT MIN(LENGTH(REPLACE("username", ' ', '')))::INT as "minLength"
			FROM "User"
		`,
	)) as { minLength: number | null }[];

	const minLength = rows[0]?.minLength;
	if (minLength !== null && minLength !== undefined && minLength < nextMinimumUsernameLength) {
		throw new Error(
			`"User.username" has existing values of length ${minLength}, cannot raise minimum length to ${nextMinimumUsernameLength}.`,
		);
	}
};

const assertNotBelowExistingData = async (
	updates: TPartialApplicationConfiguration,
	current: TApplicationConfiguration,
) => {
	const nextConfiguration = { ...current, ...updates };

	for (const mapping of APPLICATION_CONFIGURATION_VARCHAR_FIELD_MAPPINGS) {
		const currentLimit =
			mapping.type === 'varchar' ? current[mapping.configKey] : mapping.compute(current);
		const nextLimit =
			mapping.type === 'varchar'
				? nextConfiguration[mapping.configKey]
				: mapping.compute(nextConfiguration);

		if (nextLimit >= currentLimit) continue;

		const rows = (await prisma.$queryRaw(
			Prisma.sql`
				SELECT COALESCE(MAX(LENGTH(${Prisma.raw(`"${mapping.column}"`)})), 0)::INT as "maxLength"
				FROM ${Prisma.raw(`"${mapping.table}"`)}
			`,
		)) as { maxLength: number }[];

		const maxLength = rows[0]?.maxLength ?? 0;
		if (maxLength > nextLimit) {
			throw new Error(
				`"${mapping.table}.${mapping.column}" has existing values of length ${maxLength}, cannot reduce limit to ${nextLimit}.`,
			);
		}
	}
};

export const validateApplicationConfigurationUpdate = async (
	updates: TPartialApplicationConfiguration,
	current: TApplicationConfiguration,
) => {
	assertMinimumBounds(updates);
	assertRelationalLimits(updates, current);
	await assertExistingUsernamesMeetMinimumLength(updates, current);
	await assertNotBelowExistingData(updates, current);
};
