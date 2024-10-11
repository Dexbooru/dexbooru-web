<script lang="ts">
	import { Alert, Button, Card, Checkbox, Input, Label } from 'flowbite-svelte';
	import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
	import type { ActionData } from '../../../../routes/login/$types';

	export let form: ActionData;

	let showPassword = false;

	const loginErrorReason: string | undefined = form?.reason;
	let username: string = form?.username || '';
	let password: string = '';
	let rememberMe: boolean = false;

	let loginFormButtonDisabled = true;

	$: {
		loginFormButtonDisabled = !(username.length > 0 && password.length > 0);
	}
</script>

<Card class="w-full max-w-md mt-20">
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
