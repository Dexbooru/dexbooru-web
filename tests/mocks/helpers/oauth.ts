import { vi } from 'vitest';

export const mockOauthProvider = {
	getAuthorizationUrl: vi.fn(),
	validateAuthState: vi.fn(),
	getToken: vi.fn(),
	getUserData: vi.fn(),
};

export const mockSkeletonOauthProvider = {
	getApplicationFromState: vi.fn(),
	extractUserIdFromState: vi.fn(),
	constructPrimaryApplicationUsername: vi.fn(),
};

export class SkeletonOauthProvider {
	static getApplicationFromState = mockSkeletonOauthProvider.getApplicationFromState;
	static extractUserIdFromState = mockSkeletonOauthProvider.extractUserIdFromState;
	static constructPrimaryApplicationUsername =
		mockSkeletonOauthProvider.constructPrimaryApplicationUsername;
}

export class GoogleOauthProvider {
	getAuthorizationUrl = mockOauthProvider.getAuthorizationUrl;
	validateAuthState = mockOauthProvider.validateAuthState;
	getToken = mockOauthProvider.getToken;
	getUserData = mockOauthProvider.getUserData;
}

export class DiscordOauthProvider {
	getAuthorizationUrl = mockOauthProvider.getAuthorizationUrl;
	validateAuthState = mockOauthProvider.validateAuthState;
	getToken = mockOauthProvider.getToken;
	getUserData = mockOauthProvider.getUserData;
}

export class GithubOauthProvider {
	getAuthorizationUrl = mockOauthProvider.getAuthorizationUrl;
	validateAuthState = mockOauthProvider.validateAuthState;
	getToken = mockOauthProvider.getToken;
	getUserData = mockOauthProvider.getUserData;
}

vi.mock('$lib/server/helpers/oauth', () => ({
	SkeletonOauthProvider,
	GoogleOauthProvider,
	DiscordOauthProvider,
	GithubOauthProvider,
}));
