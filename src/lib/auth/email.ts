
export const MINIMUM_EMAIL_LENGTH = 1;
export const MAXIMUM_EMAIL_LENGTH = 254;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const isValidEmail = (email: string): boolean => {
    if (email.length < MINIMUM_EMAIL_LENGTH || email.length > MAXIMUM_EMAIL_LENGTH) return false;

    return EMAIL_REGEX.test(email);
}