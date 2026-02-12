import {
	createPasswordRecoveryAttempt,
	deletePasswordRecoveryAttempt,
	getPasswordRecoveryAttempt,
} from '../../db/actions/passwordRecoveryAttempt';
import { updatePasswordByUserId, findUserByEmail } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { buildPasswordRecoveryEmailTemplate, sendEmail } from '../../helpers/email';
import { hashPassword } from '../../helpers/password';
import logger from '../../logging/logger';
import {
	UserUpdatePasswordAccountRecoverySchema,
	UserGetPasswordRecoverySessionSchema,
	UserForgotPasswordSchema,
} from '../request-schemas/users';
import { isHttpError, type RequestEvent } from '@sveltejs/kit';
import {
	ACCOUNT_RECOVERY_EMAIL_SUBJECT,
	DEXBOORU_NO_REPLY_EMAIL_ADDRESS,
	DEXBOORU_SUPPORT_DISPLAY_NAME,
} from '../../constants/email';

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
					expiresAt: true,
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

				const now = Date.now();
				if (now > recoveryAttempt.expiresAt.getTime()) {
					await deletePasswordRecoveryAttempt(recoveryAttempt.id);

					return createErrorResponse(
						'form-action',
						403,
						'This password recovery session is expired',
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
					from: {
						name: DEXBOORU_SUPPORT_DISPLAY_NAME,
						address: DEXBOORU_NO_REPLY_EMAIL_ADDRESS,
					},
					to: user.email,
					subject: ACCOUNT_RECOVERY_EMAIL_SUBJECT,
					html: buildPasswordRecoveryEmailTemplate(user.username, newPasswordRecoveryAttempt.id),
				});

				return createSuccessResponse(
					'form-action',
					'The password recovery email was sent successfully',
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while sending the password recovery email',
				);
			}
		},
	);
};
