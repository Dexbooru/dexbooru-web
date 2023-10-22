<script lang="ts">
	import type { PageData } from '../$types';

	export let data: PageData;
</script>

<h1>{JSON.stringify(data.posts)}</h1>
<!-- <img src={data.posts[0].imageUrls[0]} /> -->
