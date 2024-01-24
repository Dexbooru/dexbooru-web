<script lang="ts">
	import { page } from '$app/stores';
	import { authenticatedUserStore } from '$lib/client/stores/users';
	import { Button, DarkMode, NavBrand, NavHamburger, NavLi, NavUl, Navbar } from 'flowbite-svelte';
	import ProfileDropdown from './ProfileDropdown.svelte';

	const currentPath = $page.url.pathname;
</script>

<Navbar class="sticky top-0 z-50">
	<NavBrand href="/">
		<img src="/favicon.png" class="mr-3 h-6 sm:h-9 rounded-md" alt="Dexbooru Logo" />
		<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Dexbooru</span
		>
	</NavBrand>
	<div class="flex md:order-2 space-x-2">
		{#if $authenticatedUserStore}
			<ProfileDropdown />
		{:else}
			<Button href="/login" color="blue">Log in</Button>
			<Button href="/register" color="green">Register</Button>
		{/if}
		<DarkMode />
		<NavHamburger />
	</div>
	<NavUl class="order-1">
		<NavLi href="/" active={currentPath === '/'}>Home</NavLi>
		<NavLi href="/tags" active={currentPath === '/tags'}>Tags</NavLi>
		<NavLi href="/artists" active={currentPath === '/tags'}>Artists</NavLi>
		{#if $authenticatedUserStore}
			<NavLi href="/posts/upload" active={currentPath === '/posts/upload'}>Upload</NavLi>
		{/if}
	</NavUl>
</Navbar>
