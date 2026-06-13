import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TPostDraft } from '$lib/shared/types/posts';
import { clearPostDraft, loadPostDraft, savePostDraft } from '$lib/client/helpers/drafts';

function createLocalStorageStub() {
	const store = new Map<string, string>();
	return {
		getItem: vi.fn((key: string) => store.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store.set(key, value);
		}),
		removeItem: vi.fn((key: string) => {
			store.delete(key);
		}),
		clear: vi.fn(() => {
			store.clear();
		}),
	};
}

const sampleDraft: TPostDraft = {
	tags: ['cat'],
	artists: ['artist'],
	description: 'A cat post',
	sourceLink: 'https://example.com',
	isNsfw: false,
};

describe('post draft localStorage helpers', () => {
	beforeEach(() => {
		vi.stubGlobal('window', {});
		vi.stubGlobal('localStorage', createLocalStorageStub());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('round-trips draft through save and load', () => {
		savePostDraft(sampleDraft);

		expect(loadPostDraft()).toEqual(sampleDraft);
	});

	it('returns null when no draft is stored', () => {
		expect(loadPostDraft()).toBeNull();
	});

	it('returns null for corrupt JSON', () => {
		localStorage.setItem('currentPostDraft', '{not valid json');

		expect(loadPostDraft()).toBeNull();
	});

	it('clearPostDraft removes stored draft', () => {
		savePostDraft(sampleDraft);
		clearPostDraft();

		expect(loadPostDraft()).toBeNull();
	});
});

describe('post draft SSR guard', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('savePostDraft is a no-op without window', () => {
		vi.stubGlobal('window', undefined);

		expect(() => savePostDraft(sampleDraft)).not.toThrow();
	});

	it('loadPostDraft returns null without window', () => {
		vi.stubGlobal('window', undefined);

		expect(loadPostDraft()).toBeNull();
	});

	it('clearPostDraft is a no-op without window', () => {
		vi.stubGlobal('window', undefined);

		expect(() => clearPostDraft()).not.toThrow();
	});
});
