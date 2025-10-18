import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { UUID_REGEX } from '$lib/shared/constants/search';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import type { TFriendStatus } from '$lib/shared/types/friends';
import type { TUser } from '$lib/shared/types/users';
import { isHttpError, isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { deleteFromBucket, uploadToBucket } from '../aws/actions/s3';
import { AWS_PROFILE_PICTURE_BUCKET_NAME } from '../constants/aws';
import { SESSION_JWT_API_ENDPOINT_AGE } from '../constants/cookies';
import {
	ACCOUNT_RECOVERY_EMAIL_SUBJECT,
	DEXBOORU_NO_REPLY_EMAIL_ADDRESS,
} from '../constants/email';
import { PUBLIC_USER_SELECTORS } from '../constants/users';
import { checkIfUserIsFriended } from '../db/actions/friend';
import { findLinkedAccountsFromUserId } from '../db/actions/linkedAccount';
import {
	createPasswordRecoveryAttempt,
	deletePasswordRecoveryAttempt,
	getPasswordRecoveryAttempt,
} from '../db/actions/passwordRecoveryAttempt';
import {
	createUserPreferences,
	findUserPreferences,
	updateUserPreferences,
} from '../db/actions/preference';
import {
	checkIfUsersAreFriends,
	createUser,
	deleteUserById,
	findUserByEmail,
	findUserById,
	findUserByName,
	findUserByNameOrEmail,
	findUserSelf,
	getUserStatistics,
	updatePasswordByUserId,
	updateProfilePictureByUserId,
	updateUsernameByUserId,
	updateUserRoleById,
	updateUserRoleByUsername,
} from '../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import { buildCookieOptions } from '../helpers/cookies';
import { buildPasswordRecoveryEmailTemplate, sendEmail } from '../helpers/email';
import {
	runDefaultProfilePictureTransformationPipeline,
	runProfileImageTransformationPipeline,
} from '../helpers/images';
import { DiscordOauthProvider, GithubOauthProvider, GoogleOauthProvider } from '../helpers/oauth';
import { doPasswordsMatch, hashPassword } from '../helpers/password';
import { cacheResponse, generateEncodedUserTokenFromRecord } from '../helpers/sessions';
import {
	createTotpChallenge,
	deleteTotpChallenge,
	generateTotpDataUri,
	getTotpChallenge,
	isValidOtpCode,
} from '../helpers/totp';
import logger from '../logging/logger';
import type { TControllerHandlerVariant, TRequestSchema } from '../types/controllers';
import {
	GetUserSchema,
	UpdateUserPersonalPreferencesSchema,
	UpdateUserUserInterfacePreferencesSchema,
	User2faEnableSchema,
	UserAuthEndpointSchema,
	UserAuthFormSchema,
	UserChangePasswordSchema,
	UserChangeProfilePictureSchema,
	UserChangeUsernameSchema,
	UserCreateSchema,
	UserDeleteSchema,
	UserForgotPasswordSchema,
	UserGetPasswordRecoverySessionSchema,
	UserGetTotpSchema,
	UserOtpGenerateSchema,
	UserProcessTotpSchema,
	UserRoleUpdateSchema,
	UserUpdatePasswordAccountRecoverySchema,
} from './request-schemas/users';

export const handleGetUserSettings = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'page-server-load', {}, async (_) => {
		if (event.locals.user.id === NULLABLE_USER.id) {
			redirect(302, '/');
		}

		const linkedAccounts = await findLinkedAccountsFromUserId(event.locals.user.id, true);

		const googleAuthProvider = new GoogleOauthProvider(event);
		const discordAuthProvider = new DiscordOauthProvider(event);
		const githubAuthProvider = new GithubOauthProvider(event);

		const [googleAuthorizationUrl, discordAuthorizationUrl, githubAuthorizationUrl] =
			await Promise.all([
				googleAuthProvider.getAuthorizationUrl(),
				discordAuthProvider.getAuthorizationUrl(),
				githubAuthProvider.getAuthorizationUrl(),
			]);

		return createSuccessResponse('page-server-load', 'Successfully fetched the user settings', {
			discordAuthorizationUrl,
			githubAuthorizationUrl,
			googleAuthorizationUrl,
			linkedAccounts,
		});
	});
};

export const handlePasswordUpdateAccountRecovery = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UserUpdatePasswordAccountRecoverySchema,
		async (data) => {
			const { newPassword, confirmedNewPassword, userId, passwordRecoveryAttemptId } = data.form;

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

				const recoveryAttempt = await getPasswordRecoveryAttempt(passwordRecoveryAttemptId, {
					userId: true,
					senderIpAddress: true,
				});

				if (!recoveryAttempt) {
					return createErrorResponse(
						'form-action',
						404,
						'The password recovery session could not be found',
					);
				}

				if (recoveryAttempt.userId !== userId) {
					return createErrorResponse(
						'form-action',
						403,
						'The password recovery session is unauthorized',
					);
				}

				const clientIpAddress = event.getClientAddress();
				if (clientIpAddress !== recoveryAttempt.senderIpAddress) {
					return createErrorResponse(
						'form-action',
						403,
						'The password recovery session is unauthorized',
					);
				}

				const hashedNewPassword = await hashPassword(newPassword);
				const updatedPassword = await updatePasswordByUserId(userId, hashedNewPassword);

				if (!updatedPassword) {
					return createErrorResponse(
						'form-action',
						404,
						`A user with the id: ${userId} does not exist!`,
						{
							type: 'password',
							reason: `A user with the id: ${userId} does not exist!`,
						},
					);
				}

				deletePasswordRecoveryAttempt(passwordRecoveryAttemptId);

				return createSuccessResponse('form-action', 'The password was updated successfully', {
					message: 'The password was updated successfully',
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while updating the password',
				);
			}
		},
	);
};

export const handleGetPasswordRecoverySession = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'page-server-load',
		UserGetPasswordRecoverySessionSchema,
		async (data) => {
			const { recoveryId } = data.pathParams;

			try {
				const recoveryAttempt = await getPasswordRecoveryAttempt(recoveryId, {
					createdAt: true,
					user: {
						select: {
							email: true,
							username: true,
						},
					},
					senderIpAddress: true,
					id: true,
					userId: true,
				});
				if (!recoveryAttempt) {
					return createErrorResponse(
						'page-server-load',
						404,
						'The password recovery session could not be found',
					);
				}

				const clientIpAddress = event.getClientAddress();
				if (clientIpAddress !== recoveryAttempt.senderIpAddress) {
					return createErrorResponse(
						'page-server-load',
						403,
						'The password recovery session is unauthorized',
					);
				}

				return createSuccessResponse(
					'page-server-load',
					'Successfully fetched the password recovery session',
					{ recoveryAttempt },
				);
			} catch (error) {
				if (isHttpError(error)) throw error;

				return createErrorResponse(
					'page-server-load',
					500,
					'An unexpected error occured while trying to fetch the password recovery session',
				);
			}
		},
	);
};

export const handleSendForgotPasswordEmail = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UserForgotPasswordSchema,
		async (data) => {
			const { email } = data.form;

			try {
				const user = await findUserByEmail(email, { id: true, username: true, email: true });
				if (!user) {
					return createErrorResponse(
						'form-action',
						404,
						`A user with the email: ${email} does not exist!`,
					);
				}

				const ipAddress = event.getClientAddress();
				const newPasswordRecoveryAttempt = await createPasswordRecoveryAttempt(user.id, ipAddress);

				await sendEmail({
					sender: `Dexbooru <${DEXBOORU_NO_REPLY_EMAIL_ADDRESS}>`,
					to: user.email,
					subject: ACCOUNT_RECOVERY_EMAIL_SUBJECT,
					html: buildPasswordRecoveryEmailTemplate(user.username, newPasswordRecoveryAttempt.id),
				});

				return createSuccessResponse(
					'form-action',
					'The password recovery email was sent successfully',
				);
			} catch (error) {
				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while sending the password recovery email',
				);
			}
		},
	);
};

export const handleGetSelfData = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		{},
		async (_) => {
			try {
				const user = await findUserSelf(event.locals.user.id);
				if (!user) {
					return createErrorResponse(
						'api-route',
						404,
						`A user with the id: ${event.locals.user.id} does not exist`,
					);
				}

				return createSuccessResponse('api-route', 'Successfully fetched the user data', { user });
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to fetch the user data',
				);
			}
		},
		true,
	);
};

export const handleUpdateUserRole = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UserRoleUpdateSchema,
		async (data) => {
			const targetUsername = data.pathParams.username;
			const { newRole } = data.body;

			try {
				const user = await findUserById(event.locals.user.id, { username: true, role: true });
				if (!user) {
					return createErrorResponse(
						'api-route',
						404,
						`A user with the id: ${event.locals.user.id} does not exist`,
					);
				}

				if (user.role !== 'OWNER') {
					return createErrorResponse(
						'api-route',
						403,
						'Only imageboard owners are authorized to promote/demote user roles',
					);
				}

				if (user.username === targetUsername && newRole !== 'OWNER') {
					return createErrorResponse(
						'api-route',
						403,
						'Imageboard owners cannot demote themselves to a lower role',
					);
				}

				const updateDbFn = UUID_REGEX.test(targetUsername)
					? updateUserRoleById
					: updateUserRoleByUsername;
				const updatedUser = await updateDbFn(targetUsername, newRole);
				if (!updatedUser) {
					return createErrorResponse(
						'api-route',
						404,
						`A user with the name: ${targetUsername} does not exist`,
					);
				}

				if (newRole === 'OWNER') {
					await updateUserRoleById(event.locals.user.id, 'MODERATOR');
				}

				const filteredUser: Partial<TUser> = {
					id: updatedUser.id,
					role: updatedUser.role,
					username: updatedUser.username,
					profilePictureUrl: updatedUser.profilePictureUrl,
					superRolePromotionAt: updatedUser.superRolePromotionAt,
				};

				return createSuccessResponse(
					'api-route',
					`Successfully updated the user role of the user: ${targetUsername} to ${newRole}`,
					filteredUser,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to update the user role',
				);
			}
		},
		true,
	);
};

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

		try {
			let friendStatus: TFriendStatus = 'not-friends';

			const dbFinderFn = UUID_REGEX.test(targetUsername) ? findUserById : findUserByName;

			const targetUser = (await dbFinderFn(targetUsername, {
				...PUBLIC_USER_SELECTORS,
				updatedAt: true,
				linkedAccounts: {
					select: {
						platform: true,
						platformUsername: true,
						isPublic: true,
					},
				},
			})) as Partial<TUser>;

			if (!targetUser) {
				const errorResponse = createErrorResponse(
					handlerType,
					404,
					`A user named ${targetUsername} does not exist!`,
				);
				if (handlerType === 'page-server-load') throw errorResponse;

				return errorResponse;
			}

			if (targetUser.id !== user.id) {
				delete targetUser.email;
				delete targetUser.updatedAt;
			}

			const isSelf = event.locals.user.id === targetUser.id;
			const linkedAccounts = (targetUser.linkedAccounts ?? []).filter(
				(account) => isSelf || account.isPublic,
			);

			const friendRequestPending =
				user.id !== NULLABLE_USER.id
					? await checkIfUserIsFriended(user.id, targetUser.id ?? '')
					: false;
			if (friendRequestPending) {
				friendStatus = 'request-pending';
			} else {
				const areFriends =
					user.id !== NULLABLE_USER.id
						? await checkIfUsersAreFriends(user.id, targetUser.id ?? '')
						: false;
				if (areFriends) {
					friendStatus = 'are-friends';
				}
			}

			const userStatistics = await getUserStatistics(targetUser.id ?? '');

			return createSuccessResponse(
				handlerType,
				`Successfully fetched user profile details for ${targetUsername}`,
				{
					targetUser,
					friendStatus: (user.id !== NULLABLE_USER.id
						? friendStatus
						: 'irrelevant') as TFriendStatus,
					userStatistics,
					linkedAccounts,
				},
			);
		} catch (error) {
			return createErrorResponse(
				handlerType,
				500,
				'An unexpected error occured while trying to fetch the user profile details',
			);
		}
	});
};

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

				redirect(302, '/posts');
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

			let finalProfilePictureUrl = '';
			let finalProfilePictureBuffer: Buffer;

			if (profilePicture instanceof globalThis.File && profilePicture.size > 0) {
				finalProfilePictureBuffer = await runProfileImageTransformationPipeline(profilePicture);
			} else {
				finalProfilePictureBuffer = await runDefaultProfilePictureTransformationPipeline(username);
			}

			const profilePictureObjectUrl = await uploadToBucket(
				AWS_PROFILE_PICTURE_BUCKET_NAME,
				'profile_pictures',
				finalProfilePictureBuffer,
			);
			finalProfilePictureUrl = profilePictureObjectUrl;

			const hashedPassword = await hashPassword(password);

			const newUser = await createUser(username, email, hashedPassword, finalProfilePictureUrl);
			const encodedAuthToken = generateEncodedUserTokenFromRecord(newUser, true);
			event.cookies.set(SESSION_ID_KEY, encodedAuthToken, buildCookieOptions(true));

			await createUserPreferences(newUser.id);

			redirect(302, `/posts`);
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

				redirect(302, `/posts`);
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

export const handleUserAuthFlowForm = async (event: RequestEvent) => {
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

			const preferences = await findUserPreferences(user.id);
			if (preferences && preferences.twoFactorAuthenticationEnabled) {
				const ipAddress = event.getClientAddress();
				const newTotpChallengeId = await createTotpChallenge(user.username, ipAddress, rememberMe);
				redirect(302, `/login/totp/${newTotpChallengeId}`);
			}

			const encodedAuthToken = generateEncodedUserTokenFromRecord(user, rememberMe);
			event.cookies.set(SESSION_ID_KEY, encodedAuthToken, buildCookieOptions(rememberMe));

			redirect(302, `/posts`);
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

				const encodedAuthToken = generateEncodedUserTokenFromRecord(
					user,
					false,
					SESSION_JWT_API_ENDPOINT_AGE,
				);

				return createSuccessResponse(
					'api-route',
					'Successfully fetched access and refresh tokens for the provided user',
					{
						accessToken: encodedAuthToken,
					},
				);
			} catch (error) {
				logger.error(error);

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

				logger.info(
					`User ${event.locals.user.username} has ${twoFactorEnabled ? 'enabled' : 'disabled'} two factor authentication`,
				);

				return createSuccessResponse(
					'form-action',
					'Successfully updated thw two factor authentication settings for this user',
				);
			} catch (error) {
				logger.error(error);

				const errorMessage = 'An unexpected error occured while trying to update the OTP settings';
				return createErrorResponse('form-action', 500, errorMessage, { message: errorMessage });
			}
		},
		true,
	);
};

// export const handleExportUserData = async (event: RequestEvent) => {
// 	return await validateAndHandleRequest(
// 		event,
// 		'api-route',
// 		UserDataExportSchema,
// 		async (data) => {
// 			const {
// 				exportFriends,
// 				exportLikedPosts,
// 				exportLinkedAccounts,
// 				exportCreatedPostCollections,
// 				exportPreferences,
// 				exportUploadedPosts,
// 				sendEmail,
// 				format,
// 			} = data.body;
// 			const user = event.locals.user;

// 			try {
// 				const exportedData: TUserExportData = {
// 					user: await findUserById(user.id, PUBLIC_USER_SELECTORS),
// 					friends: exportFriends ? await findFriendsForUser(user.id) : [],
// 					likedPosts: exportLikedPosts ? await findLikedPostsByAuthorId(),
// 					linkedAccounts: [],
// 					createdPostCollections: [],
// 					preferences: {},
// 					uploadedPosts: [],
// 				};

// 			} catch (error) {
// 				logger.error(error);
// 				return createErrorResponse(
// 					'api-route',
// 					500,
// 					'An unexpected error occured while trying to export user data',
// 				);
// 			}
// 		},
// 		true,
// 	);
// };
