import {
	OAUTH_DISCORD_CLIENT_ID,
	OAUTH_DISCORD_CLIENT_SECRET,
	OAUTH_GITHUB_CLIENT_ID,
	OAUTH_GITHUB_CLIENT_SECRET,
	OAUTH_GOOGLE_CLIENT_ID,
	OAUTH_GOOGLE_CLIENT_SECRET,
} from '$env/static/private';
import { MAXIMUM_USERNAME_LENGTH, NULLABLE_USER } from '$lib/shared/constants/auth';
import type { RequestEvent } from '@sveltejs/kit';
import { CALLBACK_ENDPOINT } from '../constants/oauth';
import redis from '../db/redis';
import type {
	IOauthProvider,
	TDiscordUserResponse,
	TGithubUserEmailResponse,
	TGithubUserResponse,
	TGoogleUserResponse,
	TOauthApplication,
	TOauthTokenExchangeParams,
	TOauthTokenResponse,
	TOuth2AuthorizationParams,
	TSimplifiedUserResponse,
} from '../types/oauth';

export class SkeletonOauthProvider {
	protected readonly event: RequestEvent;
	protected readonly applicationSource: TOauthApplication;
	protected readonly userId: string | undefined;

	public static readonly applicationSources: TOauthApplication[] = ['discord', 'google', 'github'];
	public static readonly oauthStateKeyPrefix: string = 'OAUTH_STATE';
	public static readonly oauthStateKeyUserIdLength: number = 5;

	constructor(event: RequestEvent, applicationSource: TOauthApplication) {
		this.event = event;
		this.userId = event.locals.user.id !== NULLABLE_USER.id ? event.locals.user.id : undefined;
		this.applicationSource = applicationSource;
	}

	private constructKey(): string {
		let stateKey = `${SkeletonOauthProvider.oauthStateKeyPrefix}_${this.applicationSource.toUpperCase()}_${crypto.randomUUID()}`;
		if (this.userId) {
			stateKey += `_${this.userId}`;
		}

		return stateKey;
	}

	public static constructPrimaryApplicationUsername(oauthUsername: string): string {
		return oauthUsername
			.toLocaleLowerCase()
			.replaceAll(' ', '_')
			.trim()
			.slice(0, MAXIMUM_USERNAME_LENGTH);
	}

	public static getApplicationFromState(state: string): TOauthApplication | undefined {
		const matchingApplication = SkeletonOauthProvider.applicationSources.find((source) =>
			state.includes(source.toUpperCase()),
		);
		return matchingApplication;
	}

	public static extractUserIdFromState(state: string): string | undefined {
		const stateParts = state.split('_');

		return stateParts.length === SkeletonOauthProvider.oauthStateKeyUserIdLength
			? stateParts[4] !== NULLABLE_USER.id
				? stateParts[4]
				: undefined
			: undefined;
	}

	async validateAuthState(stateKey: string) {
		const value = await redis.get(stateKey);
		if (!value) {
			throw new Error('Invalid state provided in url parameter');
		}
	}

	deleteAuthState() {
		const stateKey = this.constructKey();
		redis.del(stateKey);
	}

	async storeAuthState(): Promise<string> {
		const stateKey = this.constructKey();
		await redis.set(stateKey, 'true');

		return stateKey;
	}
}

export class GoogleOauthProvider extends SkeletonOauthProvider implements IOauthProvider {
	public static readonly applicationSource: TOauthApplication = 'google';
	public static readonly authScope: string = 'email profile openid';
	public static readonly responseType: 'code' | 'token' = 'code';
	public static readonly authorizationBaseUrl: string =
		'https://accounts.google.com/o/oauth2/v2/auth';
	public static readonly tokenBaseUrl: string = 'https://www.googleapis.com/oauth2/v4/token';
	public static readonly identityUrl: string = 'https://openidconnect.googleapis.com/v1/userinfo';

	constructor(event: RequestEvent) {
		super(event, GoogleOauthProvider.applicationSource);
	}

	async getIdentity<TGoogleUserResponse>(accessToken: string): Promise<TGoogleUserResponse> {
		const headers = {
			Authorization: `Bearer ${accessToken}`,
		};

		const response = await this.event.fetch(GoogleOauthProvider.identityUrl, {
			headers,
		});
		if (!response.ok) {
			throw new Error(`Failed to get user data from ${GoogleOauthProvider.applicationSource}`);
		}

		return (await response.json()) as TGoogleUserResponse;
	}

	async getAuthorizationUrl(): Promise<string> {
		const computedState = await this.storeAuthState();
		const authorizationParams: TOuth2AuthorizationParams = {
			state: computedState,
			response_type: GoogleOauthProvider.responseType,
			client_id: OAUTH_GOOGLE_CLIENT_ID,
			redirect_uri: CALLBACK_ENDPOINT,
			scope: GoogleOauthProvider.authScope,
		};

		return `${GoogleOauthProvider.authorizationBaseUrl}?${new URLSearchParams(authorizationParams).toString()}`;
	}

	async getToken(code: string, state: string): Promise<string> {
		await this.validateAuthState(state);

		const requestBody: TOauthTokenExchangeParams = {
			client_id: OAUTH_GOOGLE_CLIENT_ID,
			client_secret: OAUTH_GOOGLE_CLIENT_SECRET,
			code,
			grant_type: 'authorization_code',
			redirect_uri: CALLBACK_ENDPOINT,
		};

		const response = await this.event.fetch(GoogleOauthProvider.tokenBaseUrl, {
			method: 'POST',
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			throw new Error(`Failed to get access token from ${GoogleOauthProvider.applicationSource}`);
		}

		const tokenData: TOauthTokenResponse = await response.json();
		if (!tokenData.access_token) {
			throw new Error(`Failed to get access token from ${GoogleOauthProvider.applicationSource}`);
		}

		this.deleteAuthState();

		return tokenData.access_token;
	}

	async getUserData(accessToken: string): Promise<TSimplifiedUserResponse> {
		const userData = await this.getIdentity<TGoogleUserResponse>(accessToken);
		if (!userData.email || !userData.picture || !userData.sub || !userData.name) {
			throw new Error(
				`The user data did not meet the oauth registration requirements from ${GoogleOauthProvider.applicationSource}`,
			);
		}

		return {
			email: userData.email,
			profilePictureUrl: userData.picture,
			username: userData.name,
			applicationName: 'google',
			id: userData.sub,
		};
	}
}

export class DiscordOauthProvider extends SkeletonOauthProvider implements IOauthProvider {
	public static readonly applicationSource: TOauthApplication = 'discord';
	public static readonly authScope: string = 'email identify';
	public static readonly responseType: 'code' | 'token' = 'code';
	public static readonly avatarCdnUrl: string = 'https://cdn.discordapp.com/avatars';
	public static readonly identityUrl: string = 'https://discord.com/api/users/@me';
	public static readonly authorizationBaseUrl: string = 'https://discord.com/api/oauth2/authorize';
	public static readonly tokenBaseUrl: string = 'https://discord.com/api/oauth2/token';

	constructor(event: RequestEvent) {
		super(event, DiscordOauthProvider.applicationSource);
	}

	async getIdentity<TDiscordUserResponse>(accessToken: string): Promise<TDiscordUserResponse> {
		const headers = {
			Authorization: `Bearer ${accessToken}`,
		};

		const response = await this.event.fetch(DiscordOauthProvider.identityUrl, {
			method: 'GET',
			headers,
		});
		if (!response.ok) {
			throw new Error(`Failed to get user data from ${DiscordOauthProvider.applicationSource}`);
		}

		return (await response.json()) as TDiscordUserResponse;
	}

	private getProfilePictureUrl(userId: string, avatarHash: string): string {
		const imageExtension = avatarHash.startsWith('a_') ? 'gif' : 'webp';
		return `${DiscordOauthProvider.avatarCdnUrl}/${userId}/${avatarHash}.${imageExtension}`;
	}

	async getAuthorizationUrl(): Promise<string> {
		const computedState = await this.storeAuthState();
		const authorizationParams: TOuth2AuthorizationParams = {
			state: computedState,
			client_id: OAUTH_DISCORD_CLIENT_ID,
			redirect_uri: CALLBACK_ENDPOINT,
			scope: DiscordOauthProvider.authScope,
			response_type: DiscordOauthProvider.responseType,
		};

		return `${DiscordOauthProvider.authorizationBaseUrl}?${new URLSearchParams(authorizationParams).toString()}`;
	}

	async getToken(code: string, state: string): Promise<string> {
		await this.validateAuthState(state);

		const requestData: TOauthTokenExchangeParams = {
			client_id: OAUTH_DISCORD_CLIENT_ID,
			client_secret: OAUTH_DISCORD_CLIENT_SECRET,
			redirect_uri: CALLBACK_ENDPOINT,
			grant_type: 'authorization_code',
			code,
		};
		const requestUrlParams = new URLSearchParams(requestData);

		const response = await this.event.fetch(DiscordOauthProvider.tokenBaseUrl, {
			method: 'POST',
			body: requestUrlParams.toString(),
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to get access token from ${DiscordOauthProvider.applicationSource}`);
		}

		const tokenData: TOauthTokenResponse = await response.json();
		if (!tokenData.access_token) {
			throw new Error(`Failed to get access token from ${DiscordOauthProvider.applicationSource}`);
		}

		this.deleteAuthState();

		return tokenData.access_token;
	}

	async getUserData(accessToken: string): Promise<TSimplifiedUserResponse> {
		const userData = await this.getIdentity<TDiscordUserResponse>(accessToken);
		if (
			!userData.avatar ||
			!userData.id ||
			!userData.email ||
			!userData.verified ||
			!userData.username ||
			!userData.global_name
		) {
			throw new Error(
				`The user data did not meet the oauth registration requirements from ${DiscordOauthProvider.applicationSource}`,
			);
		}

		return {
			id: userData.id,
			profilePictureUrl: this.getProfilePictureUrl(userData.id, userData.avatar),
			email: userData.email,
			username: userData.username,
			applicationName: 'discord',
			externalData: {
				global_name: userData.global_name,
			},
		};
	}
}

export class GithubOauthProvider extends SkeletonOauthProvider implements IOauthProvider {
	public static readonly applicationSource: TOauthApplication = 'github';
	public static readonly authScope: string = 'read:user user:email';
	public static readonly responseType: 'code' | 'token' = 'code';
	public static readonly identityUrl: string = 'https://api.github.com/user';
	public static readonly emailUrl: string = 'https://api.github.com/user/emails';
	public static readonly authorizationBaseUrl: string = 'https://github.com/login/oauth/authorize';
	public static readonly tokenBaseUrl: string = 'https://github.com/login/oauth/access_token';

	constructor(event: RequestEvent) {
		super(event, GithubOauthProvider.applicationSource);
	}

	async getAuthorizationUrl(): Promise<string> {
		const computedState = await this.storeAuthState();
		const authorizationParams: TOuth2AuthorizationParams = {
			client_id: OAUTH_GITHUB_CLIENT_ID,
			redirect_uri: CALLBACK_ENDPOINT,
			scope: GithubOauthProvider.authScope,
			response_type: GithubOauthProvider.responseType,
			state: computedState,
		};

		return `${GithubOauthProvider.authorizationBaseUrl}?${new URLSearchParams(authorizationParams).toString()}`;
	}

	async getEmailIdentity(accessToken: string) {
		const headers = {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
		};

		const response = await this.event.fetch(GithubOauthProvider.emailUrl, {
			method: 'GET',
			headers,
		});
		if (!response.ok) {
			throw new Error(`Failed to get user email from ${GithubOauthProvider.applicationSource}`);
		}

		const accountEmails = (await response.json()) as TGithubUserEmailResponse[];
		const primaryEmail = accountEmails.find(
			(accountEmail) => accountEmail.verified && accountEmail.primary,
		);
		if (!primaryEmail) {
			throw new Error(
				`Failed to get verified and primary user email from ${GithubOauthProvider.applicationSource}`,
			);
		}

		return primaryEmail.email;
	}

	async getIdentity<TGithubUserResponse>(accessToken: string): Promise<TGithubUserResponse> {
		const headers = {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
		};

		const response = await this.event.fetch(GithubOauthProvider.identityUrl, {
			headers,
		});
		if (!response.ok) {
			throw new Error(`Failed to get user data from ${GithubOauthProvider.applicationSource}`);
		}

		return (await response.json()) as TGithubUserResponse;
	}

	async getToken(code: string, state: string): Promise<string> {
		await this.validateAuthState(state);

		const requestBody: Omit<TOauthTokenExchangeParams, 'grant_type'> = {
			client_id: OAUTH_GITHUB_CLIENT_ID,
			client_secret: OAUTH_GITHUB_CLIENT_SECRET,
			code,
			redirect_uri: CALLBACK_ENDPOINT,
		};
		const headers = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		};

		const response = await this.event.fetch(GithubOauthProvider.tokenBaseUrl, {
			method: 'POST',
			body: JSON.stringify(requestBody),
			headers,
		});
		if (!response.ok) {
			throw new Error(`Failed to get access token from ${GithubOauthProvider.applicationSource}`);
		}

		const tokenData: TOauthTokenResponse = await response.json();
		if (!tokenData.access_token) {
			throw new Error(`Failed to get access token from ${GithubOauthProvider.applicationSource}`);
		}

		this.deleteAuthState();

		return tokenData.access_token;
	}

	async getUserData(accessToken: string): Promise<TSimplifiedUserResponse> {
		const [identityData, emailData] = await Promise.all([
			this.getIdentity<TGithubUserResponse>(accessToken),
			this.getEmailIdentity(accessToken),
		]);
		const userData = {
			...identityData,
			email: emailData,
		};

		if (!userData.login || !userData.email || !userData.avatar_url || !userData.id) {
			throw new Error(
				`The user data did not meet the oauth registration requirements from ${GithubOauthProvider.applicationSource}`,
			);
		}

		return {
			id: String(userData.id),
			email: userData.email,
			profilePictureUrl: userData.avatar_url,
			username: userData.login,
			applicationName: 'github',
		};
	}
}
