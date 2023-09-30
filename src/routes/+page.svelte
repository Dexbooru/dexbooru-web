<script lang="ts">
	import { page } from '$app/stores';
</script>

{#if $page.data.user}
	<h1>Signed in as {$page.data.user.username}</h1>
	<a href="/logout">Log out</a>
{:else}
	<a href="/login">Please log in</a>
{/if}
