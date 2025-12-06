<script lang="ts">
	import { enhance } from '$app/forms';
	import { type LinkedUserAccount, type UserAuthenticationSource } from '$generated/prisma/browser';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { toast } from '@zerodevx/svelte-toast';
	import DiscordSolid from 'flowbite-svelte-icons/DiscordSolid.svelte';
	import GithubSolid from 'flowbite-svelte-icons/GithubSolid.svelte';
	import GoogleSolid from 'flowbite-svelte-icons/GoogleSolid.svelte';
	import LinkOutline from 'flowbite-svelte-icons/LinkOutline.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Toggle from 'flowbite-svelte/Toggle.svelte';

	type Props = {
		linkedAccounts?: LinkedUserAccount[];
		discordAuthorizationUrl?: string;
		githubAuthorizationUrl?: string;
		googleAuthorizationUrl?: string;
		location: 'login' | 'security-settings';
	};

	let {
		discordAuthorizationUrl,
		githubAuthorizationUrl,
		googleAuthorizationUrl,
		location,
		linkedAccounts = [],
	}: Props = $props();

	let linkedAccountsUpdating = $state(false);

	let currentLinkedAccounts: LinkedUserAccount[] = $state(linkedAccounts);
	let disconnectedAccounts = $state<UserAuthenticationSource[]>([]);

	let discordAccount: LinkedUserAccount | undefined = $derived(
		currentLinkedAccounts.find((linkedAccount) => linkedAccount.platform === 'DISCORD'),
	);
	let githubAccount: LinkedUserAccount | undefined = $derived(
		currentLinkedAccounts.find((linkedAccount) => linkedAccount.platform === 'GITHUB'),
	);
	let googleAccount: LinkedUserAccount | undefined = $derived(
		currentLinkedAccounts.find((linkedAccount) => linkedAccount.platform === 'GOOGLE'),
	);

	let renderGithubLogin = $derived.by(() => {
		if (location === 'login') return true;

		return (
			!currentLinkedAccounts.some((linkedAccount) => linkedAccount.platform === 'GITHUB') &&
			githubAuthorizationUrl !== undefined &&
			githubAuthorizationUrl.length > 0
		);
	});
	let renderGoogleLogin = $derived.by(() => {
		if (location === 'login') return true;

		return (
			!currentLinkedAccounts.some((linkedAccount) => linkedAccount.platform === 'GOOGLE') &&
			googleAuthorizationUrl !== undefined &&
			googleAuthorizationUrl.length > 0
		);
	});
	let renderDiscordLogin = $derived.by(() => {
		if (location === 'login') return true;

		return (
			!currentLinkedAccounts.some((linkedAccount) => linkedAccount.platform === 'DISCORD') &&
			discordAuthorizationUrl !== undefined &&
			discordAuthorizationUrl.length > 0
		);
	});

	const updateDisconnectedAccounts = (platform: UserAuthenticationSource) => {
		if (disconnectedAccounts.includes(platform)) {
			disconnectedAccounts = disconnectedAccounts.filter(
				(disconnectedAccount) => disconnectedAccount !== platform,
			);
		} else {
			disconnectedAccounts.push(platform);
		}
	};
</script>

{#if location === 'security-settings'}
	<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Linked Accounts</h2>
{:else}
	<h2 class="text-lg text-center font-semibold text-gray-800 dark:text-gray-200">OR</h2>
	<hr />
{/if}

{#snippet LinkedAccountCell(
	platform: UserAuthenticationSource,
	account: LinkedUserAccount | undefined,
	renderLogin: boolean,
	authorizationUrl: string | undefined,
	location: 'login' | 'security-settings',
	disconnectedAccounts: UserAuthenticationSource[],
	updateDisconnectedAccounts: (_platform: UserAuthenticationSource) => void,
)}
	<div class="flex items-center justify-between space-x-2">
		<div class="flex items-center space-x-3">
			{#if platform === 'DISCORD'}
				<DiscordSolid class="w-8 h-8 text-blue-600 dark:text-blue-400" />
			{:else if platform === 'GITHUB'}
				<GithubSolid class="w-8 h-8 text-gray-800 dark:text-gray-200" />
			{:else if platform === 'GOOGLE'}
				<GoogleSolid class="w-8 h-8 text-red-600 dark:text-red-400" />
			{/if}

			<div>
				<p class="text-sm font-medium text-gray-700 dark:text-gray-300">
					{account?.platform ?? platform}
				</p>
				{#if account}
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Linked as <span class="font-semibold">{account.platformUsername}</span>
						<br />
						Display on profile?
						<span class="font-semibold">{account.isPublic ? 'Yes' : 'No'}</span>
					</p>
				{:else if !renderLogin}
					<p class="text-xs text-gray-400 dark:text-gray-500">Not linked</p>
				{/if}
			</div>
		</div>
		<div>
			{#if renderLogin}
				<Button href={authorizationUrl} size="sm" color="alternative">
					{location === 'login' ? 'Sign in' : 'Link'}
					{#if location === 'security-settings'}
						<LinkOutline class="w-4 h-4 ml-2" />
					{/if}
				</Button>
			{:else}
				<div class="flex flex-col space-y-2">
					<Button
						onclick={() => updateDisconnectedAccounts(account?.platform ?? platform)}
						size="sm"
						color="red"
					>
						{disconnectedAccounts.includes(account?.platform ?? platform) ? 'Undo' : 'Unlink'}
					</Button>
					<Toggle
						onchange={() => {
							if (account) {
								account.isPublic = !account.isPublic;
							}
						}}
						checked={account?.isPublic ?? false}
					/>
				</div>
			{/if}
		</div>
	</div>
{/snippet}

<div class="space-y-10 mt-2">
	{@render LinkedAccountCell(
		'DISCORD',
		discordAccount,
		renderDiscordLogin,
		discordAuthorizationUrl,
		location,
		disconnectedAccounts,
		updateDisconnectedAccounts,
	)}
	{@render LinkedAccountCell(
		'GITHUB',
		githubAccount,
		renderGithubLogin,
		githubAuthorizationUrl,
		location,
		disconnectedAccounts,
		updateDisconnectedAccounts,
	)}
	{@render LinkedAccountCell(
		'GOOGLE',
		googleAccount,
		renderGoogleLogin,
		googleAuthorizationUrl,
		location,
		disconnectedAccounts,
		updateDisconnectedAccounts,
	)}

	{#if location === 'security-settings'}
		<form
			use:enhance={() => {
				linkedAccountsUpdating = true;

				return async ({ result }) => {
					linkedAccountsUpdating = false;

					if (result.type === 'success') {
						toast.push('Successfully updated the linked accounts!', SUCCESS_TOAST_OPTIONS);

						const updatedLinkedAccounts = (
							result.data !== undefined ? result.data.updatedLinkedAccounts : []
						) as LinkedUserAccount[];
						currentLinkedAccounts = updatedLinkedAccounts;
					} else {
						toast.push(
							'An error occured while trying to update the linked accounts!',
							FAILURE_TOAST_OPTIONS,
						);
					}
				};
			}}
			method="POST"
			action="?/linkedAccounts"
		>
			<Input
				type="hidden"
				value={disconnectedAccounts.join(',')}
				name="disconnectedLinkedAccounts"
			/>
			<Input
				type="hidden"
				value={(discordAccount?.isPublic ?? false).toString()}
				name="isDiscordPublic"
			/>
			<Input
				type="hidden"
				value={(githubAccount?.isPublic ?? false).toString()}
				name="isGithubPublic"
			/>
			<Input
				type="hidden"
				value={(googleAccount?.isPublic ?? false).toString()}
				name="isGooglePublic"
			/>

			<Button disabled={linkedAccountsUpdating} type="submit" class="w-full" size="md"
				>Update connected apps</Button
			>
		</form>
	{/if}
</div>
