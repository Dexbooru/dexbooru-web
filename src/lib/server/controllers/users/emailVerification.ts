import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import type { SerializeOptions } from 'cookie';
import {
	DEXBOORU_NO_REPLY_EMAIL_ADDRESS,
	DEXBOORU_SUPPORT_DISPLAY_NAME,
	EMAIL_VERIFICATION_SUBJECT,
} from '../../constants/email';
import {
	createEmailVerificationToken,
	deleteEmailVerificationToken,
	getEmailVerificationToken,
} from '../../db/actions/emailVerification';
import { findUserById, updateEmailVerifiedByUserId } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { buildCookieOptions } from '../../helpers/cookies';
import { buildEmailVerificationTemplate, sendEmail } from '../../helpers/email';
import { generateEncodedUserTokenFromRecord } from '../../helpers/sessions';
import logger from '../../logging/logger';
import { UserResendVerificationSchema, UserVerifyEmailSchema } from '../request-schemas/users';

export const handleVerifyEmail = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'page-server-load',
		UserVerifyEmailSchema,
		async (data) => {
			const { tokenId } = data.pathParams;

			const token = await getEmailVerificationToken(tokenId, {
				id: true,
				userId: true,
				expiresAt: true,
			});

			if (!token) {
				redirect(302, '/posts?verificationExpired=true');
			}

			if (Date.now() > token.expiresAt.getTime()) {
				await deleteEmailVerificationToken(tokenId);
				redirect(302, '/posts?verificationExpired=true');
			}

			await updateEmailVerifiedByUserId(token.userId, true);
			await deleteEmailVerificationToken(tokenId);

			const user = await findUserById(token.userId, { id: true });
			if (user) {
				const encodedAuthToken = generateEncodedUserTokenFromRecord(user, true);
				event.cookies.set(
					SESSION_ID_KEY,
					encodedAuthToken,
					buildCookieOptions(true) as SerializeOptions & { path: string },
				);
			}

			redirect(302, '/posts?emailVerified=true');
		},
	);
};

export const handleResendVerificationEmail = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UserResendVerificationSchema,
		async () => {
			const user = event.locals.user;
			if (user.id === NULLABLE_USER.id) {
				return createErrorResponse(
					'form-action',
					401,
					'You must be logged in to resend the verification email',
				);
			}

			const dbUser = await findUserById(user.id, {
				id: true,
				emailVerified: true,
				email: true,
				username: true,
			});
			if (!dbUser) {
				return createErrorResponse('form-action', 404, 'User not found');
			}
			if (dbUser.emailVerified) {
				return createSuccessResponse('form-action', 'Your email is already verified');
			}

			try {
				const verificationToken = await createEmailVerificationToken(dbUser.id);
				await sendEmail({
					from: {
						name: DEXBOORU_SUPPORT_DISPLAY_NAME,
						address: DEXBOORU_NO_REPLY_EMAIL_ADDRESS,
					},
					to: dbUser.email,
					subject: EMAIL_VERIFICATION_SUBJECT,
					html: buildEmailVerificationTemplate(dbUser.username, verificationToken.id),
				});
				return createSuccessResponse('form-action', 'Verification email sent successfully');
			} catch (error) {
				logger.error('Failed to resend verification email', { error, userId: user.id });
				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occurred while sending the verification email',
				);
			}
		},
		true,
	);
};
