import fs from 'fs';
import path from 'path';

export const ACCOUNT_RECOVERY_EMAIL_TEMPLATE = fs.readFileSync(
	path.join(process.env.PWD ?? '', 'src/lib/server/email-templates/forgot-password.html'),
	{
		encoding: 'utf-8',
	},
);
export const OAUTH_PASSWORD_EMAIL_TEMPLATE = fs.readFileSync(
	path.join(process.env.PWD ?? '', 'src/lib/server/email-templates/oauth-password.html'),
	{
		encoding: 'utf-8',
	},
);

export const ACCOUNT_RECOVERY_EMAIL_SUBJECT = 'Dexbooru Account Recovery';
export const OAUTH_TEMPORARY_PASSWORD_EMAIL_SUBJECT = 'Dexbooru Account Temporary Password';
export const DEXBOORU_NO_REPLY_EMAIL_ADDRESS = 'dexboorudev@gmail.com';
