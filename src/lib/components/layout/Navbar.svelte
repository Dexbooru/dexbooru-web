<script lang="ts">
	import { page } from '$app/stores';
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Button, DarkMode } from 'flowbite-svelte';
	import ProfileDropdown from './ProfileDropdown.svelte';

	const currentPath = $page.url.pathname;
</script>

<Navbar>
	<NavBrand href="/">
		<img src="/images/flowbite-svelte-icon-logo.svg" class="mr-3 h-6 sm:h-9" alt="Dexbooru Logo" />
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
		<NavLi href="/" active={currentPath === '/'}>Home</NavLi>
		<NavLi href="/search" active={currentPath === '/search'}>Search</NavLi>
		<NavLi href="/posts/latest" active={currentPath === '/posts/latest'}>Posts</NavLi>
	</NavUl>
</Navbar>
