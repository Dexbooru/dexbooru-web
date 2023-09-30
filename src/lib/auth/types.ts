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

export interface IFieldRequirements {
	satisfied: string[];
	unsatisfied: string[];
}
