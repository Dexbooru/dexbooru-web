import type { TPostDraft } from '$lib/shared/types/posts';

const CURRENT_POST_DRAFT_KEY = 'currentPostDraft';

export const savePostDraft = (draft: TPostDraft) => {
	if (typeof window === 'undefined') return;
	localStorage.setItem(CURRENT_POST_DRAFT_KEY, JSON.stringify(draft));
};

export const loadPostDraft = (): TPostDraft | null => {
	if (typeof window === 'undefined') return null;
	const draft = localStorage.getItem(CURRENT_POST_DRAFT_KEY);
	if (!draft) return null;

	try {
		return JSON.parse(draft) as TPostDraft;
	} catch {
		return null;
	}
};

export const clearPostDraft = () => {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(CURRENT_POST_DRAFT_KEY);
};
