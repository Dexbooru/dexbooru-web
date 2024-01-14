import type { IAuthFieldRequirements } from '../types/auth';
import {
	MINIMUM_PASSWORD_LENGTH,
	MAXIMUM_PASSWORD_LENGTH,
	PASSWORD_REQUIREMENTS,
	SPECIAL_CHARACTER_REGEX
} from '../constants/auth';

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
		} 
		
		if(SPECIAL_CHARACTER_REGEX.test(password)) {
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
