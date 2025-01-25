export interface IOauthProvider {
	getAuthorizationUrl(): Promise<string>;
	getIdentity<T>(_token: string): Promise<T>;
	getToken(_code: string, _state: string): Promise<string>;
	getUserData(_token: string): Promise<TSimplifiedUserResponse>;
}

export type TOauthApplication = 'google' | 'github' | 'discord';

export type TSimplifiedUserResponse = {
	id: string;
	email: string;
	profilePictureUrl: string;
	username: string;
	applicationName: TOauthApplication;
	externalData?: Record<string, unknown>;
};

export type TGoogleUserResponse = {
	sub: string;
	name?: string;
	given_name?: string;
	family_name?: string;
	picture?: string;
	email?: string;
	email_verified?: boolean;
	locale?: string;
};

export type TDiscordUserResponse = {
	id: string;
	username: string;
	avatar: string | null;
	discriminator: string;
	public_flags: number;
	flags: number;
	banner: string | null;
	accent_color: number | null;
	global_name: string | null;
	avatar_decoration_data: unknown;
	banner_color: string | null;
	clan: unknown;
	primary_guild: unknown;
	mfa_enabled: boolean;
	locale: string;
	premium_type: number;
	email: string | null;
	verified: boolean;
};

export type TGithubUserResponse = {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
	name: string | null;
	company: string | null;
	blog: string | null;
	location: string | null;
	email: string | null;
	hireable: boolean | null;
	bio: string | null;
	twitter_username: string | null;
	public_repos: number;
	public_gists: number;
	followers: number;
	following: number;
	created_at: string;
	updated_at: string;
	private_gists: number;
	total_private_repos: number;
	owned_private_repos: number;
	disk_usage: number;
	collaborators: number;
	two_factor_authentication: boolean;
	plan: {
		name: string;
		space: number;
		private_repos: number;
		collaborators: number;
	};
};

export type TGithubUserEmailResponse = {
	email: string;
	primary: boolean;
	verified: boolean;
	visibility: string | null;
};

export type TOuth2AuthorizationParams = {
	client_id: string;
	redirect_uri: string;
	scope: string;
	response_type: 'code' | 'token';
	state?: string;
};

export type TOauthTokenExchangeParams = {
	client_id: string;
	client_secret: string;
	code: string;
	redirect_uri: string;
	grant_type: 'authorization_code';
};

export type TOauthTokenResponse = {
	id_token?: string;
	access_token?: string;
	token_type: string;
	expires_in: number;
};
