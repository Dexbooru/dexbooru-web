import type { UserPreference } from '@prisma/client';
import type {
	TEmailRequirements,
	TPasswordRequirements,
	TUsernameRequirements,
} from '../types/auth';
import type { TUser } from '../types/users';

export const MINIMUM_USERNAME_LENGTH = 4;
export const MAXIMUM_USERNAME_LENGTH = 12;
export const USERNAME_REQUIREMENTS: TUsernameRequirements = {
	length: `The username must be between ${MINIMUM_USERNAME_LENGTH} and ${MAXIMUM_USERNAME_LENGTH} characters long`,
	spaces: 'The username must not contain any leading, trailing or inline spaces',
};
export const MINIMUM_EMAIL_LENGTH = 1;
export const MAXIMUM_EMAIL_LENGTH = 254;
export const EMAIL_REQUIREMENTS: TEmailRequirements = {
	length: `The email must be between ${MINIMUM_EMAIL_LENGTH} and ${MAXIMUM_EMAIL_LENGTH} characters long`,
	'valid-email': 'The email must have a @ sign and a valid domain after it',
};
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const MINIMUM_PASSWORD_LENGTH = 8;
export const MAXIMUM_PASSWORD_LENGTH = 50;
export const PASSWORD_REQUIREMENTS: TPasswordRequirements = {
	length: `The password must be between ${MINIMUM_PASSWORD_LENGTH} and ${MAXIMUM_PASSWORD_LENGTH} characters long`,
	lowercase: 'The password must contain at least one lowercase character',
	uppercase: 'The password must contain at least one uppercase character',
	number: 'The password must contain at least one number',
	'special-character': 'The password must contain at least one special charcter',
};
export const SPECIAL_CHARACTER_REGEX = /[\W_]/g;
export const ACCOUNT_DELETION_CONFIRMATION_TEXT = 'delete my account';
export const DELETED_ACCOUNT_HEADING = '[deleted-user]';
export const NONEXISTENT_USER_ID = 'non-existent-id';
export const NULLABLE_USER: TUser = {
	id: NONEXISTENT_USER_ID,
	createdAt: new Date(0),
	updatedAt: new Date(0),
	password: '',
	profilePictureUrl: '',
	username: '',
	email: '',
};
export const NULLABLE_USER_USER_PREFERENCES: UserPreference = {
	userId: NONEXISTENT_USER_ID,
	twoFactorAuthenticationEnabled: false,
	autoBlurNsfw: true,
	browseInSafeMode: false,
	customSideWideCss: '',
	hidePostMetadataOnPreview: false,
	hideCollectionMetadataOnPreview: false,
	blacklistedArtists: [],
	blacklistedTags: [],
	createdAt: new Date(),
	updatedAt: new Date(),
};
