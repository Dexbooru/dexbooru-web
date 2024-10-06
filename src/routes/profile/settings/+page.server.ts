import { deleteFromBucket, uploadToBucket } from '$lib/server/aws/actions/s3';
import { AWS_PROFILE_PICTURE_BUCKET_NAME } from '$lib/server/constants/aws';
import { SESSION_ID_COOKIE_OPTIONS } from '$lib/server/constants/cookies';
import {
	deleteUserById,
	editPasswordByUserId,
	editProfilePictureByUserId,
	editUsernameByUserId,
	findUserById,
	findUserByName,
} from '$lib/server/db/actions/user';
import { runProfileImageTransformationPipeline } from '$lib/server/helpers/images';
import { hashPassword, passwordsMatch } from '$lib/server/helpers/password';
import { generateUpdatedUserTokenFromClaims } from '$lib/server/helpers/sessions';
import { ACCOUNT_DELETION_CONFIRMATION_TEXT } from '$lib/shared/constants/auth';
import { MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB } from '$lib/shared/constants/images';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { getPasswordRequirements } from '$lib/shared/helpers/auth/password';
import { getUsernameRequirements } from '$lib/shared/helpers/auth/username';
import { getFormFields } from '$lib/shared/helpers/forms';
import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
import type {
	IChangePasswordFormFields,
	IChangeProfilePictureFormFields,
	IChangeUsernameFormFields,
	IDeleteAccountFields,
} from '$lib/shared/types/auth';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Action, Actions } from './$types';

const handleAccountDeletion: Action = async ({ locals, cookies, request }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to delete your account, without being a signed in user!',
		});
	}

	const deleteAccountForm = await request.formData();
	const { deletionConfirmationText } = getFormFields<IDeleteAccountFields>(deleteAccountForm);

	if (deletionConfirmationText !== ACCOUNT_DELETION_CONFIRMATION_TEXT) {
		return fail(400, {
			type: 'delete-account',
			message: 'The account deletion confirmation text is incorrect',
		});
	}

	const deletedUser = await deleteUserById(locals.user.id);
	if (!deletedUser) {
		throw error(404, { message: `A user with the id: ${locals.user.id} does not exist!` });
	}

	cookies.delete(SESSION_ID_KEY, { path: '/' });

	throw redirect(302, '/');
};

const handleChangeProfilePicture: Action = async ({ locals, request, cookies }) => {
	if (!locals.user) {
		throw error(401, {
			message:
				'You are not authorized to change a profile picture, without being a signed in user!',
		});
	}

	const changeProfilePictureForm = await request.formData();
	const { newProfilePicture } =
		getFormFields<IChangeProfilePictureFormFields>(changeProfilePictureForm);

	if (newProfilePicture.size === 0) {
		return fail(400, {
			reason: 'The uploaded profile picture file was empty!',
			type: 'profile-picture',
		});
	}

	if (!isFileImage(newProfilePicture)) {
		return fail(400, {
			reason: 'The provided profile picture file is not an image!',
			type: 'profile-picture',
		});
	}

	if (!isFileImageSmall(newProfilePicture)) {
		return fail(400, {
			reason: `The maximum image file upload size is ${MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB} MB`,
			type: 'profile-picture',
		});
	}

	deleteFromBucket(AWS_PROFILE_PICTURE_BUCKET_NAME, locals.user.profilePictureUrl);

	const newProfilePictureFileBuffer = await runProfileImageTransformationPipeline(
		newProfilePicture,
	);
	const updatedProfilePictureObjectUrl = await uploadToBucket(
		AWS_PROFILE_PICTURE_BUCKET_NAME,
		'profile_pictures',
		newProfilePictureFileBuffer,
	);
	await editProfilePictureByUserId(locals.user.id, updatedProfilePictureObjectUrl);

	const updatedUserJwtToken = generateUpdatedUserTokenFromClaims({
		...locals.user,
		profilePictureUrl: updatedProfilePictureObjectUrl,
	});
	cookies.set(SESSION_ID_KEY, updatedUserJwtToken, SESSION_ID_COOKIE_OPTIONS);

	return {
		message: 'The profile picture was updated successfully',
		newAuthToken: updatedUserJwtToken,
	};
};

const handleChangeUsername: Action = async ({ locals, request, cookies }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to change a username, without being a signed in user!',
		});
	}

	const changeUsernameForm = await request.formData();
	const { newUsername } = getFormFields<IChangeUsernameFormFields>(changeUsernameForm);

	if (!newUsername) {
		return fail(400, {
			newUsername,
			type: 'username',
			reason: 'At least one of the required fields was missing!',
		});
	}

	const { unsatisfied } = getUsernameRequirements(newUsername);

	if (unsatisfied.length) {
		return fail(400, {
			newUsername,
			type: 'username',
			reason: 'The username did not meet the requirements!',
		});
	}

	const existingUser = await findUserByName(newUsername);
	if (existingUser) {
		return fail(409, {
			newUsername,
			type: 'username',
			reason: 'A user with that name already exists!',
		});
	}

	const updatedUsername = await editUsernameByUserId(locals.user.id, newUsername);

	if (!updatedUsername) {
		return fail(404, {
			newUsername,
			type: 'username',
			reason: `A user with the id: ${locals.user.id} does not exist!`,
		});
	}

	const updatedUserJwtToken = generateUpdatedUserTokenFromClaims({
		...locals.user,
		username: newUsername,
	});
	cookies.set(SESSION_ID_KEY, updatedUserJwtToken, SESSION_ID_COOKIE_OPTIONS);

	return {
		message: 'The username was changed successfully!',
		newAuthToken: updatedUserJwtToken,
	};
};

const handleChangePassword: Action = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to change a password, without being a signed in user!',
		});
	}

	const changePasswordForm = await request.formData();
	const { oldPassword, newPassword, confirmedNewPassword } =
		getFormFields<IChangePasswordFormFields>(changePasswordForm);

	if (!oldPassword || !newPassword || !confirmedNewPassword) {
		return fail(400, {
			type: 'password',
			reason: 'At least one of the required fields is missing!',
		});
	}

	if (newPassword !== confirmedNewPassword) {
		return fail(400, {
			type: 'password',
			reason: 'The new password does not match the confirmed new password!',
		});
	}

	const signedInUser = await findUserById(locals.user.id, { password: true });

	if (!signedInUser) {
		return fail(404, {
			type: 'password',
			reason: `A user with the id: ${locals.user.id} does not exist!`,
		});
	}

	const { password: actualHashedPassword } = signedInUser;
	if (!passwordsMatch(oldPassword, actualHashedPassword)) {
		return fail(400, {
			type: 'password',
			reason: 'The old password does not match the actual password!',
		});
	}

	const { unsatisfied } = getPasswordRequirements(newPassword);

	if (unsatisfied.length > 0) {
		return fail(400, {
			type: 'password',
			reason: 'The password did not meet the requirements!',
		});
	}

	const hashedNewPassword = await hashPassword(newPassword);
	const updatedPassword = await editPasswordByUserId(locals.user.id, hashedNewPassword);

	if (!updatedPassword) {
		return fail(404, {
			type: 'password',
			reason: `A user with the id: ${locals.user.id} does not exist!`,
		});
	}

	return {
		message: 'The password was changed successfully!',
	};
};

export const actions: Actions = {
	deleteAccount: handleAccountDeletion,
	username: handleChangeUsername,
	password: handleChangePassword,
	profilePicture: handleChangeProfilePicture,
};
