<script lang="ts">
	import { Alert, Button, Card } from 'flowbite-svelte';
	import type { ActionData } from '../../../../routes/register/$types';
	import ProfilePictureUpload from '../files/ProfilePictureUpload.svelte';
	import AuthInput from './AuthInput.svelte';

	export let form: ActionData;

	const registerErrroReason: string | undefined = form?.reason;
	let username: string = form?.username || '';
	let email: string = form?.email || '';
	let password: string = '';
	let confirmedPassword: string = '';
</script>

<Card class="w-full max-w-md mt-5 mb-5">
	<form class="flex flex-col space-y-6" method="POST" enctype="multipart/form-data">
		<h3 class="text-xl text-center font-medium text-gray-900 dark:text-white">
			Register an account on Dexbooru!
		</h3>
		<AuthInput
			inputFieldType="username"
			inputName="username"
			labelTitle="Enter your username"
			bind:input={username}
		/>
		<AuthInput
			inputFieldType="email"
			inputName="email"
			labelTitle="Enter your email"
			bind:input={email}
		/>
		<AuthInput
			inputFieldType="password"
			inputName="password"
			labelTitle="Enter your password"
			labelStyling="margin-bottom: 20px;"
			bind:input={password}
		/>
		<AuthInput
			inputFieldType="password-confirm"
			inputName="confirmedPassword"
			labelTitle="Confirm your password"
			labelStyling="margin-top: 0px; margin-bottom: 20px;"
			bind:input={confirmedPassword}
			bind:comparisonInput={password}
		/>

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
				href="/login"
				class="text-primary-700 hover:underline dark:text-primary-500"
			>
				Login
			</a>
		</div>
	</form>
</Card>
