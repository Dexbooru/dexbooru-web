<script lang="ts">
	import { getRegisterFormAuthRequirements } from '$lib/client/helpers/context';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Card from 'flowbite-svelte/Card.svelte';
	import type { ActionData } from '../../../../routes/register/$types';
	import ProfilePictureUpload from '../files/ProfilePictureUpload.svelte';
	import AuthInput from './AuthInput.svelte';

	type Props = {
		form: ActionData;
	};

	let { form }: Props = $props();

	const registerFormRequirements = getRegisterFormAuthRequirements();
	const registerErrorReason: string | undefined = $derived(form?.reason);
	let username = $state('');
	let email = $state('');
	let password = $state('');
	let confirmedPassword = $state('');

	$effect(() => {
		const formUsername = form?.username;
		const formEmail = form?.email;
		if (formUsername !== undefined) username = formUsername;
		if (formEmail !== undefined) email = formEmail;
	});

	const registerButtonDisabled = $derived.by(() => {
		const data = $registerFormRequirements;
		const isValid =
			email.length > 0 &&
			username.length > 0 &&
			password.length > 0 &&
			confirmedPassword.length > 0 &&
			(data.username?.unsatisfied?.length ?? 1) === 0 &&
			(data.password?.unsatisfied?.length ?? 1) === 0 &&
			(data.email?.unsatisfied?.length ?? 1) === 0 &&
			data.confirmedPassword === true;
		return !isValid;
	});
</script>

<Card class="mx-3 mt-5 mb-5 w-full max-w-md p-6 shadow-lg">
	<form
		class="flex flex-col space-y-6"
		method="POST"
		enctype="multipart/form-data"
		onsubmit={(event) => {
			if (registerButtonDisabled) event.preventDefault();
		}}
	>
		<h3 class="text-center text-lg font-medium text-gray-900 sm:text-xl dark:text-white">
			Register an account on Dexbooru!
		</h3>
		<AuthInput
			inputFieldType="username"
			inputName="username"
			labelTitle="Enter your username"
			bind:input={username}
			formStore={registerFormRequirements}
		/>
		<AuthInput
			inputFieldType="email"
			inputName="email"
			labelTitle="Enter your email"
			bind:input={email}
			formStore={registerFormRequirements}
		/>
		<AuthInput
			inputFieldType="password"
			inputName="password"
			labelTitle="Enter your password"
			labelStyling="margin-bottom: 20px;"
			bind:input={password}
			formStore={registerFormRequirements}
		/>
		<AuthInput
			inputFieldType="password-confirm"
			inputName="confirmedPassword"
			labelTitle="Confirm your password"
			labelStyling="margin-top: 0px; margin-bottom: 20px;"
			bind:input={confirmedPassword}
			bind:comparisonInput={password}
			formStore={registerFormRequirements}
		/>

		<ProfilePictureUpload />

		<Button
			disabled={registerButtonDisabled}
			type="submit"
			class="w-full {registerButtonDisabled ? '' : 'opacity-100!'}"
		>
			Register
		</Button>
		{#if registerErrorReason}
			<Alert color="red">
				<span class="font-medium">Registration error!</span>
				{registerErrorReason}
			</Alert>
		{/if}
		<div class="text-sm font-medium text-gray-500 dark:text-gray-300">
			Already have an account? <a
				href="/login"
				class="text-primary-700 dark:text-primary-500 hover:underline"
			>
				Login
			</a>
		</div>
	</form>
</Card>
