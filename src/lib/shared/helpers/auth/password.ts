import { SPECIAL_CHARACTER_REGEX } from '$lib/shared/constants/auth';
import type { TAuthFieldRequirements, TPasswordValidationLimits } from '$lib/shared/types/auth';
import { buildPasswordRequirementMessages } from './requirementMessages';

export const getPasswordRequirements = (
	password: string,
	limits: TPasswordValidationLimits,
): TAuthFieldRequirements => {
	const requirements = buildPasswordRequirementMessages(limits);
	const satisifedRequirements: string[] = [];
	const unsatisfiedRequirements: string[] = [];

	if (
		password.length < limits.minimumPasswordLength ||
		password.length > limits.maximumPasswordLength
	) {
		unsatisfiedRequirements.push(requirements.length);
	} else {
		satisifedRequirements.push(requirements.length);
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

		if (SPECIAL_CHARACTER_REGEX.test(password)) {
			hasSpecialCharacter = true;
		}

		const charactersChecksPass = [
			hasLowercaseCharacter,
			hasUppercaseCharacter,
			hasNumber,
			hasSpecialCharacter,
		].reduce((acc, cur) => acc && cur);
		if (charactersChecksPass) break;
	}

	if (hasLowercaseCharacter) {
		satisifedRequirements.push(requirements.lowercase);
	} else {
		unsatisfiedRequirements.push(requirements.lowercase);
	}

	if (hasUppercaseCharacter) {
		satisifedRequirements.push(requirements.uppercase);
	} else {
		unsatisfiedRequirements.push(requirements.uppercase);
	}

	if (hasNumber) {
		satisifedRequirements.push(requirements.number);
	} else {
		unsatisfiedRequirements.push(requirements.number);
	}

	if (hasSpecialCharacter) {
		satisifedRequirements.push(requirements['special-character']);
	} else {
		unsatisfiedRequirements.push(requirements['special-character']);
	}

	return {
		satisfied: satisifedRequirements,
		unsatisfied: unsatisfiedRequirements,
	};
};
