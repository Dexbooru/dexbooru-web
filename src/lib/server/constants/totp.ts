import { OTP_PRIVATE_KEY } from '$env/static/private';
import base32Encode from 'base32-encode';

export const TOTP_ISSUER_NAME = 'Dexbooru';
export const TOTP_CODE_EXPIRY_TIME_SECONDS = 30;
export const TOTP_ALGORITHM = 'SHA1';
export const TOTP_QR_CODE_WIDTH = 256;
export const TOTP_KEY_PREFIX = 'totp-challenge:';

const hexBuffer = Buffer.from(OTP_PRIVATE_KEY, 'hex');
export const BASE32_ENCODED_TOTP_SECRET = base32Encode(hexBuffer, 'RFC4648', { padding: false });
