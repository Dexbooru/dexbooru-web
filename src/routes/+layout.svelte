<script lang="ts">
	import Footer from '$lib/client/components/layout/Footer.svelte';
	import Navbar from '$lib/client/components/layout/Navbar.svelte';

	import '../app.postcss';
</script>

<Navbar />
<div style="flex:1;">
	<slot />
</div>
<Footer />
