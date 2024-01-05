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
    
	if (!email) {
		unsatisfied.push(EMAIL_REQUIREMENTS['length']);
	  } else {
		if (email.length < MINIMUM_EMAIL_LENGTH || email.length > MAXIMUM_EMAIL_LENGTH) {
		  unsatisfied.push(EMAIL_REQUIREMENTS['length']);
		} else {
		  satisfied.push(EMAIL_REQUIREMENTS['length']);
		}
	}

	return { satisfied, unsatisfied };
};

export const isValidEmail = (email: string): boolean => {
	if (email.length < MINIMUM_EMAIL_LENGTH || email.length > MAXIMUM_EMAIL_LENGTH) return false;

	return EMAIL_REGEX.test(email);
};
