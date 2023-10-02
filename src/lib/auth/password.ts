import bcrypt from 'bcryptjs';
import type { IAuthFieldRequirements } from './types';

type TPASSWORD_REQUIREMENT_ABV =
	| 'length'
	| 'lowercase'
	| 'uppercase'
	| 'number'
	| 'special-character';

export const MINIMUM_PASSWORD_LENGTH = 8;
export const MAXIMUM_PASSWORD_LENGTH = 50;

const PASSWORD_REQUIREMENTS: Record<TPASSWORD_REQUIREMENT_ABV, string> = {
	length: `The password must be between ${MINIMUM_PASSWORD_LENGTH} and ${MAXIMUM_PASSWORD_LENGTH} characters long`,
	lowercase: 'The password must contain at least one lowercase character',
	uppercase: 'The password must contain at least one uppercase character',
	number: 'The password must contain at least one number',
	'special-character': 'The password must contain at least one special charcter'
};
const SPECIAL_CHARACTER_REGEX = /[\W_]/g;
const SALT_ROUNDS = 7;

export const getPasswordRequirements = (password: string): IAuthFieldRequirements => {
	const satisifedRequirements: string[] = [];
	const unsatisfiedRequirements: string[] = [];

	if (password.length < MINIMUM_PASSWORD_LENGTH || password.length > MAXIMUM_PASSWORD_LENGTH) {
		unsatisfiedRequirements.push(PASSWORD_REQUIREMENTS['length']);
	} else {
		satisifedRequirements.push(PASSWORD_REQUIREMENTS['length']);
	}

	let hasUppercaseCharacter = false;
	let hasLowercaseCharacter = false;
	let hasNumber = false;
	let hasSpecialCharacter = false;

	for (let i = 0; i < password.length; i++) {
		const currentChar = password.charAt(i);

		if (currentChar >= 'A' && currentChar <= 'Z') {
			hasUppercaseCharacter = true;
		} else if (currentChar >= 'a' && currentChar <= 'z') {
			hasLowercaseCharacter = true;
		} else if (currentChar >= '0' && currentChar <= '9') {
			hasNumber = true;
		} else if (SPECIAL_CHARACTER_REGEX.test(currentChar)) {
			hasSpecialCharacter = true;
		}

		const charactersChecksPass = [
			hasLowercaseCharacter,
			hasUppercaseCharacter,
			hasNumber,
			hasSpecialCharacter
		].reduce((acc, cur) => acc && cur);
		if (charactersChecksPass) break;
	}

	if (hasLowercaseCharacter) {
		satisifedRequirements.push(PASSWORD_REQUIREMENTS['lowercase']);
	} else {
		unsatisfiedRequirements.push(PASSWORD_REQUIREMENTS['lowercase']);
	}

	if (hasUppercaseCharacter) {
		satisifedRequirements.push(PASSWORD_REQUIREMENTS['uppercase']);
	} else {
		unsatisfiedRequirements.push(PASSWORD_REQUIREMENTS['uppercase']);
	}

	if (hasNumber) {
		satisifedRequirements.push(PASSWORD_REQUIREMENTS['number']);
	} else {
		unsatisfiedRequirements.push(PASSWORD_REQUIREMENTS['number']);
	}

	if (hasSpecialCharacter) {
		satisifedRequirements.push(PASSWORD_REQUIREMENTS['special-character']);
	} else {
		unsatisfiedRequirements.push(PASSWORD_REQUIREMENTS['special-character']);
	}

	return {
		satisfied: satisifedRequirements,
		unsatisfied: unsatisfiedRequirements
	};
};

export const hashPassword = async (password: string): Promise<string> => {
	const salt = await bcrypt.genSalt(SALT_ROUNDS);
	const hashedPassword = await bcrypt.hash(password, salt);
	return hashedPassword;
};

export const passwordsMatch = async (
	password: string,
	hashedPassword: string
): Promise<boolean> => {
	return await bcrypt.compare(password, hashedPassword);
};
