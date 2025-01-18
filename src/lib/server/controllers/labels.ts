import {
	MAXIMUM_ARTIST_DESCRIPTION_LENGTH,
	MAXIMUM_ARTIST_SOCIAL_MEDIA_LENGTH,
	MAXIMUM_ARTIST_SOCIAL_MEDIAS_LENGTH,
	MAXIMUM_TAG_DESCRIPTION_LENGTH,
} from '$lib/shared/constants/labels';
import type { Artist } from '@prisma/client';
import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getArtistMetadata, updateArtistMetadata } from '../db/actions/artist';
import { getTagMetadata, updateTagMetadata } from '../db/actions/tag';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import type { TRequestSchema } from '../types/controllers';

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

export const handleUpdateLabelMetadata = async (
	event: RequestEvent,
	labelType: 'tag' | 'artist',
) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		labelType === 'tag' ? UpdateTagMetadataSchema : UpdateArtistMetadataSchema,
		async (data) => {
			const { name } = data.pathParams;
			const { description, socialMediaLinks } = data.body as z.infer<
				typeof UpdateTagMetadataSchema.body & typeof UpdateArtistMetadataSchema.body
			>;

			try {
				const labelResource =
					labelType === 'tag' ? await getTagMetadata(name) : await getArtistMetadata(name);
				if (!labelResource) {
					return createErrorResponse(
						'api-route',
						404,
						`The ${labelType} called ${name} does not exist!`,
					);
				}

				if (socialMediaLinks !== undefined && labelType === 'artist') {
					const currentSocialMediaLinks = (labelResource as Artist).socialMediaLinks;
					const uniqueSocialMediaLinks = [...new Set(socialMediaLinks)];
					if (uniqueSocialMediaLinks.length !== socialMediaLinks.length) {
						return createErrorResponse(
							'api-route',
							400,
							'The social media links for an artist must be unique!',
						);
					}
					if (socialMediaLinks.some((link) => currentSocialMediaLinks.includes(link))) {
						return createErrorResponse(
							'api-route',
							400,
							'The artist already has some of the social media links you provided!',
						);
					}
				}

				const updatedLabelResource =
					labelType === 'tag'
						? await updateTagMetadata(name, description ?? null)
						: await updateArtistMetadata(name, description ?? null, socialMediaLinks ?? []);
				return createSuccessResponse(
					'api-route',
					`Successfully updated ${labelType} called ${name}`,
					updatedLabelResource,
				);
			} catch (error) {
				return createErrorResponse(
					'api-route',
					500,
					`An unexpected error occurred while updating the ${labelType} called ${name}.`,
				);
			}
		},
		true,
	);
};

export const handleGetLabelMetadata = async (event: RequestEvent, labelType: 'tag' | 'artist') => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetLabelMetadataSchema,
		async (data) => {
			const { name } = data.pathParams;

			try {
				const labelResource =
					labelType === 'tag' ? await getTagMetadata(name) : await getArtistMetadata(name);
				if (!labelResource) {
					return createErrorResponse(
						'api-route',
						404,
						`The ${labelType} called ${name} does not exist!`,
					);
				}

				return createSuccessResponse(
					'api-route',
					`Successfully fetched ${labelType} called ${name}`,
					labelResource,
				);
			} catch {
				return createErrorResponse(
					'api-route',
					500,
					`An unexpected error occurred while fetching the ${labelType} called ${name}.`,
				);
			}
		},
	);
};
