import { isValidEmail } from '$lib/auth/email';
import { hashPassword, getPasswordRequirements } from '$lib/auth/password';
import type { IRegisterFormFields } from '$lib/auth/types';
import { getUsernameRequirements } from '$lib/auth/user';
import { createUser } from '$lib/db/actions/user';
import { getFormFields } from '$lib/helpers/forms';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, Action } from './$types';
import { uploadToBucket } from '$lib/aws/actions/s3';
import {
	compressImage,
	fileToBuffer,
	resizeImage,
	PROFILE_PICTURE_WIDTH,
	PROFILE_PICTURE_HEIGHT
} from '$lib/helpers/images';

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
	const hashedPassword = await hashPassword(password);

	const newUser = await createUser(username, email, hashedPassword);
	if (!newUser) {
		return fail(400, {
			email,
			username,
			reason: 'An account with this username or email already exists!'
		});
	}

	const profilePictureBuffer = await fileToBuffer(profilePicture);
	const compressedProfilePictureBuffer = await compressImage(profilePictureBuffer);
	if (!compressedProfilePictureBuffer) {
		return fail(400, {
			email,
			username,
			reason: 'An unexpected error occured while compressing your profile picture!'
		});
	}

	const resizedProfilePictureBuffer = await resizeImage(
		compressedProfilePictureBuffer,
		PROFILE_PICTURE_WIDTH,
		PROFILE_PICTURE_HEIGHT
	);
	if (!resizedProfilePictureBuffer) {
		return fail(400, {
			email,
			username,
			reason: 'An expected error occured while resizing your profile picture!'
		});
	}

	const bucketFileId = `${newUser.id}-profile-picture`;
	const uploadedProfilePicture = await uploadToBucket(
		process.env.AWS_PROFILE_PICTURE_BUCKET || '',
		bucketFileId,
		resizedProfilePictureBuffer,
		'webp'
	);
	if (!uploadedProfilePicture) {
		return fail(400, {
			email,
			username,
			reason: 'There was an error while uploading your profile picture to the server'
		});
	}

	throw redirect(302, '/login');
};

export const actions = {
	default: handleRegistration
} satisfies Actions;
