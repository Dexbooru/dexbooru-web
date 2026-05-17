<script lang="ts">
	import type { TAuthFormRequirementData } from '$lib/client/types/stores';
	import { getApplicationConfiguration } from '$lib/client/helpers/context';
	import { EMAIL_REGEX, SPECIAL_CHARACTER_REGEX } from '$lib/shared/constants/auth';
	import Input from 'flowbite-svelte/Input.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import Toggle from 'flowbite-svelte/Toggle.svelte';

	import type { Writable } from 'svelte/store';
	import FieldRequirements from '../reusable/FieldRequirements.svelte';

	type Props = {
		input: string;
		inputName: string;
		comparisonInput?: string | null;
		labelTitle: string;
		labelStyling?: string;
		inputFieldType: 'username' | 'email' | 'password' | 'password-confirm' | 'otp-code';
		showRequirements?: boolean;
		formStore?: Writable<TAuthFormRequirementData> | null;
	};

	let {
		input = $bindable(),
		inputName,
		comparisonInput = $bindable(),
		labelTitle,
		labelStyling = '',
		inputFieldType,
		showRequirements = true,
		formStore = null,
	}: Props = $props();

	let satisfiedRequirements: string[] = $state([]);
	let unsatisfiedRequirements: string[] = $state([]);
	let showPassword = $state(false);
	let showConfirmedPassword = $state(false);
	const applicationConfiguration = getApplicationConfiguration();

	const usernameLengthMessage = $derived(
		`The username must be between ${$applicationConfiguration.minimumUsernameLength} and ${$applicationConfiguration.maximumUsernameLength} characters long`,
	);
	const usernameSpacesMessage =
		'The username must not contain any leading, trailing or inline spaces';
	const usernameHtmlMessage = `The username must not contain HTML special characters (e.g. &, <, >, ", ')`;
	const emailLengthMessage = 'The email must be between 1 and 254 characters long';
	const emailValidityMessage = 'The email must have a @ sign and a valid domain after it';
	const passwordLengthMessage = $derived(
		`The password must be between ${$applicationConfiguration.minimumPasswordLength} and ${$applicationConfiguration.maximumPasswordLength} characters long`,
	);
	const passwordLowercaseMessage = 'The password must contain at least one lowercase character';
	const passwordUppercaseMessage = 'The password must contain at least one uppercase character';
	const passwordNumberMessage = 'The password must contain at least one number';
	const passwordSpecialMessage = 'The password must contain at least one special charcter';

	const usernameFallbackRequirements = $derived([
		usernameLengthMessage,
		usernameSpacesMessage,
		usernameHtmlMessage,
	]);
	const emailFallbackRequirements = $derived([emailLengthMessage, emailValidityMessage]);
	const passwordFallbackRequirements = $derived([
		passwordLengthMessage,
		passwordLowercaseMessage,
		passwordUppercaseMessage,
		passwordNumberMessage,
		passwordSpecialMessage,
	]);

	$effect(() => {
		if (inputFieldType === 'username') onUsernameChange();
		else if (inputFieldType === 'email') onEmailChange();
		else if (inputFieldType === 'password') onPasswordChange();
		else if (inputFieldType === 'password-confirm') onConfirmedPasswordChange();
	});

	const onUsernameChange = () => {
		if (!input) {
			satisfiedRequirements = [];
			unsatisfiedRequirements = [...usernameFallbackRequirements];

			if (formStore) {
				formStore.update((data) => {
					return {
						...data,
						username: {
							satisfied: [],
							unsatisfied: [...usernameFallbackRequirements],
						},
					};
				});
			}
			return;
		}

		const satisfied: string[] = [];
		const unsatisfied: string[] = [];
		const hasSpaces = input.includes(' ');
		const hasHtmlSpecialChars = /[&<>"']/.test(input);
		const usernameLengthWithoutSpaces = input.replace(/\s/g, '').length;
		const lengthOutOfBounds =
			usernameLengthWithoutSpaces < $applicationConfiguration.minimumUsernameLength ||
			usernameLengthWithoutSpaces > $applicationConfiguration.maximumUsernameLength;

		if (hasHtmlSpecialChars) unsatisfied.push(usernameHtmlMessage);
		else satisfied.push(usernameHtmlMessage);
		if (lengthOutOfBounds) unsatisfied.push(usernameLengthMessage);
		else satisfied.push(usernameLengthMessage);
		if (hasSpaces) unsatisfied.push(usernameSpacesMessage);
		else satisfied.push(usernameSpacesMessage);

		satisfiedRequirements = satisfied;
		unsatisfiedRequirements = unsatisfied;

		if (formStore) {
			formStore.update((data) => {
				return {
					...data,
					username: { satisfied, unsatisfied },
				};
			});
		}
	};

	const onPasswordChange = () => {
		if (!input) {
			satisfiedRequirements = [];
			unsatisfiedRequirements = [...passwordFallbackRequirements];

			if (formStore) {
				formStore.update((data) => {
					return {
						...data,
						password: {
							satisfied: [],
							unsatisfied: [...passwordFallbackRequirements],
						},
					};
				});
			}
			return;
		}

		const satisfied: string[] = [];
		const unsatisfied: string[] = [];
		const inRange =
			input.length >= $applicationConfiguration.minimumPasswordLength &&
			input.length <= $applicationConfiguration.maximumPasswordLength;
		if (inRange) satisfied.push(passwordLengthMessage);
		else unsatisfied.push(passwordLengthMessage);

		const hasUppercaseCharacter = /[A-Z]/.test(input);
		const hasLowercaseCharacter = /[a-z]/.test(input);
		const hasNumber = /[0-9]/.test(input);
		const hasSpecialCharacter = SPECIAL_CHARACTER_REGEX.test(input);
		if (hasLowercaseCharacter) satisfied.push(passwordLowercaseMessage);
		else unsatisfied.push(passwordLowercaseMessage);
		if (hasUppercaseCharacter) satisfied.push(passwordUppercaseMessage);
		else unsatisfied.push(passwordUppercaseMessage);
		if (hasNumber) satisfied.push(passwordNumberMessage);
		else unsatisfied.push(passwordNumberMessage);
		if (hasSpecialCharacter) satisfied.push(passwordSpecialMessage);
		else unsatisfied.push(passwordSpecialMessage);

		satisfiedRequirements = satisfied;
		unsatisfiedRequirements = unsatisfied;

		if (formStore) {
			formStore.update((data) => {
				return {
					...data,
					password: { satisfied, unsatisfied },
				};
			});
		}
	};

	const onConfirmedPasswordChange = () => {
		if (formStore) {
			formStore.update((data) => {
				return {
					...data,
					confirmedPassword: input === comparisonInput,
				};
			});
		}
	};

	const onEmailChange = () => {
		if (!input) {
			satisfiedRequirements = [];
			unsatisfiedRequirements = [...emailFallbackRequirements];

			if (formStore) {
				formStore.update((data) => {
					return {
						...data,
						email: {
							satisfied: [],
							unsatisfied: [...emailFallbackRequirements],
						},
					};
				});
			}
			return;
		}

		const satisfied: string[] = [];
		const unsatisfied: string[] = [];
		if (input.length >= 1 && input.length <= 254) satisfied.push(emailLengthMessage);
		else unsatisfied.push(emailLengthMessage);
		if (EMAIL_REGEX.test(input)) satisfied.push(emailValidityMessage);
		else unsatisfied.push(emailValidityMessage);

		satisfiedRequirements = satisfied;
		unsatisfiedRequirements = unsatisfied;

		if (formStore) {
			formStore.update((data) => {
				return {
					...data,
					email: { satisfied, unsatisfied },
				};
			});
		}
	};
</script>

<Label style={labelStyling} class="space-y-2">
	{#if inputFieldType === 'password'}
		<span>{labelTitle}</span>
		<div class="flex flex-col space-y-2">
			<div class="flex space-x-2">
				<Input
					bind:value={input}
					oninput={onPasswordChange}
					type={showPassword ? 'text' : 'password'}
					name={inputName}
					placeholder="•••••"
					required
					maxlength={$applicationConfiguration.maximumPasswordLength}
				/>
				{#if showRequirements}
					<FieldRequirements
						requirementsPlacement="right-end"
						requirementsType="password"
						popoverButtonId="password-req-popover-btn"
						satisifedRequirements={satisfiedRequirements}
						{unsatisfiedRequirements}
						fallbackRequirements={passwordFallbackRequirements}
					/>
				{/if}
			</div>
			<Toggle bind:checked={showPassword}>Show password</Toggle>
		</div>
	{:else if inputFieldType === 'password-confirm'}
		<span>{labelTitle}</span>
		<div class="flex flex-col space-y-2">
			<Input
				bind:value={input}
				oninput={onConfirmedPasswordChange}
				type={showConfirmedPassword ? 'text' : 'password'}
				name={inputName}
				placeholder="•••••"
				required
				maxlength={$applicationConfiguration.maximumPasswordLength}
			/>
			<Toggle bind:checked={showConfirmedPassword}>Show password</Toggle>

			{#if input !== comparisonInput && input.length > 0}
				<p class="text-red-500">Passwords do not match</p>
			{/if}
		</div>
	{:else if inputFieldType === 'username'}
		<span>{labelTitle}</span>
		<div class="flex space-x-2">
			<Input
				bind:value={input}
				oninput={onUsernameChange}
				type="text"
				name={inputName}
				placeholder="Your username"
				required
				maxlength={$applicationConfiguration.maximumUsernameLength}
			/>
			<FieldRequirements
				requirementsPlacement="right-end"
				requirementsType="username"
				popoverButtonId="username-req-popover-btn"
				satisifedRequirements={satisfiedRequirements}
				{unsatisfiedRequirements}
				fallbackRequirements={usernameFallbackRequirements}
			/>
		</div>
	{:else if inputFieldType === 'email'}
		<span>{labelTitle}</span>
		<div class="flex space-x-2">
			<Input
				bind:value={input}
				oninput={onEmailChange}
				type="email"
				name={inputName}
				placeholder="Your email"
				required
				maxlength={254}
			/>

			<FieldRequirements
				requirementsPlacement="right-end"
				requirementsType="email"
				popoverButtonId="email-req-popover-btn"
				satisifedRequirements={satisfiedRequirements}
				{unsatisfiedRequirements}
				fallbackRequirements={emailFallbackRequirements}
			/>
		</div>
	{:else if inputFieldType === 'otp-code'}
		<span>{labelTitle}</span>
		<Input
			id="otpCode"
			name="otpCode"
			type="text"
			maxlength={6}
			pattern="[0-9]*"
			bind:value={input}
			placeholder="Enter the code from your app"
			required
			autocomplete="off"
		/>
	{/if}
</Label>
