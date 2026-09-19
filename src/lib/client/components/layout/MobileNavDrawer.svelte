<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { GLOBAL_SEARCH_MODAL_NAME } from '$lib/client/constants/layout';
	import { getActiveModal, getAuthenticatedUser } from '$lib/client/helpers/context';
	import { clearPostDraft } from '$lib/client/helpers/drafts';
	import { isModerationRole, isOwnerRole } from '$lib/shared/helpers/auth/role';
	import CloseOutline from 'flowbite-svelte-icons/CloseOutline.svelte';
	import SearchOutline from 'flowbite-svelte-icons/SearchOutline.svelte';

	type Props = {
		open: boolean;
	};

	let { open = $bindable(false) }: Props = $props();

	const user = getAuthenticatedUser();
	const activeModal = getActiveModal();

	const closeDrawer = () => {
		open = false;
	};

	const isActive = (href: string) => {
		if (href === '/') return page.url.pathname === '/';
		if (page.url.pathname === href) return true;
		if (href === '/profile/logout' || href === '/profile/settings') {
			return false;
		}
		return page.url.pathname.startsWith(`${href}/`);
	};

	const linkClass = (href: string) =>
		`block rounded-lg px-3 py-2.5 text-sm font-medium ${
			isActive(href)
				? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
				: 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
		}`;

	const openSearch = () => {
		closeDrawer();
		activeModal.set({ isOpen: true, focusedModalName: GLOBAL_SEARCH_MODAL_NAME });
	};

	const onKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape' && open) {
			closeDrawer();
		}
	};

	afterNavigate(() => {
		closeDrawer();
	});
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="fixed inset-0 z-[60] bg-gray-900/50" role="presentation" onclick={closeDrawer}></div>
	<aside
		id="mobile-nav-drawer"
		class="fixed inset-y-0 right-0 z-[70] flex w-80 max-w-[min(20rem,100vw)] flex-col overflow-y-auto border-l border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
		role="dialog"
		aria-modal="true"
		aria-labelledby="mobile-nav-title"
	>
		<div class="mb-4 flex items-center justify-between">
			<h2 id="mobile-nav-title" class="text-lg font-semibold text-gray-900 dark:text-white">
				Menu
			</h2>
			<button
				type="button"
				class="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
				aria-label="Close drawer"
				onclick={closeDrawer}
			>
				<CloseOutline class="h-5 w-5" />
			</button>
		</div>

		<nav class="flex flex-col gap-6 pb-8">
			<section class="space-y-1">
				<h3
					class="px-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Search
				</h3>
				<button
					type="button"
					class="{linkClass('/search')} flex w-full items-center gap-2"
					onclick={openSearch}
				>
					<SearchOutline class="h-4 w-4" />
					Search
				</button>
			</section>

			<section class="space-y-1">
				<h3
					class="px-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Browse
				</h3>
				<a class={linkClass('/posts')} href="/posts">Posts</a>
				<a class={linkClass('/tags')} href="/tags">Tags</a>
				<a class={linkClass('/artists')} href="/artists">Artists</a>
				<a class={linkClass('/comments')} href="/comments">Comments</a>
				<a class={linkClass('/collections')} href="/collections">Collections</a>
				<a class={linkClass('/analytics')} href="/analytics">Analytics</a>
			</section>

			{#if $user}
				<section class="space-y-1">
					<h3
						class="px-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
					>
						Create
					</h3>
					<a class={linkClass('/posts/upload')} href="/posts/upload">Upload</a>
				</section>

				<section class="space-y-1">
					<h3
						class="px-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
					>
						Account
					</h3>
					<a class={linkClass(`/profile/${$user.username}`)} href="/profile/{$user.username}"
						>Your Profile</a
					>
					<a class={linkClass('/posts/uploaded')} href="/posts/uploaded">Your Posts</a>
					<a class={linkClass('/collections/created')} href="/collections/created"
						>Your Collections</a
					>
					<a class={linkClass('/comments/created')} href="/comments/created">Your Comments</a>
					<a class={linkClass('/friends')} href="/friends">Your Friends</a>
					<a class={linkClass('/posts/liked')} href="/posts/liked">Liked Posts</a>
					<a class={linkClass('/profile/settings')} href="/profile/settings">Settings</a>
					<a
						class={linkClass('/profile/logout')}
						href="/profile/logout"
						data-sveltekit-reload
						data-sveltekit-preload-data="off"
						rel="external"
						onclick={clearPostDraft}>Sign out</a
					>
				</section>

				{#if isModerationRole($user.role) || isOwnerRole($user.role)}
					<section class="space-y-1">
						<h3
							class="px-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
						>
							Staff
						</h3>
						{#if isModerationRole($user.role)}
							<a id="moderation-link-mobile" class={linkClass('/moderation')} href="/moderation"
								>Moderation</a
							>
						{/if}
						{#if isOwnerRole($user.role)}
							<a
								class={linkClass('/admin/instance-configuration')}
								href="/admin/instance-configuration">Instance Configuration</a
							>
						{/if}
					</section>
				{/if}
			{:else}
				<section class="space-y-1">
					<h3
						class="px-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400"
					>
						Account
					</h3>
					<a class={linkClass('/login')} href="/login">Log in</a>
					<a class={linkClass('/register')} href="/register">Register</a>
				</section>
			{/if}
		</nav>
	</aside>
{/if}
