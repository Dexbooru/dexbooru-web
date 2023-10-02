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

export interface IChangeUsernameFormFields {
	newUsername: string;
}
