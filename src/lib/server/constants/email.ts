
export const SMTP_USERNAME = process.env.SMTP_USERNAME ?? '';
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? '';
export const ACCOUNT_RECOVERY_EMAIL_TEMPLATE = `
Hey {{username}},
<br />
You seem to have forgotten the password to your Dexbooru account. Use this <a href="{{accountRecoveryLink}}">link</a> here to recover your account!
<br />
<strong>If you were not the one who sent this account recovery request, please ignore this email!</strong>
`;
export const ACCOUNT_RECOVERY_EMAIL_SUBJECT = 'Dexbooru Account Recovery';
export const DEXBOORU_NO_REPLY_EMAIL_ADDRESS = 'dexboorudev@gmail.com';