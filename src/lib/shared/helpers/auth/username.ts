import {
	MAXIMUM_USERNAME_LENGTH,
	MINIMUM_USERNAME_LENGTH,
	USERNAME_REQUIREMENTS,
} from '../../constants/auth';
import type { TAuthFieldRequirements } from '../../types/auth';

export const getUsernameRequirements = (username: string): TAuthFieldRequirements => {
	const satisfied: string[] = [];
	const unsatisfied: string[] = [];
	const hasSpaces = username.includes(' ');
	const hasHtmlSpecialChars = /[&<>"']/.test(username);

	const usernameLengthWithoutSpaces = username.replace(/\s/g, '').length;

	if (hasHtmlSpecialChars) {
		unsatisfied.push(USERNAME_REQUIREMENTS['html-chars']);
	} else {
		satisfied.push(USERNAME_REQUIREMENTS['html-chars']);
	}

	if (
		usernameLengthWithoutSpaces < MINIMUM_USERNAME_LENGTH ||
		usernameLengthWithoutSpaces > MAXIMUM_USERNAME_LENGTH
	) {
		unsatisfied.push(USERNAME_REQUIREMENTS['length']);
	} else {
		satisfied.push(USERNAME_REQUIREMENTS['length']);
	}

	if (hasSpaces) {
		unsatisfied.push(USERNAME_REQUIREMENTS['spaces']);
	} else {
		if (!username) {
			return {
				satisfied: [],
				unsatisfied: Array.from(Object.values(USERNAME_REQUIREMENTS)),
			};
		} else {
			satisfied.push(USERNAME_REQUIREMENTS['spaces']);
		}
	}

	return {
		satisfied,
		unsatisfied,
	};
};
