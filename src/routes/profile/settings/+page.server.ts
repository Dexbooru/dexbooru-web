import { handleUpdateLinkedAccounts } from '$lib/server/controllers/linkedAccounts';
import {
	handleChangePassword,
	handleChangeProfilePicture,
	handleChangeUsername,
	handleDeleteUser,
	handleGetUserSettings,
	handleToggleUserTwoFactorAuthentication,
	handleUpdatePostPreferences,
	handleUpdateUserInterfacePreferences,
} from '$lib/server/controllers/users';
import type { LinkedUserAccount } from '@prisma/client';
import type { Action, Actions, PageServerLoad } from './$types';

const handleAccountDeletion: Action = async (event) => {
	return await handleDeleteUser(event);
};

const handleAccountChangeProfilePicture: Action = async (event) => {
	return await handleChangeProfilePicture(event);
};

const handleAccountChangeUsername: Action = async (event) => {
	return await handleChangeUsername(event);
};

const handleAccountChangePassword: Action = async (event) => {
	return await handleChangePassword(event);
};

const handleChangePostPreferences: Action = async (event) => {
	return await handleUpdatePostPreferences(event);
};

const handleChangeUserInterfacePreferences: Action = async (event) => {
	return await handleUpdateUserInterfacePreferences(event);
};

const handleChange2fa: Action = async (event) => {
	return await handleToggleUserTwoFactorAuthentication(event);
};

const handleChangeLinkedAccounts: Action = async (event) => {
	return await handleUpdateLinkedAccounts(event, 'form-action');
};

export const actions: Actions = {
	deleteAccount: handleAccountDeletion,
	username: handleAccountChangeUsername,
	password: handleAccountChangePassword,
	profilePicture: handleAccountChangeProfilePicture,
	postPreferences: handleChangePostPreferences,
	userInterfacePreferences: handleChangeUserInterfacePreferences,
	twoFactorAuthentication: handleChange2fa,
	linkedAccounts: handleChangeLinkedAccounts,
};

type TSettingsLoadData = {
	linkedAccounts: LinkedUserAccount[];
	googleAuthorizationUrl: string;
	discordAuthorizationUrl: string;
	githubAuthorizationUrl: string;
};

export const load: PageServerLoad = async (event) => {
	return (await handleGetUserSettings(event)) as TSettingsLoadData;
};
