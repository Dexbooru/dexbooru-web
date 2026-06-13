import type {
	TPasswordRequirements,
	TPasswordValidationLimits,
	TUsernameRequirements,
	TUsernameValidationLimits,
} from '$lib/shared/types/auth';

const USERNAME_SPACES_MESSAGE =
	'The username must not contain any leading, trailing or inline spaces';
const USERNAME_HTML_CHARS_MESSAGE =
	'The username must not contain HTML special characters (e.g. &, <, >, ", \')';

const PASSWORD_LOWERCASE_MESSAGE = 'The password must contain at least one lowercase character';
const PASSWORD_UPPERCASE_MESSAGE = 'The password must contain at least one uppercase character';
const PASSWORD_NUMBER_MESSAGE = 'The password must contain at least one number';
const PASSWORD_SPECIAL_MESSAGE = 'The password must contain at least one special charcter';

export const buildUsernameRequirementMessages = (
	limits: TUsernameValidationLimits,
): TUsernameRequirements => ({
	length: `The username must be between ${limits.minimumUsernameLength} and ${limits.maximumUsernameLength} characters long`,
	spaces: USERNAME_SPACES_MESSAGE,
	'html-chars': USERNAME_HTML_CHARS_MESSAGE,
});

export const buildPasswordRequirementMessages = (
	limits: TPasswordValidationLimits,
): TPasswordRequirements => ({
	length: `The password must be between ${limits.minimumPasswordLength} and ${limits.maximumPasswordLength} characters long`,
	lowercase: PASSWORD_LOWERCASE_MESSAGE,
	uppercase: PASSWORD_UPPERCASE_MESSAGE,
	number: PASSWORD_NUMBER_MESSAGE,
	'special-character': PASSWORD_SPECIAL_MESSAGE,
});
