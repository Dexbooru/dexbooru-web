import {
	MINIMUM_EMAIL_LENGTH,
	MAXIMUM_EMAIL_LENGTH,
	EMAIL_REQUIREMENTS,
	EMAIL_REGEX
} from '../constants/auth';
import type { IAuthFieldRequirements } from '../types/auth';

export const getEmailRequirements = (email: string): IAuthFieldRequirements => {
	const satisfied: string[] = [];
	const unsatisfied: string[] = [];

	if (email.length < MINIMUM_EMAIL_LENGTH || email.length > MAXIMUM_EMAIL_LENGTH) {
		unsatisfied.push(EMAIL_REQUIREMENTS['length']);
	} else {
		satisfied.push(EMAIL_REQUIREMENTS['length']);
	}

	let validEmailDomain  = false;

	for (let i = 0; i < email.length; i++) {
		if(EMAIL_REGEX.test(email)) {
			validEmailDomain = true;
		}
	
		const charactersChecksPass = [
			validEmailDomain
		].reduce((acc, cur) => acc && cur);
		if (charactersChecksPass) break;
	}

	if (validEmailDomain) {
		satisfied.push(EMAIL_REQUIREMENTS['valid-email']);
	} else {
		unsatisfied.push(EMAIL_REQUIREMENTS['valid-email']);
	}


	return { satisfied, unsatisfied };
};

export const isValidEmail = (email: string): boolean => {
	if (email.length < MINIMUM_EMAIL_LENGTH || email.length > MAXIMUM_EMAIL_LENGTH) return false;
	
	return EMAIL_REGEX.test(email);
};
