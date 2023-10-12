<script lang="ts">
	import type { ActionData } from './$types';
	import RegisterForm from '$lib/client/components/auth/RegisterForm.svelte';

	export let form: ActionData;
</script>

<main class="flex justify-center items-center">
	<RegisterForm {form} />
</main>
