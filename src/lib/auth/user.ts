import type { IFieldRequirements } from './types';

type TUSERNAME_REQUIREMENT_ABV = 'length' | 'spaces';

export const MINIMUM_USERNAME_LENGTH = 4;
export const MAXIMUM_USERNAME_LENGTH = 12;

const USERNAME_REQUIREMENTS: Record<TUSERNAME_REQUIREMENT_ABV, string> = {
	length: `The username must be between ${MINIMUM_USERNAME_LENGTH} and ${MAXIMUM_USERNAME_LENGTH} characters long`,
	spaces: 'The username must not contain any leading, trailing or inline spaces'
};

export const getUsernameRequirements = (username: string): IFieldRequirements => {
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
