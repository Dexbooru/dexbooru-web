import { DEFAULT_PROFILE_PICTURE_URL } from '$env/static/private';
import {
	ACCOUNT_DELETION_CONFIRMATION_TEXT,
	EMAIL_REQUIREMENTS,
	NULLABLE_USER,
	PASSWORD_REQUIREMENTS,
	USERNAME_REQUIREMENTS,
} from '$lib/shared/constants/auth';
import { MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB } from '$lib/shared/constants/images';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { TOTP_CODE_LENGTH } from '$lib/shared/constants/totp';
import { getEmailRequirements } from '$lib/shared/helpers/auth/email';
import { getPasswordRequirements } from '$lib/shared/helpers/auth/password';
import { getUsernameRequirements } from '$lib/shared/helpers/auth/username';
import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
import type { TFriendStatus } from '$lib/shared/types/friends';
import type { TUser } from '$lib/shared/types/users';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { deleteFromBucket, uploadToBucket } from '../aws/actions/s3';
import { AWS_PROFILE_PICTURE_BUCKET_NAME } from '../constants/aws';
import { SESSION_ID_COOKIE_OPTIONS } from '../constants/cookies';
import { boolStrSchema } from '../constants/reusableSchemas';
import { checkIfUserIsFriended } from '../db/actions/friends';
import {
	createUserPreferences,
	getUserPreferences,
	updateUserPreferences,
} from '../db/actions/preferences';
import {
	checkIfUsersAreFriends,
	createUser,
	deleteUserById,
	editPasswordByUserId,
	editProfilePictureByUserId,
	editUsernameByUserId,
	findUserByEmail,
	findUserById,
	findUserByName,
	findUserByNameOrEmail,
	getUserStatistics,
} from '../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
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
import {
	createTotpChallenge,
	deleteTotpChallenge,
	generateTotpDataUri,
	getTotpChallenge,
	isValidOtpCode,
} from '../helpers/totp';
import type { TControllerHandlerVariant, TRequestSchema } from '../types/controllers';

const usernamePasswordFormSchema = z.object({
	username: z.string().trim().min(1, 'The username cannot be empty'),
	password: z.string().min(1, 'The password cannot be empty'),
	rememberMe: boolStrSchema,
});
const usernamePasswordEndpointSchmea = z.object({
	username: z.string().trim().min(1, 'The username cannot be empty'),
	password: z.string().min(1, 'The password cannot be empty'),
});

const usernameRequirementSchema = z
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
	);

const passwordRequirementSchema = z
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
	);

const profilePictureRefinementError = {
	message: `The provided file was either not in an image format or exceeded the maximum allowed size for a profile picture of: ${MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB}`,
};

const emailRequirementSchema = z
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
	);

const UserGetTotpSchema = {
	pathParams: z.object({
		challengeId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const UserProcessTotpSchema = {
	form: z.object({
		otpCode: z.string().length(TOTP_CODE_LENGTH, {
			message: `The OTP code needs to be exactly ${TOTP_CODE_LENGTH} numeric digits long`,
		}),
		username: z.string().min(1, 'The username cannot be empty'),
		rememberMe: boolStrSchema,
	}),
	pathParams: z.object({
		challengeId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const User2faEnableSchema = {
	form: z.object({
		password: z.string().min(1, 'The password cannot be empty').optional(),
		otpCode: z
			.string()
			.length(TOTP_CODE_LENGTH, {
				message: `The OTP code needs to be exactly ${TOTP_CODE_LENGTH} numeric digits long`,
			})
			.refine((val) => {
				const parsedCode = parseInt(val);
				return !isNaN(parsedCode);
			})
			.optional(),
	}),
} satisfies TRequestSchema;

const UserOtpGenerateSchema = {
	body: z.object({
		password: z.string().min(1, 'The password cannot be empty'),
	}),
} satisfies TRequestSchema;

const UserAuthEndpointSchema = {
	body: usernamePasswordEndpointSchmea,
} satisfies TRequestSchema;

const UserAuthFormSchema = {
	form: usernamePasswordFormSchema,
} satisfies TRequestSchema;

const UserCreateSchema = {
	form: z.object({
		username: usernameRequirementSchema,
		email: emailRequirementSchema,
		password: passwordRequirementSchema,
		confirmedPassword: z.string().min(1, 'The confirmed password cannot be empty'),
		profilePicture: z
			.instanceof(globalThis.File)
			.transform((val) => (val.size > 0 ? val : DEFAULT_PROFILE_PICTURE_URL))
			.refine((val) => {
				if (typeof val === 'string') return true;

				return isFileImage(val) && isFileImageSmall(val, 'profilePicture');
			}, profilePictureRefinementError),
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
		newProfilePicture: z.instanceof(globalThis.File).refine((val) => {
			if (val.size === 0) return false;

			return isFileImage(val) && isFileImageSmall(val, 'profilePicture');
		}, profilePictureRefinementError),
	}),
} satisfies TRequestSchema;

const UserChangePasswordSchema = {
	form: z.object({
		oldPassword: z.string().min(1, 'The old password cannot be empty'),
		confirmedNewPassword: z.string().min(1, 'The confirmed new password cannot be empty'),
		newPassword: passwordRequirementSchema,
	}),
} satisfies TRequestSchema;

const UserChangeUsernameSchema = {
	form: z.object({
		newUsername: usernameRequirementSchema,
	}),
} satisfies TRequestSchema;

const GetUserSchema = {
	pathParams: z.object({
		username: z.string().min(1, 'The username cannot be empty'),
	}),
} satisfies TRequestSchema;

const UpdateUserPersonalPreferencesSchema = {
	form: z.object({
		autoBlurNsfw: boolStrSchema.optional(),
		browseInSafeMode: boolStrSchema.optional(),
		blacklistedTags: z
			.string()
			.transform((val) => val.toLocaleLowerCase().split('\n'))
			.optional(),
		blacklistedArtists: z
			.string()
			.transform((val) => val.toLocaleLowerCase().split('\n'))
			.optional(),
	}),
} satisfies TRequestSchema;

const UpdateUserUserInterfacePreferencesSchema = {
	form: z.object({
		customSiteWideCss: z.string().optional(),
		hidePostMetadataOnPreview: boolStrSchema.optional(),
		hideCollectionMetadataOnPreview: boolStrSchema.optional(),
	}),
} satisfies TRequestSchema;

export const handleUpdateUserInterfacePreferences = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UpdateUserUserInterfacePreferencesSchema,
		async (data) => {
			const { customSiteWideCss, hidePostMetadataOnPreview, hideCollectionMetadataOnPreview } =
				data.form;

			try {
				await updateUserPreferences(event.locals.user.id, {
					customSideWideCss: customSiteWideCss ?? '',
					hidePostMetadataOnPreview: hidePostMetadataOnPreview ?? false,
					hideCollectionMetadataOnPreview: hideCollectionMetadataOnPreview ?? false,
					updatedAt: new Date(),
				});

				return createSuccessResponse(
					'form-action',
					'Successfully updated the user interface preferences of the user',
				);
			} catch (error) {
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
				await updateUserPreferences(event.locals.user.id, {
					blacklistedArtists: blacklistedArtists ?? [],
					blacklistedTags: blacklistedTags ?? [],
					browseInSafeMode: browseInSafeMode ?? false,
					autoBlurNsfw: autoBlurNsfw ?? false,
				});

				return createSuccessResponse(
					'form-action',
					'Successfully updated the post preferences of the user',
				);
			} catch {
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

export const handleUserAuthFlowValidate = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		{} satisfies TRequestSchema,
		async (_) => {
			const user = event.locals.user;
			let isValidUser = true;
			let error: unknown;

			if (user.id === NULLABLE_USER.id) {
				isValidUser = false;
				error = createErrorResponse('api-route', 401, 'Invalid user');
			}

			const users = await Promise.all([
				findUserByName(user.username),
				findUserById(user.id),
				findUserByEmail(user.email),
			]);
			let dbUser: TUser | null = user;
			for (const resultUser of users) {
				if (resultUser === null || resultUser.id !== user.id) {
					dbUser = null;
				}
			}

			if (!dbUser) {
				isValidUser = false;
				error = createErrorResponse('api-route', 404, 'User does not exist');
			}

			if (!isValidUser) {
				event.cookies.delete(SESSION_ID_KEY, { path: '/' });
				return error;
			}

			return createSuccessResponse('api-route', 'The authentication token of the user is valid');
		},
		true,
	);
};

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
			...(user.id !== NULLABLE_USER.id &&
				targetUsername === user.username && {
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

				const newProfilePictureFileBuffer =
					await runProfileImageTransformationPipeline(newProfilePicture);
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

				redirect(302, '/');
			} catch (error) {
				if (isRedirect(error)) throw error;
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
				const finalProfilePictureBuffer =
					await runProfileImageTransformationPipeline(profilePicture);
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

			await createUserPreferences(newUser.id);

			redirect(302, `/?${SESSION_ID_KEY}=${encodedAuthToken}`);
		} catch (error) {
			if (isRedirect(error)) throw error;
			return createErrorResponse(
				'form-action',
				500,
				'An unexpected error occured during user account registration',
			);
		}
	});
};

export const handleProcessUserTotp = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UserProcessTotpSchema,
		async (data) => {
			const { challengeId } = data.pathParams;
			const { username, rememberMe, otpCode } = data.form;

			try {
				const totpChallenge = await getTotpChallenge(challengeId);
				if (!totpChallenge) {
					redirect(302, '/login');
				}

				const ipAddress = event.getClientAddress();
				if (ipAddress !== totpChallenge.ipAddress) {
					redirect(302, '/login');
				}

				const user = await findUserByName(username);
				if (!user) {
					redirect(302, '/login');
				}

				const isTotpCodeValid = isValidOtpCode(user.username, otpCode);
				if (!isTotpCodeValid) {
					return createErrorResponse('form-action', 401, 'The provided TOTP code was incorrect', {
						reason: 'The provided code was incorrect, please try again!',
					});
				}

				const encodedAuthToken = generateEncodedUserTokenFromRecord(user, rememberMe);
				event.cookies.set(SESSION_ID_KEY, encodedAuthToken, buildCookieOptions(rememberMe));

				deleteTotpChallenge(challengeId);

				redirect(302, `/?${SESSION_ID_KEY}=${encodedAuthToken}`);
			} catch (error) {
				if (isRedirect(error)) throw error;
				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while submitting the user OTP',
				);
			}
		},
	);
};

export const handleGetUserTotp = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'page-server-load',
		UserGetTotpSchema,
		async (data) => {
			const { challengeId } = data.pathParams;
			try {
				const challengeData = await getTotpChallenge(challengeId);
				if (!challengeData) {
					redirect(302, '/login');
				}

				const ipAddress = event.getClientAddress();
				if (ipAddress !== challengeData.ipAddress) {
					redirect(302, '/login');
				}

				return createSuccessResponse(
					'page-server-load',
					'Successfully fetched the login TOTP challenge id',
					{ challengeData },
				);
			} catch (error) {
				if (isRedirect(error)) throw error;
				throw createErrorResponse(
					'page-server-load',
					500,
					'An unexpected error occured while fetching the TOTP form',
				);
			}
		},
	);
};

export const handleUserOauth2AuthFlowForm = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'form-action', UserAuthFormSchema, async (data) => {
		const { username, password, rememberMe } = data.form;
		const errorData = {
			username,
			reason: 'A user with that name does not exist or the provided password was incorrect!',
		};

		try {
			const user = await findUserByName(username);
			if (!user) {
				return createErrorResponse('form-action', 401, 'The authentication failed', errorData);
			}

			const passwordMatchConfirmed = await doPasswordsMatch(password, user.password);
			if (!passwordMatchConfirmed) {
				return createErrorResponse('form-action', 401, 'The authentication failed', errorData);
			}

			const preferences = await getUserPreferences(user.id);
			if (preferences && preferences.twoFactorAuthenticationEnabled) {
				const ipAddress = event.getClientAddress();
				const newTotpChallengeId = await createTotpChallenge(user.username, ipAddress, rememberMe);
				redirect(302, `/login/totp/${newTotpChallengeId}`);
			}

			const encodedAuthToken = generateEncodedUserTokenFromRecord(user, rememberMe);
			event.cookies.set(SESSION_ID_KEY, encodedAuthToken, buildCookieOptions(rememberMe));

			redirect(302, `/?${SESSION_ID_KEY}=${encodedAuthToken}`);
		} catch (error) {
			if (isRedirect(error)) throw error;
			return createErrorResponse(
				'form-action',
				500,
				'An unexpected error occured while trying to authenticate',
			);
		}
	});
};

export const handleUserAuthFlowEndpoint = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UserAuthEndpointSchema,
		async (data) => {
			const { username, password } = data.body;

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

				const encodedAuthToken = generateEncodedUserTokenFromRecord(user, false, '1d');

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

export const handleGenerateUserTotpData = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UserOtpGenerateSchema,
		async (data) => {
			const { password } = data.body;

			try {
				const user = await findUserById(event.locals.user.id);
				if (!user) {
					return createErrorResponse(
						'api-route',
						404,
						`A user with the id: ${event.locals.user.id} does not exist`,
					);
				}

				const passwordsMatch = await doPasswordsMatch(password, user.password);
				if (!passwordsMatch) {
					return createErrorResponse(
						'api-route',
						401,
						`The provided password for ${user.id} was incorrect`,
					);
				}

				const totpUri = await generateTotpDataUri(user.username);

				cacheResponse(event.setHeaders, 10);

				return createSuccessResponse(
					'api-route',
					'Successfully generated TOTP data uri for the user',
					{
						totpUri,
					},
				);
			} catch (error) {
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while generating the TOTP data for the user',
				);
			}
		},
		true,
	);
};

export const handleToggleUserTwoFactorAuthentication = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		User2faEnableSchema,
		async (data) => {
			const { otpCode, password } = data.form;

			try {
				let twoFactorEnabled = false;

				if (otpCode) {
					const isValidCode = isValidOtpCode(event.locals.user.email, otpCode);
					if (!isValidCode) {
						return createErrorResponse('form-action', 401, 'Incorrect OTP code', {
							message: 'Incorrect OTP code provided',
						});
					}

					twoFactorEnabled = true;
				} else {
					const user = await findUserById(event.locals.user.id, { password: true });
					if (!user) {
						return createErrorResponse(
							'form-action',
							404,
							`The user called ${event.locals.user.username} does not exist`,
						);
					}

					const passwordsMatch = await doPasswordsMatch(password ?? '', user.password);
					if (!passwordsMatch) {
						return createErrorResponse(
							'form-action',
							401,
							`The provided password for was incorrect`,
						);
					}
				}

				await updateUserPreferences(event.locals.user.id, {
					twoFactorAuthenticationEnabled: twoFactorEnabled,
				});

				return createSuccessResponse(
					'form-action',
					'Successfully updated thw two factor authentication settings for this user',
				);
			} catch {
				const errorMessage = 'An unexpected error occured while trying to update the OTP settings';
				return createErrorResponse('form-action', 500, errorMessage, { message: errorMessage });
			}
		},
		true,
	);
};
