<script lang="ts">
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};

	let { data }: Props = $props();
</script>

<h1 class="text-white">{JSON.stringify(data.collection.posts)}</h1>
