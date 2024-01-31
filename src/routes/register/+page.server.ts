import { uploadToBucket } from '$lib/server/aws/actions/s3';
import { createUser, findUserByNameOrEmail } from '$lib/server/db/actions/user';
import { runProfileImageTransformationPipeline } from '$lib/server/helpers/images';
import { hashPassword } from '$lib/server/helpers/password';
import { isValidEmail } from '$lib/shared/auth/email';
import { getPasswordRequirements } from '$lib/shared/auth/password';
import { getUsernameRequirements } from '$lib/shared/auth/username';
import { getFormFields } from '$lib/shared/helpers/forms';
import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
import type { IRegisterFormFields } from '$lib/shared/types/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions } from './$types';

const handleRegistration: Action = async ({ request }) => {
	const registerForm = await request.formData();
	const { email, username, password, confirmedPassword, profilePicture } =
		getFormFields<IRegisterFormFields>(registerForm);

	if (!email || !username || !password || !confirmedPassword) {
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

	const user = await findUserByNameOrEmail(email, username);
	if (user) {
		return fail(400, {
			email,
			username,
			reason: 'An account with this username or email already exists!'
		});
	}

	let finalProfilePictureUrl = process.env.DEFAULT_PROFILE_PICTURE_URL || '';
	if (profilePicture.size > 0) {
		if (!isFileImage(profilePicture)) {
			return fail(400, {
				email,
				username,
				reason: 'The provided profile picture file is not an image type!'
			});
		}

		if (!isFileImageSmall(profilePicture)) {
			return fail(400, {
				email,
				username,
				reason: `The provided profile picture file exceeded the maximum upload size!`
			});
		}

		const finalProfilePictureBuffer = await runProfileImageTransformationPipeline(profilePicture);
		const profilePictureObjectUrl = await uploadToBucket(
			process.env.AWS_PROFILE_PICTURE_BUCKET || '',
			'profile_pictures',
			finalProfilePictureBuffer
		);

		finalProfilePictureUrl = profilePictureObjectUrl;
	}

	const hashedPassword = await hashPassword(password);

	await createUser(username, email, hashedPassword, finalProfilePictureUrl);

	throw redirect(302, '/login');
};

export const actions = {
	default: handleRegistration
} satisfies Actions;
