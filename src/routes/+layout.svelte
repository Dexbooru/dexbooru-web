<script lang="ts">
	import Footer from '$lib/components/layout/Footer.svelte';
	import Navbar from '$lib/components/layout/Navbar.svelte';

	import '../app.postcss';
</script>

<Navbar />
<slot />
<Footer />
