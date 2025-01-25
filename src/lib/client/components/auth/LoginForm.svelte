<script lang="ts">
	import { page } from '$app/state';
	import { SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { toast } from '@zerodevx/svelte-toast';
	import EyeOutline from 'flowbite-svelte-icons/EyeOutline.svelte';
	import EyeSlashOutline from 'flowbite-svelte-icons/EyeSlashOutline.svelte';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import Checkbox from 'flowbite-svelte/Checkbox.svelte';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import { onMount } from 'svelte';
	import type { ActionData } from '../../../../routes/login/$types';
	import OauthLinks from './OauthLinks.svelte';

	type Props = {
		form: ActionData;
		googleAuthorizationUrl: string;
		discordAuthorizationUrl: string;
		githubAuthorizationUrl: string;
	};

	let { form, googleAuthorizationUrl, discordAuthorizationUrl, githubAuthorizationUrl }: Props =
		$props();

	let showPassword = $state(false);

	const loginErrorReason: string | undefined = form?.reason;

	let username: string = $state(form?.username || '');
	let password: string = $state('');
	let rememberMe: boolean = $state(false);
	let loginFormButtonDisabled = $derived.by(() => {
		return !(username.length > 0 && password.length > 0);
	});

	onMount(() => {
		const passwordReset = page.url.searchParams.get('passwordReset');
		if (passwordReset === 'true') {
			toast.push(
				'Your password was updated successfully! Try logging in now',
				SUCCESS_TOAST_OPTIONS,
			);
		}
	});
</script>

<Card class="mt-6">
	<form class="flex flex-col space-y-6" method="POST">
		<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white">
			Login to Dexbooru!
		</h3>
		<Label class="space-y-2">
			<span>Username</span>
			<Input
				bind:value={username}
				type="text"
				name="username"
				placeholder="dexboorulover1234"
				required
			/>
		</Label>
		<Label class="space-y-2">
			<span>Your password</span>
			<div class="relative">
				<Input
					bind:value={password}
					type={showPassword ? 'text' : 'password'}
					name="password"
					placeholder="•••••"
					required
				/>
				{#if showPassword}
					<EyeSlashOutline
						class="absolute top-3 right-3 cursor-pointer text-gray-400 dark:text-gray-500"
						on:click={() => (showPassword = false)}
					/>
				{:else}
					<EyeOutline
						class="absolute top-3 right-3 cursor-pointer text-gray-400 dark:text-gray-500"
						on:click={() => (showPassword = true)}
					/>
				{/if}
			</div>
		</Label>
		<div class="flex items-start">
			<Checkbox bind:checked={rememberMe}>Remember me</Checkbox>
			<Input type="hidden" name="rememberMe" value={rememberMe} />
		</div>
		<Button disabled={loginFormButtonDisabled} type="submit" class="w-full">Log in</Button>

		<OauthLinks
			{discordAuthorizationUrl}
			{googleAuthorizationUrl}
			{githubAuthorizationUrl}
			location="login"
		/>

		{#if loginErrorReason}
			<Alert color="red">
				<span class="font-medium">Login error!</span>
				{loginErrorReason}
			</Alert>
		{/if}
		<div class="flex-col space-y-1">
			<div class="text-sm font-medium text-gray-500 dark:text-gray-300">
				Not registered? <a
					href="/register"
					class="text-primary-700 hover:underline dark:text-primary-500"
				>
					Create account
				</a>
			</div>
			<div class="text-sm font-medium text-gray-500 dark:text-gray-300">
				Having trouble logging in? <a
					href="/forgot-password"
					class="text-primary-700 hover:underline dark:text-primary-500"
				>
					Forgot password
				</a>
			</div>
		</div>
	</form>
</Card>
