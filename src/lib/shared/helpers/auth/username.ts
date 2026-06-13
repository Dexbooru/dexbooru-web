import type { TAuthFieldRequirements, TUsernameValidationLimits } from '../../types/auth';
import { buildUsernameRequirementMessages } from './requirementMessages';

export const getUsernameRequirements = (
	username: string,
	limits: TUsernameValidationLimits,
): TAuthFieldRequirements => {
	const requirements = buildUsernameRequirementMessages(limits);
	const satisfied: string[] = [];
	const unsatisfied: string[] = [];
	const hasSpaces = username.includes(' ');
	const hasHtmlSpecialChars = /[&<>"']/.test(username);

	const usernameLengthWithoutSpaces = username.replace(/\s/g, '').length;

	if (hasHtmlSpecialChars) {
		unsatisfied.push(requirements['html-chars']);
	} else {
		satisfied.push(requirements['html-chars']);
	}

	if (
		usernameLengthWithoutSpaces < limits.minimumUsernameLength ||
		usernameLengthWithoutSpaces > limits.maximumUsernameLength
	) {
		unsatisfied.push(requirements.length);
	} else {
		satisfied.push(requirements.length);
	}

	if (hasSpaces) {
		unsatisfied.push(requirements.spaces);
	} else {
		if (!username) {
			return {
				satisfied: [],
				unsatisfied: Object.values(requirements),
			};
		} else {
			satisfied.push(requirements.spaces);
		}
	}

	return {
		satisfied,
		unsatisfied,
	};
};
