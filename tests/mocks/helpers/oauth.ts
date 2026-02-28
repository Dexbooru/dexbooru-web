import { vi } from 'vitest';

export const mockOauthProvider = {
	getAuthorizationUrl: vi.fn(),
};

export class GoogleOauthProvider {
	getAuthorizationUrl = mockOauthProvider.getAuthorizationUrl;
}
export class DiscordOauthProvider {
	getAuthorizationUrl = mockOauthProvider.getAuthorizationUrl;
}
export class GithubOauthProvider {
	getAuthorizationUrl = mockOauthProvider.getAuthorizationUrl;
}

vi.mock('$lib/server/helpers/oauth', () => ({
	GoogleOauthProvider,
	DiscordOauthProvider,
	GithubOauthProvider,
}));
