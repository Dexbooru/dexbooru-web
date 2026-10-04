import { POST_SOURCE_TYPES } from '$lib/shared/constants/posts';
import type { TPostDraft } from '$lib/shared/types/posts';
import type { TPostSourceType } from '$lib/shared/types/sauceNao';

const CURRENT_POST_DRAFT_KEY = 'currentPostDraft';

const isPostSourceType = (value: unknown): value is TPostSourceType =>
	typeof value === 'string' && (POST_SOURCE_TYPES as readonly string[]).includes(value);

const normalizePostDraft = (parsed: Partial<TPostDraft>): TPostDraft => ({
	isNsfw: parsed.isNsfw === true,
	tags: Array.isArray(parsed.tags) ? parsed.tags : [],
	artists: Array.isArray(parsed.artists) ? parsed.artists : [],
	description: typeof parsed.description === 'string' ? parsed.description : '',
	sourceLink: typeof parsed.sourceLink === 'string' ? parsed.sourceLink : '',
	characterName: typeof parsed.characterName === 'string' ? parsed.characterName : '',
	sourceTitle: typeof parsed.sourceTitle === 'string' ? parsed.sourceTitle : '',
	sourceType: isPostSourceType(parsed.sourceType) ? parsed.sourceType : '',
});

export const savePostDraft = (draft: TPostDraft) => {
	if (typeof window === 'undefined') return;
	localStorage.setItem(CURRENT_POST_DRAFT_KEY, JSON.stringify(draft));
};

export const loadPostDraft = (): TPostDraft | null => {
	if (typeof window === 'undefined') return null;
	const draft = localStorage.getItem(CURRENT_POST_DRAFT_KEY);
	if (!draft) return null;

	try {
		const parsed: unknown = JSON.parse(draft);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
		return normalizePostDraft(parsed);
	} catch {
		return null;
	}
};

export const clearPostDraft = () => {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(CURRENT_POST_DRAFT_KEY);
};
