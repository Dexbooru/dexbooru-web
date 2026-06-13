import type { UserPreference } from '$generated/prisma/client';
import { APPLICATION_CONFIGURATION_DEFAULTS } from '$lib/shared/applicationConfiguration/defaults';
import {
	buildPasswordRequirementMessages,
	buildUsernameRequirementMessages,
} from '$lib/shared/helpers/auth/requirementMessages';
import type { TEmailRequirements } from '../types/auth';
import type { TUser } from '../types/users';

export const MINIMUM_USERNAME_LENGTH = APPLICATION_CONFIGURATION_DEFAULTS.minimumUsernameLength;
export const MAXIMUM_USERNAME_LENGTH = APPLICATION_CONFIGURATION_DEFAULTS.maximumUsernameLength;
export const USERNAME_REQUIREMENTS = buildUsernameRequirementMessages({
	minimumUsernameLength: MINIMUM_USERNAME_LENGTH,
	maximumUsernameLength: MAXIMUM_USERNAME_LENGTH,
});

export const MINIMUM_EMAIL_LENGTH = 1;
export const MAXIMUM_EMAIL_LENGTH = 254;
export const EMAIL_REQUIREMENTS: TEmailRequirements = {
	length: `The email must be between ${MINIMUM_EMAIL_LENGTH} and ${MAXIMUM_EMAIL_LENGTH} characters long`,
	'valid-email': 'The email must have a @ sign and a valid domain after it',
};
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const DEFAULT_PASSWORD_LENGTH = 15;
export const MINIMUM_PASSWORD_LENGTH = APPLICATION_CONFIGURATION_DEFAULTS.minimumPasswordLength;
export const MAXIMUM_PASSWORD_LENGTH = APPLICATION_CONFIGURATION_DEFAULTS.maximumPasswordLength;
export const PASSWORD_REQUIREMENTS = buildPasswordRequirementMessages({
	minimumPasswordLength: MINIMUM_PASSWORD_LENGTH,
	maximumPasswordLength: MAXIMUM_PASSWORD_LENGTH,
});

export const SPECIAL_CHARACTER_REGEX = /[\W_]/g;

export const ACCOUNT_DELETION_CONFIRMATION_TEXT = 'delete my account';
export const DELETED_ACCOUNT_HEADING = '[deleted-user]';

export const NONEXISTENT_USER_ID = 'non-existent-id';
export const NULLABLE_USER: TUser = {
	id: NONEXISTENT_USER_ID,
	createdAt: new Date(0),
	updatedAt: new Date(0),
	role: 'USER',
	password: '',
	profilePictureUrl: '',
	username: '',
	email: '',
	emailVerified: false,
	linkedAccounts: [],
	moderationStatus: 'UNFLAGGED',
	superRolePromotionAt: null,
};
export const NULLABLE_USER_USER_PREFERENCES: UserPreference = {
	userId: NONEXISTENT_USER_ID,
	twoFactorAuthenticationEnabled: false,
	autoBlurNsfw: true,
	browseInSafeMode: false,
	customSideWideCss: '',
	hidePostMetadataOnPreview: true,
	hideCollectionMetadataOnPreview: false,
	hideImageCarousel: false,
	blacklistedArtists: [],
	blacklistedTags: [],
	createdAt: new Date(),
	updatedAt: new Date(),
};
