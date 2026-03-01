import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import type { SerializeOptions } from 'cookie';
import { uploadToBucket } from '../../aws/actions/s3';
import { AWS_PROFILE_PICTURE_BUCKET_NAME } from '../../constants/aws';
import { createEmailVerificationToken } from '../../db/actions/emailVerification';
import {
	createUser,
	deleteUserById,
	findUserById,
	findUserByNameOrEmail,
} from '../../db/actions/user';
import { createUserPreferences } from '../../db/actions/preference';
import { createErrorResponse, validateAndHandleRequest } from '../../helpers/controllers';
import { buildCookieOptions } from '../../helpers/cookies';
import {
	runDefaultProfilePictureTransformationPipeline,
	runProfileImageTransformationPipeline,
} from '../../helpers/images';
import { doPasswordsMatch, hashPassword } from '../../helpers/password';
import { generateEncodedUserTokenFromRecord } from '../../helpers/sessions';
import logger from '../../logging/logger';
import {
	DEXBOORU_NO_REPLY_EMAIL_ADDRESS,
	DEXBOORU_SUPPORT_DISPLAY_NAME,
	EMAIL_VERIFICATION_SUBJECT,
} from '../../constants/email';
import { buildEmailVerificationTemplate, sendEmail } from '../../helpers/email';
import { UserDeleteSchema, UserCreateSchema } from '../request-schemas/users';

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
	logger.info('Registration request received');

	return await validateAndHandleRequest(event, 'form-action', UserCreateSchema, async (data) => {
		const { email, username, password, confirmedPassword, profilePicture } = data.form;

		if (password !== confirmedPassword) {
			logger.warn('Registration failed: password mismatch', { username, email });
			return createErrorResponse('form-action', 400, 'Invalid registration data', {
				email,
				username,
				reason: 'The password does not match the confirmed password!',
			});
		}

		try {
			logger.info('Checking for existing user', { username, email });
			const user = await findUserByNameOrEmail(email, username);
			if (user) {
				logger.warn('Registration failed: username or email already exists', {
					username,
					email,
				});
				return createErrorResponse('form-action', 409, 'Invalid registration data', {
					email,
					username,
					reason: 'An account with this username or email already exists!',
				});
			}

			let finalProfilePictureUrl = '';
			let finalProfilePictureBuffer: Buffer;

			if (profilePicture instanceof globalThis.File && profilePicture.size > 0) {
				logger.info('Processing custom profile picture', { username });
				finalProfilePictureBuffer = await runProfileImageTransformationPipeline(profilePicture);
			} else {
				logger.info('Generating default profile picture', { username });
				finalProfilePictureBuffer = await runDefaultProfilePictureTransformationPipeline(username);
			}

			logger.info('Uploading profile picture to S3', { username });
			const profilePictureObjectUrl = await uploadToBucket(
				AWS_PROFILE_PICTURE_BUCKET_NAME,
				'profile_pictures',
				finalProfilePictureBuffer,
			);
			finalProfilePictureUrl = profilePictureObjectUrl;

			logger.info('Creating user account', { username, email });
			const hashedPassword = await hashPassword(password);

			const newUser = await createUser(username, email, hashedPassword, finalProfilePictureUrl);
			logger.info('User created successfully', { userId: newUser.id, username: newUser.username });

			const encodedAuthToken = generateEncodedUserTokenFromRecord(newUser, true);
			event.cookies.set(
				SESSION_ID_KEY,
				encodedAuthToken,
				buildCookieOptions(true) as SerializeOptions & { path: string },
			);

			logger.info('Creating user preferences', { userId: newUser.id });
			await createUserPreferences(newUser.id);

			try {
				logger.info('Sending verification email', { userId: newUser.id, email: newUser.email });
				const verificationToken = await createEmailVerificationToken(newUser.id);
				await sendEmail({
					from: {
						name: DEXBOORU_SUPPORT_DISPLAY_NAME,
						address: DEXBOORU_NO_REPLY_EMAIL_ADDRESS,
					},
					to: newUser.email,
					subject: EMAIL_VERIFICATION_SUBJECT,
					html: buildEmailVerificationTemplate(newUser.username, verificationToken.id),
				});
				logger.info('Verification email sent successfully', { userId: newUser.id });
			} catch (emailError) {
				logger.error('Failed to send verification email', {
					error: emailError,
					userId: newUser.id,
				});
			}

			logger.info('Registration completed, redirecting to posts', { userId: newUser.id });
			redirect(302, `/posts`);
		} catch (error) {
			if (isRedirect(error)) throw error;

			logger.error('Unexpected error during user registration', {
				error,
				username,
				email,
			});
			return createErrorResponse(
				'form-action',
				500,
				'An unexpected error occured during user account registration',
			);
		}
	});
};
