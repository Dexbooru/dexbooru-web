<script lang="ts">
	import { getEmailRequirements } from '$lib/shared/auth/email';
	import { getPasswordRequirements } from '$lib/shared/auth/password';
	import { getUsernameRequirements } from '$lib/shared/auth/username';
	import { Alert, Button, Card, Input, Label } from 'flowbite-svelte';
	import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
	import type { ActionData } from '../../../../routes/register/$types';
	import ProfilePictureUpload from '../files/ProfilePictureUpload.svelte';
	import FieldRequirements from '../reusable/FieldRequirements.svelte';

	export let form: ActionData;

	const onUsernameChange = () => {
		const { satisfied, unsatisfied } = getUsernameRequirements(username);
		satisifedUsernameRequirements = satisfied;
		unsatisifedUsernameRequirements = unsatisfied;
	};

	const onPasswordChange = () => {
		const { satisfied, unsatisfied } = getPasswordRequirements(password);

		satisifedPasswordRequirements = satisfied;
		unsatisfiedPasswordRequirements = unsatisfied;
	};

	const onEmailChange = () => {
		const { satisfied, unsatisfied } = getEmailRequirements(email);

		satisifedEmailRequirements = satisfied;
		unsatisfiedEmailRequirements = unsatisfied;
	};

	const registerErrroReason: string | undefined = form?.reason;
	let username: string = form?.username || '';
	let email: string = form?.email || '';
	let password: string = '';
	let confirmedPassword: string = '';
	let satisifedEmailRequirements: string[] = [];
	let unsatisfiedEmailRequirements: string[] = [];
	let satisifedUsernameRequirements: string[] = [];
	let unsatisifedUsernameRequirements: string[] = [];
	let satisifedPasswordRequirements: string[] = [];
	let unsatisfiedPasswordRequirements: string[] = [];
	let showPassword = false;
	let showConfirmedPassword = false;
</script>

<Card class="w-full max-w-md mt-20">
	<form class="flex flex-col space-y-6" method="POST" enctype="multipart/form-data">
		<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white">
			Register an account on Dexbooru!
		</h3>
		<Label class="space-y-2">
			<span>Enter your username</span>
			<div class="flex space-x-2">
				<Input
					bind:value={username}
					on:input={onUsernameChange}
					type="text"
					name="username"
					placeholder="Your username"
					required
				/>
				<FieldRequirements
					requirementsPlacement="right-end"
					requirementsType="username"
					popoverButtonId="username-req-popover-btn"
					satisifedRequirements={satisifedUsernameRequirements}
					unsatisfiedRequirements={unsatisifedUsernameRequirements}
				/>
			</div>
		</Label>
		<Label class="space-y-2">
			<span>Enter your email</span>
			<div class="flex space-x-2">
				<Input
					bind:value={email}
					on:input={onEmailChange}
					type="email"
					name="email"
					placeholder="Your email"
					required
				/>

				<FieldRequirements
					requirementsPlacement="right-end"
					requirementsType="email"
					popoverButtonId="email-req-popover-btn"
					satisifedRequirements={satisifedEmailRequirements}
					unsatisfiedRequirements={unsatisfiedEmailRequirements}
				/>
			</div>
		</Label>
		<Label class="space-y-1">
			<span>Enter your password</span>
			<div class="relative">
				<div class="flex space-x-2">
					<Input
						bind:value={password}
						on:input={onPasswordChange}
						type={showPassword ? 'text' : 'password'}
						name="confirmedPassword"
						placeholder="•••••"
						required
					/>
					<FieldRequirements
						requirementsPlacement="right-end"
						requirementsType="password"
						popoverButtonId="password-req-popover-btn"
						satisifedRequirements={satisifedPasswordRequirements}
						unsatisfiedRequirements={unsatisfiedPasswordRequirements}
					/>
				</div>
				<button type="button" on:click={() => (showPassword = !showPassword)}>
					{#if showPassword}
						<EyeSlashOutline class="absolute top-3 right-10 cursor-pointer w-5 h-5 text-gray-500" />
					{:else}
						<EyeOutline class="absolute top-3 right-10 cursor-pointer w-5 h-5 text-gray-500" />
					{/if}
				</button>
			</div>
		</Label>
		<Label style="margin-top: 0px;" class="space-y-1">
			<span>Enter your password again</span>
			<div class="relative">
				<Input
					bind:value={confirmedPassword}
					on:input={onPasswordChange}
					type={showConfirmedPassword ? 'text' : 'password'}
					name="confirmedPassword"
					placeholder="•••••"
					required
				/>
				<button type="button" on:click={() => (showConfirmedPassword = !showConfirmedPassword)}>
					{#if showConfirmedPassword}
						<EyeSlashOutline class=" absolute top-3 right-3 cursor-pointer w-5 h-5 text-gray-500" />
					{:else}
						<EyeOutline class="absolute top-3 right-3 cursor-pointer w-5 h-5 text-gray-500" />
					{/if}
				</button>

				{#if password !== confirmedPassword && confirmedPassword}
					<p class="text-red-500">Passwords do not match</p>
				{/if}
			</div>
		</Label>

		<ProfilePictureUpload />

		<Button type="submit" class="w-full">Register</Button>
		{#if registerErrroReason}
			<Alert color="red">
				<span class="font-medium">Registration error!</span>
				{registerErrroReason}
			</Alert>
		{/if}
		<div class="text-sm font-medium text-gray-500 dark:text-gray-300">
			Already have an account? <a
				href="/register"
				class="text-primary-700 hover:underline dark:text-primary-500"
			>
				Login
			</a>
		</div>
	</form>
</Card>
