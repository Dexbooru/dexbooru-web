import {
	findUserById,
	findUserByName,
	updatePasswordByUserId,
	updateProfilePictureByUserId,
	updateUsernameByUserId,
} from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { deleteFromBucket, uploadToBucket } from '../../aws/actions/s3';
import { AWS_PROFILE_PICTURE_BUCKET_NAME } from '../../constants/aws';
import {
	runDefaultProfilePictureTransformationPipeline,
	runProfileImageTransformationPipeline,
} from '../../helpers/images';
import { doPasswordsMatch, hashPassword } from '../../helpers/password';
import logger from '../../logging/logger';
import {
	UserChangeProfilePictureSchema,
	UserChangePasswordSchema,
	UserChangeUsernameSchema,
} from '../request-schemas/users';
import type { RequestEvent } from '@sveltejs/kit';

export const handleChangeProfilePicture = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UserChangeProfilePictureSchema,
		async (data) => {
			const { newProfilePicture, removeProfilePicture } = data.form;
			const userId = event.locals.user.id;

			if (!removeProfilePicture && newProfilePicture.size === 0) {
				return createErrorResponse(
					'form-action',
					400,
					'No new profile picture was provided to update the user profile picture',
				);
			}

			try {
				const user = await findUserById(userId, { profilePictureUrl: true, username: true });
				if (!user) {
					return createErrorResponse(
						'form-action',
						404,
						`A user with the id: ${userId} does not exist!`,
						{
							type: 'profilePicture',
							reason: `A user with the id: ${userId} does not exist!`,
						},
					);
				}

				if (typeof user.profilePictureUrl === 'string' && user.profilePictureUrl.length > 0) {
					deleteFromBucket(AWS_PROFILE_PICTURE_BUCKET_NAME, user.profilePictureUrl);
				}

				const newProfilePictureFileBuffer = removeProfilePicture
					? await runDefaultProfilePictureTransformationPipeline(user.username)
					: await runProfileImageTransformationPipeline(newProfilePicture);
				const updatedProfilePictureObjectUrl = await uploadToBucket(
					AWS_PROFILE_PICTURE_BUCKET_NAME,
					'profile_pictures',
					newProfilePictureFileBuffer,
				);
				await updateProfilePictureByUserId(userId, updatedProfilePictureObjectUrl);

				return createSuccessResponse(
					'form-action',
					'The profile picture was updated successfully',
					{
						message: 'The profile picture was updated successfully',
						data: {
							profilePictureUrl: updatedProfilePictureObjectUrl,
						},
					},
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while changing the profile picture',
				);
			}
		},
		true,
	);
};

export const handleChangePassword = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UserChangePasswordSchema,
		async (data) => {
			const { oldPassword, newPassword, confirmedNewPassword } = data.form;

			try {
				if (newPassword !== confirmedNewPassword) {
					return createErrorResponse(
						'form-action',
						400,
						'The new password does not match the confirmed new password',
						{
							type: 'password',
							reason: 'The new password does not match the confirmed new password!',
						},
					);
				}

				const user = await findUserById(event.locals.user.id, { password: true });
				if (!user) {
					return createErrorResponse(
						'form-action',
						404,
						`A user with the id: ${event.locals.user.id} does not exist!`,
						{
							type: 'password',
							reason: `A user with the id: ${event.locals.user.id} does not exist!`,
						},
					);
				}

				if (!doPasswordsMatch(oldPassword, user.password)) {
					return createErrorResponse(
						'form-action',
						401,
						'The old password does not match the current password',
						{
							type: 'password',
							reason: 'The old password does not match the actual password!',
						},
					);
				}

				const hashedNewPassword = await hashPassword(newPassword);
				const updatedPassword = await updatePasswordByUserId(
					event.locals.user.id,
					hashedNewPassword,
				);

				if (!updatedPassword) {
					return createErrorResponse(
						'form-action',
						404,
						`A user with the id: ${event.locals.user.id} does not exist!`,
						{
							type: 'password',
							reason: `A user with the id: ${event.locals.user.id} does not exist!`,
						},
					);
				}

				return createSuccessResponse('form-action', 'The password was updated successfully', {
					message: 'The password was updated successfully',
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while changing the password',
				);
			}
		},
		true,
	);
};

export const handleChangeUsername = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UserChangeUsernameSchema,
		async (data) => {
			const { newUsername } = data.form;

			try {
				const existingUser = await findUserByName(newUsername);
				if (existingUser) {
					return createErrorResponse(
						'form-action',
						409,
						`A user with the name: ${newUsername} already exists!`,
						{
							newUsername,
							type: 'username',
							reason: `A user with the name: ${newUsername} already exists!`,
						},
					);
				}

				const updatedUsername = await updateUsernameByUserId(event.locals.user.id, newUsername);
				if (!updatedUsername) {
					return createErrorResponse(
						'form-action',
						404,
						`A user with the id: ${event.locals.user.id} does not exist!`,
						{
							newUsername,
							type: 'username',
							reason: `A user with the id: ${event.locals.user.id} does not exist!`,
						},
					);
				}

				return createSuccessResponse('form-action', 'The username was changed successfully', {
					message: 'The username was changed successfully!',
					data: {
						username: newUsername,
					},
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while changing the username',
				);
			}
		},
		true,
	);
};
