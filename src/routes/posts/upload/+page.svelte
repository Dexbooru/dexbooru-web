<script lang="ts">
	import UploadForm from '$lib/client/components/posts/UploadForm.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<svelte:head>
	<title>Upload a post</title>
</svelte:head>

<UploadForm {form} />
