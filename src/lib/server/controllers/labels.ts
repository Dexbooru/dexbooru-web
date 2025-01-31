import type { Artist } from '@prisma/client';
import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { findArtistMetadata, updateArtistMetadata } from '../db/actions/artist';
import { getTagMetadata, updateTagMetadata } from '../db/actions/tag';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import logger from '../logging/logger';
import {
	GetLabelMetadataSchema,
	UpdateArtistMetadataSchema,
	UpdateTagMetadataSchema,
} from './request-schemas/labels';

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
					labelType === 'tag' ? await getTagMetadata(name) : await findArtistMetadata(name);
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
					labelType === 'tag' ? await getTagMetadata(name) : await findArtistMetadata(name);
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
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					`An unexpected error occurred while fetching the ${labelType} called ${name}.`,
				);
			}
		},
	);
};
