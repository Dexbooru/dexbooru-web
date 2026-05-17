export type TApplicationConfiguration = {
	id: string;
	maximumTagLength: number;
	maximumArtistLength: number;
	maximumTagDescriptionLength: number;
	maximumArtistDescriptionLength: number;
	maximumArtistSocialMediaLength: number;
	maximumArtistSocialMediasLength: number;
	maximumLabelsPerPage: number;
	maximumBlacklistedTags: number;
	maximumBlacklistedArtists: number;
	maximumSourceLinkLength: number;
	maximumPostsPerPage: number;
	maximumSimilarPostsPerPost: number;
	maximumTagsPerPost: number;
	maximumArtistsPerPost: number;
	maximumPostDescriptionLength: number;
	maximumCommentsPerPost: number;
	maximumDuplicatesToSearchOnPostUpload: number;
	maximumImagesPerPost: number;
	maximumPostImageUploadSizeMb: number;
	maximumProfilePictureImageUploadSizeMb: number;
	maximumCollectionThumbnailSizeMb: number;
	maximumCommentContentLength: number;
	maximumCommentsPerPage: number;
	maximumCollectionTitleLength: number;
	maximumCollectionDescriptionLength: number;
	maximumPostsPerCollection: number;
	maximumCollectionsPerPage: number;
	minimumUsernameLength: number;
	maximumUsernameLength: number;
	minimumPasswordLength: number;
	maximumPasswordLength: number;
	maximumSiteWideCssLength: number;
	maximumReportReasonDescriptionLength: number;
	maximumReportsPerPage: number;
	maximumTagsPerPage: number;
	maximumArtistsPerPage: number;
	likePostRateLimitMax: number;
	likePostRateLimitWindowMs: number;
	createdAt: Date;
	updatedAt: Date;
};

export type TCoreApplicationConfiguration = Omit<
	TApplicationConfiguration,
	'id' | 'createdAt' | 'updatedAt'
>;

export type TApplicationConfigurationSection = {
	labels: Pick<
		TCoreApplicationConfiguration,
		| 'maximumTagLength'
		| 'maximumArtistLength'
		| 'maximumTagDescriptionLength'
		| 'maximumArtistDescriptionLength'
		| 'maximumArtistSocialMediaLength'
		| 'maximumArtistSocialMediasLength'
		| 'maximumLabelsPerPage'
		| 'maximumBlacklistedTags'
		| 'maximumBlacklistedArtists'
	>;
	posts: Pick<
		TCoreApplicationConfiguration,
		| 'maximumSourceLinkLength'
		| 'maximumPostsPerPage'
		| 'maximumSimilarPostsPerPost'
		| 'maximumTagsPerPost'
		| 'maximumArtistsPerPost'
		| 'maximumPostDescriptionLength'
		| 'maximumCommentsPerPost'
		| 'maximumDuplicatesToSearchOnPostUpload'
	>;
	images: Pick<
		TCoreApplicationConfiguration,
		| 'maximumImagesPerPost'
		| 'maximumPostImageUploadSizeMb'
		| 'maximumProfilePictureImageUploadSizeMb'
		| 'maximumCollectionThumbnailSizeMb'
	>;
	comments: Pick<
		TCoreApplicationConfiguration,
		'maximumCommentContentLength' | 'maximumCommentsPerPage'
	>;
	collections: Pick<
		TCoreApplicationConfiguration,
		| 'maximumCollectionTitleLength'
		| 'maximumCollectionDescriptionLength'
		| 'maximumPostsPerCollection'
		| 'maximumCollectionsPerPage'
	>;
	auth: Pick<
		TCoreApplicationConfiguration,
		| 'minimumUsernameLength'
		| 'maximumUsernameLength'
		| 'minimumPasswordLength'
		| 'maximumPasswordLength'
	>;
	preferences: Pick<TCoreApplicationConfiguration, 'maximumSiteWideCssLength'>;
	reports: Pick<
		TCoreApplicationConfiguration,
		'maximumReportReasonDescriptionLength' | 'maximumReportsPerPage'
	>;
	pagination: Pick<TCoreApplicationConfiguration, 'maximumTagsPerPage' | 'maximumArtistsPerPage'>;
	rateLimit: Pick<
		TCoreApplicationConfiguration,
		'likePostRateLimitMax' | 'likePostRateLimitWindowMs'
	>;
};

export type TApplicationConfigurationSectionKey = keyof TApplicationConfigurationSection;
export type TApplicationConfigurationKey = keyof TCoreApplicationConfiguration;

export type TApplicationConfigurationYaml = {
	[K in keyof TApplicationConfigurationSection]?: Partial<TApplicationConfigurationSection[K]>;
};

export type TPartialApplicationConfiguration = Partial<TCoreApplicationConfiguration>;
