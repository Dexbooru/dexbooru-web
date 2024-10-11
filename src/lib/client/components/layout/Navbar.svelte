<script lang="ts">
	import { page } from '$app/stores';
	import { authenticatedUserStore } from '$lib/client/stores/users';
	import { getPathFromUrl } from '$lib/shared/helpers/urls';
	import { Button, DarkMode, NavBrand, NavHamburger, NavLi, NavUl, Navbar } from 'flowbite-svelte';
	import GlobalSearchbar from '../search/GlobalSearchbar.svelte';
	import ProfileDropdown from './ProfileDropdown.svelte';

	let activeUrl: string;

	$: {
		activeUrl = getPathFromUrl($page.url.href, true);
	}
</script>

<Navbar id="app-navbar" class="sticky top-0 z-50">
	<div class="flex space-x-4">
		<NavBrand href="/">
			<img src="/favicon.png" class="mr-3 h-6 sm:h-9 rounded-md" alt="Dexbooru Logo" />
			<span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
				>Dexbooru</span
			>
		</NavBrand>
		<GlobalSearchbar />
	</div>

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
	<NavUl class="order-1" {activeUrl}>
		<NavLi href="/">Home</NavLi>
		<NavLi href="/tags">Tags</NavLi>
		<NavLi href="/artists">Artists</NavLi>
		<NavLi href="/collections">Collections</NavLi>
		{#if $authenticatedUserStore}
			<NavLi href="/posts/upload">Upload</NavLi>
			<NavLi href="/chat">Chat</NavLi>
		{/if}
	</NavUl>
</Navbar>
