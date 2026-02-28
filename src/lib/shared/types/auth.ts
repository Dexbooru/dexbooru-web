export type TRegisterFormFields = {
	username: string;
	email: string;
	password: string;
	profilePicture: File;
	confirmedPassword: string;
};

export type TLoginFormFields = {
	username: string;
	password: string;
	rememberMe?: string;
};

export type TAuthFieldRequirements = {
	satisfied: string[];
	unsatisfied: string[];
};

export type TChangePasswordFormFields = {
	oldPassword: string;
	newPassword: string;
	confirmedNewPassword: string;
};

export type TChangeProfilePictureFormFields = {
	newProfilePicture: File;
};

export type IChangeUsernameFormFields = {
	newUsername: string;
};

export type IDeleteAccountFields = {
	deletionConfirmationText: string;
};

export type IAccountRecoveryFormFields = {
	email: string;
};

export type TPASSWORD_REQUIREMENT_ABV =
	| 'length'
	| 'lowercase'
	| 'uppercase'
	| 'number'
	| 'special-character';
export type TPasswordRequirements = Record<TPASSWORD_REQUIREMENT_ABV, string>;

type TEMAIL_REQUIREMENT_ABV = 'length' | 'valid-email';
export type TEmailRequirements = Record<TEMAIL_REQUIREMENT_ABV, string>;

type TUSERNAME_REQUIREMENT_ABV = 'length' | 'spaces' | 'html-chars';
export type TUsernameRequirements = Record<TUSERNAME_REQUIREMENT_ABV, string>;
