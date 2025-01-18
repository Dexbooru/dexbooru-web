<script lang="ts">
	import type { TAuthFormRequirementData } from '$lib/client/types/stores';
	import {
		MAXIMUM_EMAIL_LENGTH,
		MAXIMUM_PASSWORD_LENGTH,
		MAXIMUM_USERNAME_LENGTH,
	} from '$lib/shared/constants/auth';
	import { getEmailRequirements } from '$lib/shared/helpers/auth/email';
	import { getPasswordRequirements } from '$lib/shared/helpers/auth/password';
	import { getUsernameRequirements } from '$lib/shared/helpers/auth/username';
	import { Input, Label, Toggle } from 'flowbite-svelte';
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

	const onUsernameChange = () => {
		const { satisfied, unsatisfied } = getUsernameRequirements(input);
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
		const { satisfied, unsatisfied } = getPasswordRequirements(input);

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
		const { satisfied, unsatisfied } = getEmailRequirements(input);

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
					on:input={onPasswordChange}
					type={showPassword ? 'text' : 'password'}
					name={inputName}
					placeholder="•••••"
					required
					maxlength={MAXIMUM_PASSWORD_LENGTH}
				/>
				{#if showRequirements}
					<FieldRequirements
						requirementsPlacement="right-end"
						requirementsType="password"
						popoverButtonId="password-req-popover-btn"
						satisifedRequirements={satisfiedRequirements}
						{unsatisfiedRequirements}
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
				on:input={onConfirmedPasswordChange}
				type={showConfirmedPassword ? 'text' : 'password'}
				name={inputName}
				placeholder="•••••"
				required
				maxlength={MAXIMUM_PASSWORD_LENGTH}
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
				on:input={onUsernameChange}
				type="text"
				name={inputName}
				placeholder="Your username"
				required
				maxlength={MAXIMUM_USERNAME_LENGTH}
			/>
			<FieldRequirements
				requirementsPlacement="right-end"
				requirementsType="username"
				popoverButtonId="username-req-popover-btn"
				satisifedRequirements={satisfiedRequirements}
				{unsatisfiedRequirements}
			/>
		</div>
	{:else if inputFieldType === 'email'}
		<span>{labelTitle}</span>
		<div class="flex space-x-2">
			<Input
				bind:value={input}
				on:input={onEmailChange}
				type="email"
				name={inputName}
				placeholder="Your email"
				required
				maxlength={MAXIMUM_EMAIL_LENGTH}
			/>

			<FieldRequirements
				requirementsPlacement="right-end"
				requirementsType="email"
				popoverButtonId="email-req-popover-btn"
				satisifedRequirements={satisfiedRequirements}
				{unsatisfiedRequirements}
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
