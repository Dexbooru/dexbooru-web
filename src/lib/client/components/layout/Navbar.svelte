<script lang="ts">
	import { page } from '$app/state';
	import ApplicationLogo from '$lib/client/assets/app_logo.webp';
	import { GLOBAL_SEARCH_MODAL_NAME } from '$lib/client/constants/layout';
	import { getActiveModal, getAuthenticatedUser } from '$lib/client/helpers/context';
	import { isModerationRole } from '$lib/shared/helpers/auth/role';
	import { getPathFromUrl } from '$lib/shared/helpers/urls';
	import BarsOutline from 'flowbite-svelte-icons/BarsOutline.svelte';
	import SearchOutline from 'flowbite-svelte-icons/SearchOutline.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import DarkMode from 'flowbite-svelte/DarkMode.svelte';
	import Img from 'flowbite-svelte/Img.svelte';
	import NavBrand from 'flowbite-svelte/NavBrand.svelte';
	import NavLi from 'flowbite-svelte/NavLi.svelte';
	import NavUl from 'flowbite-svelte/NavUl.svelte';
	import Navbar from 'flowbite-svelte/Navbar.svelte';
	import GlobalSearchbar from '../search/GlobalSearchbar.svelte';
	import MobileNavDrawer from './MobileNavDrawer.svelte';
	import ProfileDropdown from './ProfileDropdown.svelte';

	let activeUrl: string = $derived(getPathFromUrl(page.url.href, true));
	let drawerOpen = $state(false);

	const user = getAuthenticatedUser();
	const activeModal = getActiveModal();

	const openSearch = () => {
		activeModal.set({ isOpen: true, focusedModalName: GLOBAL_SEARCH_MODAL_NAME });
	};
</script>

<Navbar
	id="app-navbar"
	class="sticky top-0 z-50 w-full min-w-0 overflow-visible rounded-none bg-white dark:bg-gray-900"
>
	<div class="flex min-w-0 items-center space-x-2 sm:space-x-4">
		<NavBrand href="/" class="min-w-0">
			<Img
				src={ApplicationLogo}
				class="mr-2 h-6 shrink-0 rounded-md sm:mr-3 sm:h-9"
				alt="Dexbooru Logo"
			/>
			<span
				class="hidden self-center text-xl font-semibold whitespace-nowrap sm:inline dark:text-white"
				>Dexbooru</span
			>
		</NavBrand>
		<GlobalSearchbar />
	</div>

	<div class="flex shrink-0 items-center space-x-1 sm:space-x-2 md:order-2">
		<button
			type="button"
			class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-none md:hidden dark:text-gray-400 dark:hover:bg-gray-700"
			aria-label="Search"
			onclick={openSearch}
		>
			<SearchOutline class="h-5 w-5" />
		</button>
		{#if $user}
			<ProfileDropdown />
		{:else}
			<div class="hidden space-x-2 md:flex">
				<Button href="/login" color="blue">Log in</Button>
				<Button href="/register" color="green">Register</Button>
			</div>
		{/if}
		<DarkMode />
		<button
			type="button"
			id="mobile-nav-hamburger"
			class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-none md:hidden dark:text-gray-400 dark:hover:bg-gray-700"
			aria-label="Open main menu"
			aria-expanded={drawerOpen}
			aria-controls="mobile-nav-drawer"
			onclick={() => (drawerOpen = true)}
		>
			<BarsOutline class="h-6 w-6" />
		</button>
	</div>
	<NavUl class="hidden md:flex md:space-x-4" {activeUrl}>
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
		{/if}
	</NavUl>
</Navbar>

<MobileNavDrawer bind:open={drawerOpen} />
