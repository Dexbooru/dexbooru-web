<script lang="ts">
	import { List, Li, Heading, Popover } from 'flowbite-svelte';
	import { QuestionCircleSolid } from 'flowbite-svelte-icons';
	import type { Placement } from '@floating-ui/dom';
	
	export let requirementsPlacement: Placement = 'bottom-start';
	export let requirementsType: string;
	export let popoverButtonId: string;
	export let satisifedRequirements: string[] = [];
	export let unsatisfiedRequirements: string[] = [];
</script>

<button type="button" id={popoverButtonId}>
	<QuestionCircleSolid class="w-4 h-4 ml-1.5" />
	<span class="sr-only">Show requirements for {requirementsType}</span>
</button>
<Popover
	triggeredBy="#{popoverButtonId}"
	class="w-72 text-sm font-light text-gray-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400"
	placement={requirementsPlacement}
>
	<Heading tag="h6">Satisfied {requirementsType} requirements:</Heading>
	<List list="disc">
		{#each satisifedRequirements as satisifedRequirement}
			<Li>{satisifedRequirement}</Li>
		{/each}
	</List>

	<Heading tag="h6">Unsatisfied {requirementsType} requirements</Heading>
	<List list="disc">
		{#each unsatisfiedRequirements as unsatisfiedRequirement}
			<Li>{unsatisfiedRequirement}</Li>
		{/each}
	</List>
</Popover>
