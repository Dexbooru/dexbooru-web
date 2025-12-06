<script lang="ts">
	import {
		EMAIL_REQUIREMENTS,
		PASSWORD_REQUIREMENTS,
		USERNAME_REQUIREMENTS,
	} from '$lib/shared/constants/auth';
	import CheckCircleSolid from 'flowbite-svelte-icons/CheckCircleSolid.svelte';
	import CloseCircleSolid from 'flowbite-svelte-icons/CloseCircleSolid.svelte';
	import QuestionCircleSolid from 'flowbite-svelte-icons/QuestionCircleSolid.svelte';
	import Li from 'flowbite-svelte/Li.svelte';
	import List from 'flowbite-svelte/List.svelte';
	import P from 'flowbite-svelte/P.svelte';
	import Popover from 'flowbite-svelte/Popover.svelte';

	type Props = {
		requirementsPlacement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
		requirementsType: 'email' | 'username' | 'password';
		popoverButtonId: string;
		satisifedRequirements?: string[];
		unsatisfiedRequirements?: string[];
	};

	let {
		requirementsPlacement = 'bottom-start',
		requirementsType,
		popoverButtonId,
		satisifedRequirements = [],
		unsatisfiedRequirements = [],
	}: Props = $props();
</script>

<button type="button" id={popoverButtonId}>
	<QuestionCircleSolid class="w-4 h-4 ml-1.5" />
	<span class="sr-only">Show requirements for {requirementsType}</span>
</button>
<Popover
	triggeredBy="#{popoverButtonId}"
	class="w-72 z-50 text-sm font-light text-gray-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
	placement={requirementsPlacement}
>
	<P>Satisfied {requirementsType} requirements:</P>
	<List>
		{#each satisifedRequirements as satisifedRequirement}
			<Li class="mt-2" icon>
				<CheckCircleSolid class="w-4 h-4 mr-1 text-green-500 inline" />
				<p>{satisifedRequirement}</p>
			</Li>
		{/each}
	</List>

	<List>
		{#each unsatisfiedRequirements as unsatisfiedRequirement}
			<Li class="mt-2" icon>
				<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />

				<p>{unsatisfiedRequirement}</p>
			</Li>
		{/each}
	</List>

	{#if unsatisfiedRequirements.length === 0 && satisifedRequirements.length === 0}
		{#if requirementsType === 'username'}
			{#each Object.values(USERNAME_REQUIREMENTS) as requirement}
				<Li class="mt-2" icon>
					<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
					{requirement}
				</Li>
			{/each}
		{:else if requirementsType === 'email'}
			{#each Object.values(EMAIL_REQUIREMENTS) as requirement}
				<Li class="mt-2" icon>
					<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
					{requirement}
				</Li>
			{/each}
		{:else if requirementsType === 'password'}
			{#each Object.values(PASSWORD_REQUIREMENTS) as requirement}
				<Li class="mt-2" icon>
					<CloseCircleSolid class="w-3.5 h-3.5 me-2 text-gray-500 dark:text-gray-400" />
					{requirement}
				</Li>
			{/each}
		{/if}
	{/if}
</Popover>
