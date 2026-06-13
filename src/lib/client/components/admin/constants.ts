import type { TSection } from './types';

export const INSTANCE_CONFIGURATION_SECTIONS: TSection[] = [
	{
		name: 'Labels',
		fields: [
			{ key: 'maximumTagLength', label: 'Maximum tag length' },
			{ key: 'maximumArtistLength', label: 'Maximum artist length' },
			{ key: 'maximumTagDescriptionLength', label: 'Maximum tag description length' },
			{ key: 'maximumArtistDescriptionLength', label: 'Maximum artist description length' },
			{ key: 'maximumArtistSocialMediaLength', label: 'Maximum artist social media length' },
			{
				key: 'maximumArtistSocialMediasLength',
				label: 'Maximum artist social medias per artist',
			},
			{ key: 'maximumLabelsPerPage', label: 'Maximum labels per page' },
			{ key: 'maximumBlacklistedTags', label: 'Maximum blacklisted tags' },
			{ key: 'maximumBlacklistedArtists', label: 'Maximum blacklisted artists' },
		],
	},
	{
		name: 'Posts',
		fields: [
			{ key: 'maximumSourceLinkLength', label: 'Maximum source link length' },
			{ key: 'maximumPostsPerPage', label: 'Maximum posts per page' },
			{ key: 'maximumSimilarPostsPerPost', label: 'Maximum similar posts per post' },
			{ key: 'maximumTagsPerPost', label: 'Maximum tags per post' },
			{ key: 'maximumArtistsPerPost', label: 'Maximum artists per post' },
			{ key: 'maximumPostDescriptionLength', label: 'Maximum post description length' },
			{ key: 'maximumCommentsPerPost', label: 'Maximum comments per post' },
			{
				key: 'maximumDuplicatesToSearchOnPostUpload',
				label: 'Maximum duplicate checks on upload',
			},
		],
	},
	{
		name: 'Images',
		fields: [
			{ key: 'maximumImagesPerPost', label: 'Maximum images per post' },
			{
				key: 'maximumPostImageUploadSizeMb',
				label: 'Maximum post image upload size (MB)',
				step: 0.1,
			},
			{
				key: 'maximumProfilePictureImageUploadSizeMb',
				label: 'Maximum profile picture size (MB)',
				step: 0.1,
			},
			{
				key: 'maximumCollectionThumbnailSizeMb',
				label: 'Maximum collection thumbnail size (MB)',
				step: 0.1,
			},
		],
	},
	{
		name: 'Comments',
		fields: [
			{ key: 'maximumCommentContentLength', label: 'Maximum comment content length' },
			{ key: 'maximumCommentsPerPage', label: 'Maximum comments per page' },
		],
	},
	{
		name: 'Collections',
		fields: [
			{ key: 'maximumCollectionTitleLength', label: 'Maximum collection title length' },
			{
				key: 'maximumCollectionDescriptionLength',
				label: 'Maximum collection description length',
			},
			{ key: 'maximumPostsPerCollection', label: 'Maximum posts per collection' },
			{ key: 'maximumCollectionsPerPage', label: 'Maximum collections per page' },
		],
	},
	{
		name: 'Authentication',
		fields: [
			{ key: 'minimumUsernameLength', label: 'Minimum username length' },
			{ key: 'maximumUsernameLength', label: 'Maximum username length' },
			{ key: 'minimumPasswordLength', label: 'Minimum password length' },
			{ key: 'maximumPasswordLength', label: 'Maximum password length' },
		],
	},
	{
		name: 'Preferences, reports and pagination',
		tabLabel: 'Preferences',
		fields: [
			{ key: 'maximumSiteWideCssLength', label: 'Maximum site-wide CSS length' },
			{
				key: 'maximumReportReasonDescriptionLength',
				label: 'Maximum report reason description length',
			},
			{ key: 'maximumReportsPerPage', label: 'Maximum reports per page' },
			{ key: 'maximumTagsPerPage', label: 'Maximum tags per page' },
			{ key: 'maximumArtistsPerPage', label: 'Maximum artists per page' },
		],
	},
	{
		name: 'Rate limit',
		fields: [
			{ key: 'likePostRateLimitMax', label: 'Like post rate limit max' },
			{
				key: 'likePostRateLimitWindowMs',
				label: 'Like post rate limit window (ms)',
			},
		],
	},
];
