<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
	const { post } = data;
</script>

<h1>{JSON.stringify(post)}</h1>
