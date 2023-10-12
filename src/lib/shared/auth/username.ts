import type { IAuthFieldRequirements } from '../types/auth';
import {
	MINIMUM_USERNAME_LENGTH,
	MAXIMUM_USERNAME_LENGTH,
	USERNAME_REQUIREMENTS
} from '../constants/auth';

export const getUsernameRequirements = (username: string): IAuthFieldRequirements => {
	const satisfied: string[] = [];
	const unsatisfied: string[] = [];

	if (username.length < MINIMUM_USERNAME_LENGTH || username.length > MAXIMUM_USERNAME_LENGTH) {
		unsatisfied.push(USERNAME_REQUIREMENTS['length']);
	} else {
		satisfied.push(USERNAME_REQUIREMENTS['length']);
	}

	let hasSpaces = false;

	for (let i = 0; i < username.length; i++) {
		const currentChar = username.charAt(i);
		if (currentChar === ' ') {
			hasSpaces = true;
			break;
		}
	}

	if (hasSpaces) {
		unsatisfied.push(USERNAME_REQUIREMENTS['spaces']);
	} else {
		satisfied.push(USERNAME_REQUIREMENTS['spaces']);
	}

	return {
		satisfied,
		unsatisfied
	};
};
