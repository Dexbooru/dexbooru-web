<script lang="ts">
	import type {
		CollectionModerationStatus,
		PostModerationStatus,
		UserModerationStatus,
	} from '$generated/prisma/browser';
	import {
		getOwnerResourceModerationStatus,
		ownerAmendResourceModeration,
		type TOwnerAmendResourceModerationBody,
	} from '$lib/client/api/moderation';
	import { FAILURE_TOAST_OPTIONS, SUCCESS_TOAST_OPTIONS } from '$lib/client/constants/toasts';
	import type { TApiResponse } from '$lib/shared/types/api';
	import { capitalize } from '$lib/shared/helpers/util';
	import { toast } from '@zerodevx/svelte-toast';
	import Alert from 'flowbite-svelte/Alert.svelte';
	import Button from 'flowbite-svelte/Button.svelte';
	import Label from 'flowbite-svelte/Label.svelte';
	import Modal from 'flowbite-svelte/Modal.svelte';
	import Select from 'flowbite-svelte/Select.svelte';
	import Spinner from 'flowbite-svelte/Spinner.svelte';

	type OwnerResourceType = 'post' | 'user' | 'postCollection';

	type Props = {
		open: boolean;
		resourceType: OwnerResourceType;
		resourceId: string;
		initialModerationStatus?: string;
		subtitle?: string;
		onApplied?: (detail: { resourceType: OwnerResourceType; status: string }) => void;
	};

	let {
		open = $bindable(),
		resourceType,
		resourceId,
		initialModerationStatus,
		subtitle = '',
		onApplied,
	}: Props = $props();

	let selectedStatus = $state('');
	let loadingStatus = $state(false);
	let saving = $state(false);
	let loadError = $state<string | null>(null);

	const statusItems = $derived.by(() => {
		if (resourceType === 'post') {
			return [
				{ name: 'Pending', value: 'PENDING' },
				{ name: 'Approved', value: 'APPROVED' },
				{ name: 'Rejected', value: 'REJECTED' },
			];
		}
		return [
			{ name: 'Unflagged', value: 'UNFLAGGED' },
			{ name: 'Flagged', value: 'FLAGGED' },
		];
	});

	const resourceLabel = $derived.by(() => {
		if (resourceType === 'post') return 'post';
		if (resourceType === 'user') return 'user';
		return 'collection';
	});

	$effect(() => {
		if (!open) {
			loadingStatus = false;
			loadError = null;
			selectedStatus = '';
			return;
		}

		if (!resourceId) {
			loadError = 'Missing resource id.';
			loadingStatus = false;
			return;
		}

		if (initialModerationStatus !== undefined) {
			selectedStatus = initialModerationStatus;
			loadingStatus = false;
			loadError = null;
			return;
		}

		loadingStatus = true;
		loadError = null;
		let cancelled = false;

		void (async () => {
			try {
				const res = await getOwnerResourceModerationStatus(resourceType, resourceId);
				const json = (await res.json()) as TApiResponse<{ moderationStatus: string }>;
				if (cancelled) return;
				if (!res.ok) {
					loadError =
						typeof json.message === 'string' ? json.message : 'Failed to load moderation status.';
					return;
				}
				selectedStatus = json.data.moderationStatus;
			} catch {
				if (!cancelled) loadError = 'Failed to load moderation status.';
			} finally {
				if (!cancelled) loadingStatus = false;
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	const buildBody = (): TOwnerAmendResourceModerationBody | null => {
		if (!selectedStatus) return null;
		if (resourceType === 'post') {
			return {
				resourceType: 'post',
				resourceId,
				status: selectedStatus as PostModerationStatus,
			};
		}
		if (resourceType === 'user') {
			return {
				resourceType: 'user',
				resourceId,
				status: selectedStatus as UserModerationStatus,
			};
		}
		return {
			resourceType: 'postCollection',
			resourceId,
			status: selectedStatus as CollectionModerationStatus,
		};
	};

	const applyDisabled = $derived(
		loadingStatus ||
			saving ||
			!selectedStatus ||
			Boolean(loadError && initialModerationStatus === undefined),
	);

	const handleApply = async () => {
		const body = buildBody();
		if (!body) return;

		saving = true;
		try {
			const response = await ownerAmendResourceModeration(body);
			if (response.ok) {
				toast.push('Moderation status updated.', SUCCESS_TOAST_OPTIONS);
				onApplied?.({ resourceType, status: selectedStatus });
				open = false;
			} else {
				const errJson = (await response.json().catch(() => null)) as { message?: string } | null;
				toast.push(
					errJson?.message ?? 'Failed to update moderation status.',
					FAILURE_TOAST_OPTIONS,
				);
			}
		} catch {
			toast.push('An unexpected error occurred.', FAILURE_TOAST_OPTIONS);
		} finally {
			saving = false;
		}
	};
</script>

<Modal title="Owner — amend moderation" bind:open size="md" outsideclose>
	<div class="space-y-4">
		<p class="text-sm text-gray-600 dark:text-gray-400">
			Set the {resourceLabel} moderation state to any allowed value. This action is only available to
			the site owner.
		</p>
		{#if subtitle}
			<p class="text-sm font-medium text-gray-800 dark:text-gray-200">{subtitle}</p>
		{/if}

		{#if loadError}
			<Alert color="red">{loadError}</Alert>
		{/if}

		{#if loadingStatus}
			<div class="flex justify-center py-6">
				<Spinner size="10" />
			</div>
		{:else if !loadError || initialModerationStatus !== undefined}
			<Label class="space-y-2">
				<span>Moderation status</span>
				<Select
					class="w-full"
					bind:value={selectedStatus}
					items={statusItems.map((item) => ({
						name: capitalize(item.name),
						value: item.value,
					}))}
				/>
			</Label>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex w-full flex-wrap justify-end gap-3">
			<Button color="alternative" disabled={saving} onclick={() => (open = false)}>Cancel</Button>
			<Button color="blue" disabled={applyDisabled} onclick={handleApply}>
				{#if saving}
					<Spinner class="me-2" size="4" />
				{/if}
				Apply
			</Button>
		</div>
	{/snippet}
</Modal>
