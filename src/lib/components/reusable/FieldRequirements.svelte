<script lang="ts">
	import { List, Li, Heading } from 'flowbite-svelte';

	export let satisifedRequirements: string[] = [];
	export let unsatisfiedRequirements: string[] = [];
</script>

<Heading tag="h2">Satisfied Requirements:</Heading>
<List list="disc">
	{#each satisifedRequirements as satisifedRequirement}
		<Li>{satisifedRequirement}</Li>
	{/each}
</List>

<Heading tag="h2">Unsatisfied Requirements</Heading>
<List list="disc">
	{#each unsatisfiedRequirements as unsatisfiedRequirement}
		<Li>{unsatisfiedRequirement}</Li>
	{/each}
</List>
