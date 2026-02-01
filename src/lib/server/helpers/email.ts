import { dev } from '$app/environment';
import { APP_URL, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USERNAME } from '$env/static/private';
import { capitalize } from '$lib/shared/helpers/util';
import nodemailer from 'nodemailer';
import type { MailOptions } from 'nodemailer/lib/json-transport';
import { ACCOUNT_RECOVERY_EMAIL_TEMPLATE, OAUTH_PASSWORD_EMAIL_TEMPLATE } from '../constants/email';
import { RECOVERY_ATTEMPT_EXPIRY_HOURS } from '../constants/passwordRecovery';

const transporter = nodemailer.createTransport({
	host: SMTP_HOST,
	port: Number(SMTP_PORT),
	secure: false,
	tls: {
		rejectUnauthorized: !dev,
	},
	auth: {
		user: SMTP_USERNAME,
		pass: SMTP_PASSWORD,
	},
});

export const buildOauthPasswordEmailTemplate = (
	username: string,
	currentPassword: string,
	applicationName: string,
): string => {
	return OAUTH_PASSWORD_EMAIL_TEMPLATE.replaceAll('{{username}}', username)
		.replaceAll('{{password}}', currentPassword)
		.replaceAll('{{applicationName}}', capitalize(applicationName));
};

export const buildPasswordRecoveryEmailTemplate = (
	username: string,
	publicAccountRecoveryId: string,
): string => {
	const accountRecoveryLink = `${APP_URL}/recover-account/${publicAccountRecoveryId}`;
	return ACCOUNT_RECOVERY_EMAIL_TEMPLATE.replaceAll('{{username}}', username)
		.replaceAll('{{accountRecoveryLink}}', accountRecoveryLink)
		.replaceAll('{{expiryHours}}', RECOVERY_ATTEMPT_EXPIRY_HOURS.toString());
};

export const sendEmail = async (mailOptions: MailOptions) => {
	return await transporter.sendMail(mailOptions);
};
