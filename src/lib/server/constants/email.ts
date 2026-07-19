import accountRecoveryEmailTemplate from '../email-templates/forgot-password.html?raw';
import oauthPasswordEmailTemplate from '../email-templates/oauth-password.html?raw';
import emailVerificationTemplate from '../email-templates/verify-email.html?raw';

export const ACCOUNT_RECOVERY_EMAIL_TEMPLATE = accountRecoveryEmailTemplate;
export const OAUTH_PASSWORD_EMAIL_TEMPLATE = oauthPasswordEmailTemplate;
export const EMAIL_VERIFICATION_TEMPLATE = emailVerificationTemplate;

export const ACCOUNT_RECOVERY_EMAIL_SUBJECT = 'Dexbooru Account Recovery';
export const EMAIL_VERIFICATION_SUBJECT = 'Verify your Dexbooru email address';
export const OAUTH_TEMPORARY_PASSWORD_EMAIL_SUBJECT = 'Dexbooru Account Temporary Password';
export const DEXBOORU_SUPPORT_DISPLAY_NAME = 'Dexbooru Support';
export const DEXBOORU_NO_REPLY_EMAIL_ADDRESS = 'support@dexbooru.neetbyte.fun';
