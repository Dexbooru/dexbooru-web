import type { TApplicationConfiguration, TCoreApplicationConfiguration } from './types';

export const APPLICATION_CONFIGURATION_SINGLETON_ID = 'singleton';

export const APPLICATION_CONFIGURATION_DEFAULTS: TCoreApplicationConfiguration = {
	maximumTagLength: 75,
	maximumArtistLength: 75,
	maximumTagDescriptionLength: 200,
	maximumArtistDescriptionLength: 200,
	maximumArtistSocialMediaLength: 450,
	maximumArtistSocialMediasLength: 5,
	maximumLabelsPerPage: 100,
	maximumBlacklistedTags: 50,
	maximumBlacklistedArtists: 50,
	maximumSourceLinkLength: 450,
	maximumPostsPerPage: 27,
	maximumSimilarPostsPerPost: 6,
	maximumTagsPerPost: 20,
	maximumArtistsPerPost: 5,
	maximumPostDescriptionLength: 500,
	maximumCommentsPerPost: 100,
	maximumDuplicatesToSearchOnPostUpload: 2,
	maximumImagesPerPost: 3,
	maximumPostImageUploadSizeMb: 3.5,
	maximumProfilePictureImageUploadSizeMb: 1.75,
	maximumCollectionThumbnailSizeMb: 3.5,
	maximumCommentContentLength: 1500,
	maximumCommentsPerPage: 35,
	maximumCollectionTitleLength: 100,
	maximumCollectionDescriptionLength: 250,
	maximumPostsPerCollection: 15,
	maximumCollectionsPerPage: 28,
	minimumUsernameLength: 4,
	maximumUsernameLength: 12,
	minimumPasswordLength: 8,
	maximumPasswordLength: 50,
	maximumSiteWideCssLength: 1000,
	maximumReportReasonDescriptionLength: 250,
	maximumReportsPerPage: 30,
	maximumTagsPerPage: 100,
	maximumArtistsPerPage: 100,
	likePostRateLimitMax: 10,
	likePostRateLimitWindowMs: 60000,
};

export const buildDefaultApplicationConfiguration = (): TApplicationConfiguration => {
	const now = new Date();
	return {
		id: APPLICATION_CONFIGURATION_SINGLETON_ID,
		...APPLICATION_CONFIGURATION_DEFAULTS,
		createdAt: now,
		updatedAt: now,
	};
};
