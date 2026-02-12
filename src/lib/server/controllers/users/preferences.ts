import { updateUserPreferences } from '../../db/actions/preference';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import {
	UpdateUserUserInterfacePreferencesSchema,
	UpdateUserPersonalPreferencesSchema,
} from '../request-schemas/users';
import type { RequestEvent } from '@sveltejs/kit';

export const handleUpdateUserInterfacePreferences = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UpdateUserUserInterfacePreferencesSchema,
		async (data) => {
			const { customSiteWideCss, hidePostMetadataOnPreview, hideCollectionMetadataOnPreview } =
				data.form;

			try {
				const data = {
					customSideWideCss: customSiteWideCss ?? '',
					hidePostMetadataOnPreview: hidePostMetadataOnPreview ?? false,
					hideCollectionMetadataOnPreview: hideCollectionMetadataOnPreview ?? false,
				};
				await updateUserPreferences(event.locals.user.id, {
					...data,
					updatedAt: new Date(),
				});

				return createSuccessResponse(
					'form-action',
					'Successfully updated the user interface preferences of the user',
					{ data },
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while updating the user interface preferences of the user',
				);
			}
		},
		true,
	);
};

export const handleUpdatePostPreferences = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UpdateUserPersonalPreferencesSchema,
		async (data) => {
			const { autoBlurNsfw, browseInSafeMode, blacklistedArtists, blacklistedTags } = data.form;

			try {
				const data = {
					autoBlurNsfw: autoBlurNsfw ?? false,
					browseInSafeMode: browseInSafeMode ?? false,
					blacklistedArtists: blacklistedArtists ?? [],
					blacklistedTags: blacklistedTags ?? [],
				};
				await updateUserPreferences(event.locals.user.id, {
					...data,
					updatedAt: new Date(),
				});

				return createSuccessResponse(
					'form-action',
					'Successfully updated the post preferences of the user',
					{ data },
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while updating the post preferences of the user',
				);
			}
		},
		true,
	);
};
