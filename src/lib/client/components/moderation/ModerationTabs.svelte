<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PostCollectionReport, PostReport, UserReport } from '$generated/prisma/browser';
	import { getCollectionsReports } from '$lib/client/api/collectionReports';
	import { getModerators, getPendingPosts } from '$lib/client/api/moderation';
	import { getPostsReports } from '$lib/client/api/postReports';
	import { getUsersReports } from '$lib/client/api/userReports';
	import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import { getAuthenticatedUser, getModerationPaginationData } from '$lib/client/helpers/context';
	import { isModerationRole } from '$lib/shared/helpers/auth/role';
	import type { TApiResponse } from '$lib/shared/types/api';
	import type { TUser } from '$lib/shared/types/users';
	import { toast } from '@zerodevx/svelte-toast';
	import Button from 'flowbite-svelte/Button.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';
	import ExclamationCircleSolid from 'flowbite-svelte-icons/ExclamationCircleSolid.svelte';
	import TabItem from 'flowbite-svelte/TabItem.svelte';
	import Tabs from 'flowbite-svelte/Tabs.svelte';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import ModList from './ModList.svelte';
	import ReportGrid from './ReportGrid.svelte';
	import PostModerationGrid from './PostModerationGrid.svelte';
	import type { TPost } from '$lib/shared/types/posts';

	type TTabName =
		| 'user-reports'
		| 'post-reports'
		| 'post-collection-reports'
		| 'post-decisions'
		| 'moderator-list'
		| '';

	let currentTab = $state<TTabName>((page.url.searchParams.get('tab') as TTabName) ?? '');
	let moderatorsLoading = $state(false);
	let postReportsLoading = $state(false);
	let postCollectionReportsLoading = $state(false);
	let userReportsLoading = $state(false);
	let pendingPostsLoading = $state(false);

	const TAB_TITLES: Partial<Record<TTabName, string>> = {
		'moderator-list': 'Moderator List',
		'post-collection-reports': 'Post Collection Reports',
		'post-reports': 'Post Reports',
		'user-reports': 'User Reports',
		'post-decisions': 'New Post Decisions',
	};

	const TAB_CONTAINER_IDS: Partial<Record<TTabName, string>> = {
		'moderator-list': 'moderation-container',
		'post-collection-reports': 'post-collection-report-container',
		'post-reports': 'post-report-container',
		'user-reports': 'user-report-container',
		'post-decisions': 'post-decisions-container',
	};

	const handleTabChange = (tabName: TTabName) => {
		if (currentTab === tabName) return;

		currentTab = tabName;
		goto(`?tab=${tabName}`);
	};

	const handleLoadPendingPosts = async (fromTabClick: boolean) => {
		const loadedPendingPosts = get(moderationData)?.pendingPosts ?? [];
		const pendingPostsPageNumber = get(moderationData)?.pendingPostsPageNumber ?? 0;

		if (fromTabClick && loadedPendingPosts.length > 0) return;

		pendingPostsLoading = true;

		const response = await getPendingPosts(pendingPostsPageNumber);
		if (response.ok) {
			const responseData: TApiResponse<{ pendingPosts: TPost[] }> = await response.json();
			moderationData.update((data) => {
				if (!data) return null;
				return {
					...data,
					pendingPosts: [...data.pendingPosts, ...responseData.data.pendingPosts],
					pendingPostsPageNumber: data.pendingPostsPageNumber + 1,
				};
			});
		} else {
			toast.push(
				'An unexpected error occurred while fetching the pending posts',
				FAILURE_TOAST_OPTIONS,
			);
		}

		pendingPostsLoading = false;
	};

	const handleLoadPostReports = async (fromTabClick: boolean) => {
		const loadedPostReports = get(moderationData)?.postReports ?? [];
		const postReportsPageNumber = get(moderationData)?.postReportPageNumber ?? 0;

		if (fromTabClick && loadedPostReports.length > 0) return;

		postReportsLoading = true;

		const response = await getPostsReports(postReportsPageNumber);
		if (response.ok) {
			const responseData: TApiResponse<{ postReports: PostReport[] }> = await response.json();
			moderationData.update((data) => {
				if (!data) return null;
				return {
					...data,
					postReports: [...data.postReports, ...responseData.data.postReports],
					postReportPageNumber: data.postReportPageNumber + 1,
				};
			});
		} else {
			toast.push(
				'An unexpected error occured while fetching the post reports',
				FAILURE_TOAST_OPTIONS,
			);
		}

		postReportsLoading = false;
	};

	const handleLoadCollectionReports = async (fromTabClick: boolean) => {
		const loadedCollectionReports = get(moderationData)?.postCollectionReports ?? [];
		const collectionReportsPageNumber = get(moderationData)?.postCollectionReportPageNumber ?? 0;

		if (fromTabClick && loadedCollectionReports.length > 0) return;

		postCollectionReportsLoading = true;

		const response = await getCollectionsReports(collectionReportsPageNumber);
		if (response.ok) {
			const responseData: TApiResponse<{ postCollectionReports: PostCollectionReport[] }> =
				await response.json();
			moderationData.update((data) => {
				if (!data) return null;
				return {
					...data,
					postCollectionReports: [
						...data.postCollectionReports,
						...responseData.data.postCollectionReports,
					],
					postCollectionReportPageNumber: data.postCollectionReportPageNumber + 1,
				};
			});
		} else {
			toast.push(
				'An unexpected error occurred while fetching the collection reports',
				FAILURE_TOAST_OPTIONS,
			);
		}

		postCollectionReportsLoading = false;
	};

	const handleLoadUserReports = async (fromTabClick: boolean) => {
		const loadedUserReports = get(moderationData)?.userReports ?? [];
		const userReportsPageNumber = get(moderationData)?.userReportPageNumber ?? 0;

		if (fromTabClick && loadedUserReports.length > 0) return;

		userReportsLoading = true;

		const response = await getUsersReports(userReportsPageNumber);
		if (response.ok) {
			const responseData: TApiResponse<{ userReports: UserReport[] }> = await response.json();
			moderationData.update((data) => {
				if (!data) return null;
				return {
					...data,
					userReports: [...data.userReports, ...responseData.data.userReports],
					userReportPageNumber: data.userReportPageNumber + 1,
				};
			});
		} else {
			toast.push(
				'An unexpected error occurred while fetching the user reports',
				FAILURE_TOAST_OPTIONS,
			);
		}

		userReportsLoading = false;
	};

	const handleLoadModerators = async () => {
		if ((get(moderationData)?.moderators ?? []).length > 0) return;

		moderatorsLoading = true;

		const response = await getModerators();
		if (response.ok) {
			const responseData: TApiResponse<{ moderators: TUser[] }> = await response.json();
			moderationData.update((data) => {
				if (!data) return null;
				return {
					...data,
					moderators: responseData.data.moderators,
				};
			});
		} else {
			toast.push(
				'An unexpected error occured while fetching the moderators',
				FAILURE_TOAST_OPTIONS,
			);
		}

		moderatorsLoading = false;
	};

	const handleTabClick = async (tabName: TTabName) => {
		handleTabChange(tabName);

		switch (tabName) {
			case 'moderator-list':
				await handleLoadModerators();
				break;
			case 'post-collection-reports':
				await handleLoadCollectionReports(true);
				break;
			case 'post-reports':
				await handleLoadPostReports(true);
				break;
			case 'user-reports':
				await handleLoadUserReports(true);
				break;
			case 'post-decisions':
				await handleLoadPendingPosts(true);
				break;
			default:
				break;
		}
	};

	const user = getAuthenticatedUser();
	const moderationData = getModerationPaginationData();

	onMount(() => {
		if (currentTab !== '') {
			handleTabClick(currentTab);
		}

		const moderationLink = document.getElementById('moderation-link') as HTMLAnchorElement;
		const onClickClearCurrentTab = () => {
			currentTab = '';

			Object.values(TAB_CONTAINER_IDS).forEach((containerId) => {
				const container = document.getElementById(containerId) as Element;
				if (container) {
					container.innerHTML = '';
				}
			});
		};
		if (moderationLink) {
			moderationLink.addEventListener('click', onClickClearCurrentTab);
		}

		return () => {
			moderationData.set({
				postCollectionReports: [],
				postCollectionReportPageNumber: 0,
				postReports: [],
				postReportPageNumber: 0,
				userReports: [],
				userReportPageNumber: 0,
				pendingPosts: [],
				pendingPostsPageNumber: 0,
				moderators: [],
			});

			if (moderationLink) {
				moderationLink.removeEventListener('click', onClickClearCurrentTab);
			}
		};
	});
</script>

<svelte:head>
	<title>Moderation Dashboard {currentTab.length > 0 ? `| ${TAB_TITLES[currentTab]}` : ''}</title>
</svelte:head>

{#if currentTab === ''}
	<div
		class="mx-auto mt-10 max-w-2xl rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800"
	>
		<div class="mb-6 flex justify-center">
			<div class="bg-primary-100 dark:bg-primary-900/30 rounded-full p-3">
				<ExclamationCircleSolid class="text-primary-600 dark:text-primary-500 h-10 w-10" />
			</div>
		</div>
		<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Moderation Dashboard</h2>
		<p class="mt-3 mb-8 text-gray-600 dark:text-gray-400">
			Welcome to the moderation dashboard. Please select a category below to view and manage active
			reports or pending posts.
		</p>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<Button
				color="alternative"
				class="h-16 text-lg"
				onclick={() => handleTabClick('post-decisions')}
			>
				Post Decisions
			</Button>
			<Button
				color="alternative"
				class="h-16 text-lg"
				onclick={() => handleTabClick('user-reports')}
			>
				User Reports
			</Button>
			<Button
				color="alternative"
				class="h-16 text-lg"
				onclick={() => handleTabClick('post-reports')}
			>
				Post Reports
			</Button>
			<Button
				color="alternative"
				class="h-16 text-lg"
				onclick={() => handleTabClick('post-collection-reports')}
			>
				Collection Reports
			</Button>
			{#if $user && isModerationRole($user.role)}
				<Button
					color="alternative"
					class="h-16 text-lg"
					onclick={() => handleTabClick('moderator-list')}
				>
					Moderator List
				</Button>
			{/if}
		</div>
	</div>
{:else}
	<Tabs class="mt-5" tabStyle="underline">
		<TabItem
			onclick={() => handleTabClick('post-decisions')}
			open={currentTab === 'post-decisions'}
			title="Post Decisions"
		>
			<PostModerationGrid
				containerId={TAB_CONTAINER_IDS['post-decisions'] ?? ''}
				handleLoadMorePosts={() => handleLoadPendingPosts(false)}
				loadingPosts={pendingPostsLoading}
			/>
		</TabItem>
		<TabItem
			onclick={() => handleTabClick('user-reports')}
			open={currentTab === 'user-reports'}
			title="User Reports"
		>
			<ReportGrid
				containerId={TAB_CONTAINER_IDS['user-reports'] ?? ''}
				reportType="userReports"
				handleLoadMoreReports={() => handleLoadUserReports(false)}
				loadingReports={userReportsLoading}
			/>
		</TabItem>
		<TabItem
			onclick={() => handleTabClick('post-reports')}
			open={currentTab === 'post-reports'}
			title="Post Reports"
		>
			<ReportGrid
				containerId={TAB_CONTAINER_IDS['post-reports'] ?? ''}
				reportType="postReports"
				handleLoadMoreReports={() => handleLoadPostReports(false)}
				loadingReports={postReportsLoading}
			/>
		</TabItem>
		<TabItem
			onclick={() => handleTabClick('post-collection-reports')}
			open={currentTab === 'post-collection-reports'}
			title="Post Collection Reports"
		>
			<ReportGrid
				containerId={TAB_CONTAINER_IDS['post-collection-reports'] ?? ''}
				reportType="postCollectionReports"
				handleLoadMoreReports={() => handleLoadCollectionReports(false)}
				loadingReports={postCollectionReportsLoading}
			/>
		</TabItem>
		{#if $user && isModerationRole($user.role)}
			<TabItem
				onclick={() => handleTabClick('moderator-list')}
				open={currentTab === 'moderator-list'}
				disabled={!isModerationRole($user.role)}
				title="Moderator List"
			>
				{#if moderatorsLoading}
					<Spinner size="12" />
				{:else}
					<ModList containerId={TAB_CONTAINER_IDS['moderator-list'] ?? ''} />
				{/if}
			</TabItem>
		{/if}
	</Tabs>
{/if}
