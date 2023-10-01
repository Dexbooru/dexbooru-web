import { isValidEmail } from '$lib/auth/email';
import { hashPassword, getPasswordRequirements } from '$lib/auth/password';
import type { IRegisterFormFields } from '$lib/auth/types';
import { getUsernameRequirements } from '$lib/auth/user';
import { createUser } from '$lib/db/actions/user';
import { getFormFields } from '$lib/helpers/forms';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, Action } from './$types';
import { uploadToBucket } from '$lib/aws/actions/s3';

const handleRegistration: Action = async ({ request }) => {
	const registerForm = await request.formData();
	const { email, username, password, confirmedPassword, profilePicture } =
		getFormFields<IRegisterFormFields>(registerForm);

	if (!email || !username || !password || !confirmedPassword || !profilePicture) {
		return fail(400, {
			email,
			username,
			reason: 'At least one of the required fields is missing!'
		});
	}

	if (password !== confirmedPassword) {
		return fail(400, {
			email,
			username,
			reason: 'The password does not match the confirmed password!'
		});
	}

	const { unsatisfied: usernameUnsatisfied } = getUsernameRequirements(username);
	if (usernameUnsatisfied.length > 0) {
		return fail(400, { email, username, reason: 'The username did not meet the requirements!' });
	}

	if (!isValidEmail(email)) {
		return fail(400, {
			email,
			username,
			reason: 'The email format is given in an invalid format!'
		});
	}

	const { unsatisfied: passwordUnsatisifed } = getPasswordRequirements(password);
	if (passwordUnsatisifed.length > 0) {
		return fail(400, { email, username, reason: 'The password did not meet the requirements!' });
	}
	const hashedPassword = await hashPassword(password);

	const newUser = await createUser(username, email, hashedPassword);
	if (!newUser) {
		return fail(400, {
			email,
			username,
			reason: 'An account with this username or email already exists!'
		});
	}

	const profilePictureFile = profilePicture;
	const profilePictureFileType = profilePictureFile.type;
	const profilePictureArrayBuffer = await profilePictureFile.arrayBuffer();
	const profilePictureBuffer = Buffer.from(profilePictureArrayBuffer);

	try {
		await uploadToBucket(
			process.env.DEV_PFP_BUCKET || '',
			newUser.id,
			profilePictureBuffer,
			profilePictureFileType
		);
	} catch (error) {
		return fail(400, {
			email,
			username,
			reason: error
		});
	}

	throw redirect(302, '/login');
};

export const actions = {
	default: handleRegistration
} satisfies Actions;
