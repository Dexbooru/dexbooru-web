export interface IRegisterFormFields {
	username: string;
	email: string;
	password: string;
	profilePicture: File;
	confirmedPassword: string;
}

export interface ILoginFormFields {
	username: string;
	password: string;
	rememberMe?: string;
}

export interface IAuthFieldRequirements {
	satisfied: string[];
	unsatisfied: string[];
}

export interface IChangePasswordFormFields {
	oldPassword: string;
	newPassword: string;
	confirmedNewPassword: string;
}

export interface IChangeProfilePictureFormFields {
	newProfilePicture: File;
}

export interface IChangeUsernameFormFields {
	newUsername: string;
}

export interface IDeleteAccountFields {
	deletionConfirmationText: string;
}

export type TPASSWORD_REQUIREMENT_ABV =
	| 'length'
	| 'lowercase'
	| 'uppercase'
	| 'number'
	| 'special-character';
export type TPasswordRequirements = Record<TPASSWORD_REQUIREMENT_ABV, string>;

type TEMAIL_REQUIREMENT_ABV = 'length' | 'valid-email';
export type TEmailRequirements = Record<TEMAIL_REQUIREMENT_ABV, string>;

type TUSERNAME_REQUIREMENT_ABV = 'length' | 'spaces';
export type TUsernameRequirements = Record<TUSERNAME_REQUIREMENT_ABV, string>;
