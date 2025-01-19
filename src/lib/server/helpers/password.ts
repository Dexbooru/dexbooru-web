import { SALT_ROUNDS } from '$lib/server/constants/auth';
import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
	const salt = await bcrypt.genSalt(SALT_ROUNDS);
	const hashedPassword = await bcrypt.hash(password, salt);
	return hashedPassword;
};

export const doPasswordsMatch = async (
	password: string,
	hashedPassword: string,
): Promise<boolean> => {
	return await bcrypt.compare(password, hashedPassword);
};


export const generateRandomPassword = (passwordSize: number): string => {
	let generatedPassword: string = '';

	for (let i = 0; i < passwordSize; i++) {
		const randomCharacter = Math.floor(Math.random() * 94) + 33;
		generatedPassword += String.fromCharCode(randomCharacter);
	}

	return generatedPassword;
}