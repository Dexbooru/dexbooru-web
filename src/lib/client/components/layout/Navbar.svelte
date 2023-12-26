<script lang="ts">
	import { page } from '$app/stores';
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Button, DarkMode } from 'flowbite-svelte';
	import ProfileDropdown from './ProfileDropdown.svelte';
	const currentPath = $page.url.pathname;
</script>

<Navbar class="sticky top-0 z-50">
	<NavBrand href="/">
		<img
			src="https://avatars.pfptown.com/393/makima-pfp-3207.png"
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
		<NavLi href="/search" active={currentPath === '/search'}>Search</NavLi>
		<NavLi href="/posts/upload" active={currentPath === '/posts/upload'}>Upload!</NavLi>
	</NavUl>
</Navbar>
