import { AWS_PROFILE_PICTURE_BUCKET_NAME, DEFAULT_PROFILE_PICTURE_URL } from '$env/static/private';
import {
	ACCOUNT_DELETION_CONFIRMATION_TEXT,
	EMAIL_REQUIREMENTS,
	NULLABLE_USER,
	PASSWORD_REQUIREMENTS,
	USERNAME_REQUIREMENTS,
} from '$lib/shared/constants/auth';
import { MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB } from '$lib/shared/constants/images';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { getEmailRequirements } from '$lib/shared/helpers/auth/email';
import { getPasswordRequirements } from '$lib/shared/helpers/auth/password';
import { getUsernameRequirements } from '$lib/shared/helpers/auth/username';
import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
import type { TFriendStatus } from '$lib/shared/types/friends';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { deleteFromBucket, uploadToBucket } from '../aws/actions/s3';
import { SESSION_ID_COOKIE_OPTIONS } from '../constants/cookies';
import { boolStrSchema } from '../constants/reusableSchemas';
import { SINGLE_USER_CACHE_TIME_SECONDS } from '../constants/sessions';
import { checkIfUserIsFriended } from '../db/actions/friends';
import {
	checkIfUsersAreFriends,
	createUser,
	deleteUserById,
	editPasswordByUserId,
	editProfilePictureByUserId,
	editUsernameByUserId,
	findUserById,
	findUserByName,
	findUserByNameOrEmail,
	getUserStatistics,
} from '../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	isRedirectObject,
	validateAndHandleRequest,
} from '../helpers/controllers';
import { buildCookieOptions } from '../helpers/cookies';
import { runProfileImageTransformationPipeline } from '../helpers/images';
import { doPasswordsMatch, hashPassword } from '../helpers/password';
import {
	cacheResponse,
	generateEncodedUserTokenFromRecord,
	generateUpdatedUserTokenFromClaims,
} from '../helpers/sessions';
import type { TControllerHandlerVariant, TRequestSchema } from '../types/controllers';

const usernamePasswordSchema = z.object({
	username: z.string().trim().min(1, 'The username cannot be empty'),
	password: z.string().min(1, 'The password cannot be empty'),
	rememberMe: boolStrSchema,
});

const UserOauth2SchemaEndpoint = {
	body: usernamePasswordSchema,
} satisfies TRequestSchema;

const UserOauth2SchemaForm = {
	form: usernamePasswordSchema,
} satisfies TRequestSchema;

const UserCreateSchema = {
	form: z.object({
		username: z
			.string()
			.min(1, 'The username cannot be empty')
			.refine(
				(val) => {
					const { unsatisfied: usernameUnsatisfied } = getUsernameRequirements(val);
					return usernameUnsatisfied.length === 0;
				},
				{
					message: `The username did not meet the following requirements: ${Object.values(
						USERNAME_REQUIREMENTS,
					).join(', ')}`,
				},
			),
		email: z
			.string()
			.email()
			.trim()
			.transform((val) => val.toLocaleLowerCase())
			.refine(
				(val) => {
					const { unsatisfied: emailUnsatisfied } = getEmailRequirements(val);
					return emailUnsatisfied.length === 0;
				},
				{
					message: `The email did not meet the following requirements: ${Object.values(
						EMAIL_REQUIREMENTS,
					).join(', ')}`,
				},
			),
		password: z
			.string()
			.min(1, 'The password cannot be empty')
			.refine(
				(val) => {
					const { unsatisfied: passwordUnsatisifed } = getPasswordRequirements(val);
					return passwordUnsatisifed.length === 0;
				},
				{
					message: `The password did not meet the following requirements: ${Object.values(
						PASSWORD_REQUIREMENTS,
					).join(', ')}`,
				},
			),
		confirmedPassword: z.string().min(1, 'The confirmed password cannot be empty'),
		profilePicture: z
			.instanceof(globalThis.File)
			.transform((val) => (val.size > 0 ? val : DEFAULT_PROFILE_PICTURE_URL))
			.refine(
				(val) => {
					if (typeof val === 'string') return true;

					return isFileImage(val) && isFileImageSmall(val, false);
				},
				{
					message: `The provided file was either not in an image format or exceeded the maximum allowed size for a profile picture of: ${MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB}`,
				},
			),
	}),
} satisfies TRequestSchema;

const UserDeleteSchema = {
	form: z.object({
		deletionConfirmationText: z.literal(ACCOUNT_DELETION_CONFIRMATION_TEXT),
		confirmedPassword: z.string().min(1, 'The confirmed password cannot be empty'),
	}),
} satisfies TRequestSchema;

const UserChangeProfilePictureSchema = {
	form: z.object({
		newProfilePicture: z.instanceof(globalThis.File).refine(
			(val) => {
				if (val.size === 0) return false;

				return isFileImage(val) && isFileImageSmall(val, false);
			},
			{
				message: `The provided file was either not in an image format or exceeded the maximum allowed size for a profile picture of: ${MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB}`,
			},
		),
	}),
} satisfies TRequestSchema;

const UserChangePasswordSchema = {
	form: z.object({
		oldPassword: z.string().min(1, 'The old password cannot be empty'),
		confirmedNewPassword: z.string().min(1, 'The confirmed new password cannot be empty'),
		newPassword: z
			.string()
			.min(1, 'The password cannot be empty')
			.refine(
				(val) => {
					const { unsatisfied: passwordUnsatisifed } = getPasswordRequirements(val);
					return passwordUnsatisifed.length === 0;
				},
				{
					message: `The password did not meet the following requirements: ${Object.values(
						PASSWORD_REQUIREMENTS,
					).join(', ')}`,
				},
			),
	}),
} satisfies TRequestSchema;

const UserChangeUsernameSchema = {
	form: z.object({
		newUsername: z
			.string()
			.min(1, 'The username cannot be empty')
			.refine(
				(val) => {
					const { unsatisfied: usernameUnsatisfied } = getUsernameRequirements(val);
					return usernameUnsatisfied.length === 0;
				},
				{
					message: `The username did not meet the following requirements: ${Object.values(
						USERNAME_REQUIREMENTS,
					).join(', ')}`,
				},
			),
	}),
} satisfies TRequestSchema;

const GetUserSchema = {
	pathParams: z.object({
		username: z.string().min(1, 'The username cannot be empty'),
	}),
} satisfies TRequestSchema;

export const handleGetUser = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GetUserSchema, async (data) => {
		const user = event.locals.user;
		const targetUsername = data.pathParams.username;
		let friendStatus: TFriendStatus = 'not-friends';

		const targetUser = await findUserByName(targetUsername, {
			id: true,
			username: true,
			profilePictureUrl: true,
			createdAt: true,
			...(user.id !== NULLABLE_USER.id && {
				updatedAt: true,
				email: true,
			}),
		});
		if (!targetUser) {
			const errorResponse = createErrorResponse(
				handlerType,
				404,
				`A user named ${targetUsername} does not exist!`,
			);
			if (handlerType === 'page-server-load') throw errorResponse;

			return errorResponse;
		}

		const friendRequestPending =
			user.id !== NULLABLE_USER.id ? await checkIfUserIsFriended(user.id, targetUser.id) : false;
		if (friendRequestPending) {
			friendStatus = 'request-pending';
		} else {
			const areFriends =
				user.id !== NULLABLE_USER.id ? await checkIfUsersAreFriends(user.id, targetUser.id) : false;
			if (areFriends) {
				friendStatus = 'are-friends';
			}
		}

		const userStatistics = await getUserStatistics(targetUser.id);

		if (targetUser.id !== user.id && handlerType === 'page-server-load') {
			cacheResponse(event.setHeaders, SINGLE_USER_CACHE_TIME_SECONDS);
		}

		return createSuccessResponse(
			handlerType,
			`Successfully fetched user profile details for ${targetUsername}`,
			{
				targetUser,
				friendStatus: (user.id !== NULLABLE_USER.id ? friendStatus : 'irrelevant') as TFriendStatus,
				userStatistics,
			},
		);
	});
};

export const handleChangeProfilePicture = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UserChangeProfilePictureSchema,
		async (data) => {
			const { newProfilePicture } = data.form;

			try {
				deleteFromBucket(AWS_PROFILE_PICTURE_BUCKET_NAME, event.locals.user.profilePictureUrl);

				const newProfilePictureFileBuffer = await runProfileImageTransformationPipeline(
					newProfilePicture,
				);
				const updatedProfilePictureObjectUrl = await uploadToBucket(
					AWS_PROFILE_PICTURE_BUCKET_NAME,
					'profile_pictures',
					newProfilePictureFileBuffer,
				);
				await editProfilePictureByUserId(event.locals.user.id, updatedProfilePictureObjectUrl);

				const updatedUserJwtToken = generateUpdatedUserTokenFromClaims({
					...event.locals.user,
					profilePictureUrl: updatedProfilePictureObjectUrl,
				});
				event.cookies.set(SESSION_ID_KEY, updatedUserJwtToken, SESSION_ID_COOKIE_OPTIONS);

				return createSuccessResponse(
					'form-action',
					'The profile picture was updated successfully',
					{
						message: 'The profile picture was updated successfully',
						newAuthToken: updatedUserJwtToken,
					},
				);
			} catch {
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
				const updatedPassword = await editPasswordByUserId(event.locals.user.id, hashedNewPassword);

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
			} catch {
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

				const updatedUsername = await editUsernameByUserId(event.locals.user.id, newUsername);
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

				const updatedUserJwtToken = generateUpdatedUserTokenFromClaims({
					...event.locals.user,
					username: newUsername,
				});
				event.cookies.set(SESSION_ID_KEY, updatedUserJwtToken, SESSION_ID_COOKIE_OPTIONS);

				return createSuccessResponse('form-action', 'The username was changed successfully', {
					message: 'The username was changed successfully!',
					newAuthToken: updatedUserJwtToken,
				});
			} catch {
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

export const handleDeleteUser = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UserDeleteSchema,
		async (data) => {
			const { confirmedPassword } = data.form;

			try {
				const user = await findUserById(event.locals.user.id, { password: true });
				if (!user) {
					return createErrorResponse(
						'form-action',
						404,
						`A user with the id: ${event.locals.user.id} could not be found`,
					);
				}

				const passwordsMatch = await doPasswordsMatch(confirmedPassword, user?.password);
				if (!passwordsMatch) {
					return createErrorResponse(
						'form-action',
						401,
						'The provided password does not match, so deleting the account is unauthorized',
					);
				}

				await deleteUserById(event.locals.user.id);
				event.cookies.delete(SESSION_ID_KEY, { path: '/' });

				throw redirect(302, '/');
			} catch (error) {
				if (isRedirectObject(error)) throw error;
				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while trying to delete the user',
				);
			}
		},
		true,
	);
};

export const handleCreateUser = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'form-action', UserCreateSchema, async (data) => {
		const { email, username, password, confirmedPassword, profilePicture } = data.form;

		if (password !== confirmedPassword) {
			return createErrorResponse('form-action', 400, 'Invalid registration data', {
				email,
				username,
				reason: 'The password does not match the confirmed password!',
			});
		}

		try {
			const user = await findUserByNameOrEmail(email, username);
			if (user) {
				return createErrorResponse('form-action', 409, 'Invalid registration data', {
					email,
					username,
					reason: 'An account with this username or email already exists!',
				});
			}

			let finalProfilePictureUrl = DEFAULT_PROFILE_PICTURE_URL;
			if (profilePicture instanceof globalThis.File && profilePicture.size > 0) {
				const finalProfilePictureBuffer = await runProfileImageTransformationPipeline(
					profilePicture,
				);
				const profilePictureObjectUrl = await uploadToBucket(
					AWS_PROFILE_PICTURE_BUCKET_NAME,
					'profile_pictures',
					finalProfilePictureBuffer,
				);

				finalProfilePictureUrl = profilePictureObjectUrl;
			}

			const hashedPassword = await hashPassword(password);

			const newUser = await createUser(username, email, hashedPassword, finalProfilePictureUrl);
			const encodedAuthToken = generateEncodedUserTokenFromRecord(newUser, true);
			event.cookies.set(SESSION_ID_KEY, encodedAuthToken, buildCookieOptions(true));

			throw redirect(302, `/?${SESSION_ID_KEY}=${encodedAuthToken}`);
		} catch (error) {
			if (isRedirectObject(error)) throw error;
			return createErrorResponse(
				'form-action',
				500,
				'An unexpected error occured during user account registration',
			);
		}
	});
};

export const handleUserOauth2AuthFlowForm = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UserOauth2SchemaForm,
		async (data) => {
			const { username, password, rememberMe } = data.form;
			const errorData = {
				username,
				reason: 'A user with that name does not exist or the provided password was incorrect!',
			};

			try {
				const user = await findUserByName(username);
				if (!user) {
					return createErrorResponse('form-action', 400, 'The authentication failed', errorData);
				}

				const passwordMatchConfirmed = await doPasswordsMatch(password, user.password);
				if (!passwordMatchConfirmed) {
					return createErrorResponse('form-action', 400, 'The authentication failed', errorData);
				}

				const encodedAuthToken = generateEncodedUserTokenFromRecord(user, rememberMe);
				event.cookies.set(SESSION_ID_KEY, encodedAuthToken, buildCookieOptions(rememberMe));

				throw redirect(302, `/?${SESSION_ID_KEY}=${encodedAuthToken}`);
			} catch (error) {
				if (isRedirectObject(error)) throw error;
				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while trying to authenticate',
				);
			}
		},
	);
};

export const handleUserOauth2AuthFlowEndpoint = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UserOauth2SchemaEndpoint,
		async (data) => {
			const { username, password, rememberMe } = data.body;

			try {
				const user = await findUserByName(username);
				if (!user) {
					return createErrorResponse('api-route', 404, `A user called ${username} does not exist`);
				}

				const passwordsMatch = await doPasswordsMatch(password, user.password);
				if (!passwordsMatch) {
					return createErrorResponse(
						'api-route',
						401,
						'The provided password was incorrect, so the authentication failed',
					);
				}

				const encodedAuthToken = generateEncodedUserTokenFromRecord(user, rememberMe, '1d');

				return createSuccessResponse(
					'api-route',
					'Successfully fetched access and refresh tokens for the provided user',
					{
						accessToken: encodedAuthToken,
					},
				);
			} catch {
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to authenticate',
				);
			}
		},
	);
};
