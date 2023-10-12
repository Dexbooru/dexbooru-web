<script lang="ts">
	import { Card, Button, Label, Input, Alert } from 'flowbite-svelte';
	import type { ActionData } from '../../../../routes/register/$types';
	import { getUsernameRequirements } from '$lib/shared/auth/username';
	import { getPasswordRequirements } from '$lib/shared/auth/password';
	import { getEmailRequirements } from '$lib/shared/auth/email';
	import FieldRequirements from '../reusable/FieldRequirements.svelte';
	import ProfilePictureUpload from '../files/ProfilePictureUpload.svelte';

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
					placeholder="dexboorulover1234"
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
					placeholder="dexbooru@gmail.com"
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
		<Label class="space-y-2">
			<span>Enter your password</span>
			<div class="flex space-x-2">
				<Input bind:value={password} type="password" name="password" placeholder="•••••" required />
				<FieldRequirements
					requirementsPlacement="right-end"
					requirementsType="password"
					popoverButtonId="password-req-popover-btn"
					satisifedRequirements={satisifedPasswordRequirements}
					unsatisfiedRequirements={unsatisfiedPasswordRequirements}
				/>
			</div>
		</Label>
		<Label class="space-y-2">
			<span>Enter your password again</span>
			<Input
				bind:value={confirmedPassword}
				on:input={onPasswordChange}
				type="password"
				name="confirmedPassword"
				placeholder="•••••"
				required
			/>
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
