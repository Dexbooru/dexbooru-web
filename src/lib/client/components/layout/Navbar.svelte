<script lang="ts">
	import { page } from '$app/state';
	import { getAuthenticatedUser } from '$lib/client/helpers/context';
	import { getPathFromUrl } from '$lib/shared/helpers/urls';
	import { Button, DarkMode, NavBrand, NavHamburger, NavLi, NavUl, Navbar } from 'flowbite-svelte';
	import GlobalSearchbar from '../search/GlobalSearchbar.svelte';
	import ProfileDropdown from './ProfileDropdown.svelte';

	let activeUrl: string = $derived(getPathFromUrl(page.url.href, true));

	const user = getAuthenticatedUser();
</script>

<Navbar id="app-navbar" class="sticky top-0 z-50 bg-white dark:bg-gray-900 rounded-none">
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
		{#if $user}
			<ProfileDropdown />
		{:else}
			<Button href="/login" color="blue">Log in</Button>
			<Button href="/register" color="green">Register</Button>
		{/if}
		<DarkMode />
		<NavHamburger />
	</div>
	<NavUl class="order-1" {activeUrl}>
		<NavLi href="/posts">Posts</NavLi>
		<NavLi href="/tags">Tags</NavLi>
		<NavLi href="/artists">Artists</NavLi>
		<NavLi href="/comments">Comments</NavLi>
		<NavLi href="/collections">Collections</NavLi>
		{#if $user}
			<NavLi href="/posts/upload">Upload</NavLi>
			<NavLi href="/chat">Chat</NavLi>
		{/if}
	</NavUl>
</Navbar>
