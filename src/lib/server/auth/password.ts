import { SALT_ROUNDS } from '$lib/shared/constants/auth';
import bcrypt from 'bcryptjs';

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
