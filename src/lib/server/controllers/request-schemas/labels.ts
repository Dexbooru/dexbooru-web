import type { TRequestSchema } from "$lib/server/types/controllers";
import { MAXIMUM_TAG_DESCRIPTION_LENGTH, MAXIMUM_ARTIST_DESCRIPTION_LENGTH, MAXIMUM_ARTIST_SOCIAL_MEDIAS_LENGTH, MAXIMUM_ARTIST_SOCIAL_MEDIA_LENGTH } from "$lib/shared/constants/labels";
import { z } from "zod";

const GetLabelMetadataSchema = {
	pathParams: z.object({
		name: z.string().min(1, 'The label name must be at least 1 character long.'),
	}),
} satisfies TRequestSchema;

const UpdateTagMetadataSchema = {
	pathParams: z.object({
		name: z.string().min(1, 'The tag name must be at least 1 character long.'),
	}),
	body: z.object({
		description: z.string().max(MAXIMUM_TAG_DESCRIPTION_LENGTH).optional(),
	}),
} satisfies TRequestSchema;

const UpdateArtistMetadataSchema = {
	pathParams: z.object({
		name: z.string().min(1, 'The artist name must be at least 1 character long.'),
	}),
	body: z.object({
		description: z.string().max(MAXIMUM_ARTIST_DESCRIPTION_LENGTH).optional(),
		socialMediaLinks: z
			.array(z.string().url())
			.max(
				MAXIMUM_ARTIST_SOCIAL_MEDIAS_LENGTH,
				`The artist can have at most ${MAXIMUM_ARTIST_SOCIAL_MEDIAS_LENGTH} social media links.`,
			)
			.refine((val) =>
				val.every((link) => link.length > 0 && link.length <= MAXIMUM_ARTIST_SOCIAL_MEDIA_LENGTH),
			)
			.optional(),
	}),
} satisfies TRequestSchema;

export { GetLabelMetadataSchema, UpdateTagMetadataSchema, UpdateArtistMetadataSchema };