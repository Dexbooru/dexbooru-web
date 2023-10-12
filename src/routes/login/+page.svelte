<script lang="ts">
	import LoginForm from '$lib/client/components/auth/LoginForm.svelte';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<main class="flex justify-center items-center">
	<LoginForm {form} />
</main>
