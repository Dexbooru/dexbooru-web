<script lang="ts">
	import { getEmailRequirements } from '$lib/shared/auth/email';
	import { getPasswordRequirements } from '$lib/shared/auth/password';
	import { getUsernameRequirements } from '$lib/shared/auth/username';
	import { Input, Label, Toggle } from 'flowbite-svelte';
	import FieldRequirements from '../reusable/FieldRequirements.svelte';

	export let input: string;
	export let inputName: string;
	export let comparisonInput: string | null = null;
	export let labelTitle: string;
	export let labelStyling: string = '';
	export let inputFieldType: 'username' | 'email' | 'password' | 'password-confirm';
	export let showRequirements: boolean = true;

	let satisfiedRequirements: string[] = [];
	let unsatisfiedRequirements: string[] = [];
	let showPassword = false;
	let showConfirmedPassword = false;

	const onUsernameChange = () => {
		const { satisfied, unsatisfied } = getUsernameRequirements(input);
		satisfiedRequirements = satisfied;
		unsatisfiedRequirements = unsatisfied;
	};

	const onPasswordChange = () => {
		const { satisfied, unsatisfied } = getPasswordRequirements(input);

		satisfiedRequirements = satisfied;
		unsatisfiedRequirements = unsatisfied;
	};

	const onEmailChange = () => {
		const { satisfied, unsatisfied } = getEmailRequirements(input);

		satisfiedRequirements = satisfied;
		unsatisfiedRequirements = unsatisfied;
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
				type={showConfirmedPassword ? 'text' : 'password'}
				name={inputName}
				placeholder="•••••"
				required
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
			/>

			<FieldRequirements
				requirementsPlacement="right-end"
				requirementsType="email"
				popoverButtonId="email-req-popover-btn"
				satisifedRequirements={satisfiedRequirements}
				{unsatisfiedRequirements}
			/>
		</div>
	{/if}
</Label>
