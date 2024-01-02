<script lang="ts">
	import { page } from '$app/stores';
	import { Button, DarkMode, NavBrand, NavHamburger, NavLi, NavUl, Navbar } from 'flowbite-svelte';
	import ProfileDropdown from './ProfileDropdown.svelte';

	const currentPath = $page.url.pathname;
</script>

<Navbar class="sticky top-0 z-50">
	<NavBrand href="/">
		<img
			src="favicon.png"
			class="mr-3 h-6 sm:h-9"
			alt="Dexbooru Logo"
		/>
		<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Dexbooru</span
		>
	</NavBrand>
	<div class="flex md:order-2 space-x-2">
		{#if $page.data.user}
			<ProfileDropdown />
		{:else}
			<Button href="/login" color="blue">Log in</Button>
			<Button href="/register" color="green">Register</Button>
		{/if}
		<DarkMode />
		<NavHamburger />
	</div>
	<NavUl class="order-1">
		<NavLi data-sveltekit-reload href="/" active={currentPath === '/'}>Home</NavLi>
		<NavLi href="/tags" active={currentPath === '/tags'}>Tags</NavLi>
		<NavLi href="/artists" active={currentPath === '/tags'}>Artists</NavLi>
		<NavLi href="/posts/upload" active={currentPath === '/posts/upload'}>Upload</NavLi>
	</NavUl>
</Navbar>
