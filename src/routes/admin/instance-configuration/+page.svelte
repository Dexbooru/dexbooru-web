<script lang="ts">
	import InstanceConfigurationForm from '$lib/client/components/admin/InstanceConfigurationForm.svelte';
	import SauceNaoIndexSettings from '$lib/client/components/admin/SauceNaoIndexSettings.svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Admin - Instance Configuration</title>
</svelte:head>

<main>
	<InstanceConfigurationForm initialConfiguration={data.applicationConfiguration} />
	<SauceNaoIndexSettings initialIndexes={data.sauceNaoIndexes} />
</main>
