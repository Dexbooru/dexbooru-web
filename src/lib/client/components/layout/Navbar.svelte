<script lang="ts">
	import { page } from '$app/state';
	import ApplicationLogo from '$lib/client/assets/app_logo.webp';
	import { getAuthenticatedUser } from '$lib/client/helpers/context';
	import { isModerationRole } from '$lib/shared/helpers/auth/role';
	import { getPathFromUrl } from '$lib/shared/helpers/urls';
	import Button from 'flowbite-svelte/Button.svelte';
	import DarkMode from 'flowbite-svelte/DarkMode.svelte';
	import Img from 'flowbite-svelte/Img.svelte';
	import NavBrand from 'flowbite-svelte/NavBrand.svelte';
	import NavHamburger from 'flowbite-svelte/NavHamburger.svelte';
	import NavLi from 'flowbite-svelte/NavLi.svelte';
	import NavUl from 'flowbite-svelte/NavUl.svelte';
	import Navbar from 'flowbite-svelte/Navbar.svelte';
	import GlobalSearchbar from '../search/GlobalSearchbar.svelte';
	import ProfileDropdown from './ProfileDropdown.svelte';

	let activeUrl: string = $derived(getPathFromUrl(page.url.href, true));

	const user = getAuthenticatedUser();
</script>

<Navbar id="app-navbar" class="sticky top-0 z-50 rounded-none bg-white dark:bg-gray-900">
	<div class="flex space-x-4">
		<NavBrand href="/">
			<Img src={ApplicationLogo} class="mr-3 h-6 rounded-md sm:h-9" alt="Dexbooru Logo" />
			<span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white"
				>Dexbooru</span
			>
		</NavBrand>
		<GlobalSearchbar />
	</div>

	<div class="flex space-x-2 md:order-2">
		{#if $user}
			<ProfileDropdown />
		{:else}
			<div class="hidden space-x-2 md:flex">
				<Button href="/login" color="blue">Log in</Button>
				<Button href="/register" color="green">Register</Button>
			</div>
		{/if}
		<DarkMode />
		<NavHamburger />
	</div>
	<NavUl class="order-1 space-x-4" {activeUrl}>
		<NavLi href="/posts">Posts</NavLi>
		<NavLi href="/tags">Tags</NavLi>
		<NavLi href="/artists">Artists</NavLi>
		<NavLi href="/comments">Comments</NavLi>
		<NavLi href="/collections">Collections</NavLi>
		<NavLi href="/analytics">Analytics</NavLi>
		{#if $user}
			<NavLi href="/posts/upload">Upload</NavLi>
			{#if isModerationRole($user.role)}
				<NavLi id="moderation-link" href="/moderation">Moderation</NavLi>
			{/if}
		{:else}
			<NavLi href="/login" class="md:hidden">Log in</NavLi>
			<NavLi href="/register" class="md:hidden">Register</NavLi>
		{/if}
	</NavUl>
</Navbar>
