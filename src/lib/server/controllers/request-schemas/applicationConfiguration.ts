import type { TRequestSchema } from '$lib/server/types/controllers';
import { z } from 'zod';

const OptionalNumber = z.number().finite().positive();

const ApplicationConfigurationUpdateSchema = {
	body: z
		.object({
			maximumTagLength: OptionalNumber.optional(),
			maximumArtistLength: OptionalNumber.optional(),
			maximumTagDescriptionLength: OptionalNumber.optional(),
			maximumArtistDescriptionLength: OptionalNumber.optional(),
			maximumArtistSocialMediaLength: OptionalNumber.optional(),
			maximumArtistSocialMediasLength: OptionalNumber.optional(),
			maximumLabelsPerPage: OptionalNumber.optional(),
			maximumBlacklistedTags: OptionalNumber.optional(),
			maximumBlacklistedArtists: OptionalNumber.optional(),
			maximumSourceLinkLength: OptionalNumber.optional(),
			maximumPostsPerPage: OptionalNumber.optional(),
			maximumSimilarPostsPerPost: OptionalNumber.optional(),
			maximumTagsPerPost: OptionalNumber.optional(),
			maximumArtistsPerPost: OptionalNumber.optional(),
			maximumPostDescriptionLength: OptionalNumber.optional(),
			maximumCommentsPerPost: OptionalNumber.optional(),
			maximumDuplicatesToSearchOnPostUpload: OptionalNumber.optional(),
			maximumImagesPerPost: OptionalNumber.optional(),
			maximumPostImageUploadSizeMb: OptionalNumber.optional(),
			maximumProfilePictureImageUploadSizeMb: OptionalNumber.optional(),
			maximumCollectionThumbnailSizeMb: OptionalNumber.optional(),
			maximumCommentContentLength: OptionalNumber.optional(),
			maximumCommentsPerPage: OptionalNumber.optional(),
			maximumCollectionTitleLength: OptionalNumber.optional(),
			maximumCollectionDescriptionLength: OptionalNumber.optional(),
			maximumPostsPerCollection: OptionalNumber.optional(),
			maximumCollectionsPerPage: OptionalNumber.optional(),
			minimumUsernameLength: OptionalNumber.optional(),
			maximumUsernameLength: OptionalNumber.optional(),
			minimumPasswordLength: OptionalNumber.optional(),
			maximumPasswordLength: OptionalNumber.optional(),
			maximumSiteWideCssLength: OptionalNumber.optional(),
			maximumReportReasonDescriptionLength: OptionalNumber.optional(),
			maximumReportsPerPage: OptionalNumber.optional(),
			maximumTagsPerPage: OptionalNumber.optional(),
			maximumArtistsPerPage: OptionalNumber.optional(),
			likePostRateLimitMax: OptionalNumber.optional(),
			likePostRateLimitWindowMs: OptionalNumber.optional(),
		})
		.refine((body) => Object.keys(body).length > 0, {
			message: 'At least one configuration field must be provided.',
		}),
} satisfies TRequestSchema;

const ApplicationConfigurationGetSchema = {} satisfies TRequestSchema;

export { ApplicationConfigurationGetSchema, ApplicationConfigurationUpdateSchema };
