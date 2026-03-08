import { FAILURE_TOAST_OPTIONS } from '$lib/client/constants/toasts';
import { getIsAuthenticatedForFetch } from '$lib/client/stores/authenticatedUserForFetch';
import { toast } from '@zerodevx/svelte-toast';

let installed = false;

function ensureContentType(init: RequestInit): RequestInit {
	const headers = init?.headers;
	if (headers == null) {
		return { ...init, headers: { 'Content-Type': 'application/json' } };
	}
	if (headers instanceof Headers) {
		if (headers.has('Content-Type')) return init;
		const next = new Headers(headers);
		next.set('Content-Type', 'application/json');
		return { ...init, headers: next };
	}
	if (Array.isArray(headers)) {
		if (headers.some(([k]) => k.toLowerCase() === 'content-type')) return init;
		return { ...init, headers: [...headers, ['Content-Type', 'application/json']] };
	}
	const record = headers as Record<string, string>;
	const hasContentType = Object.keys(record).some((k) => k.toLowerCase() === 'content-type');
	if (hasContentType) return init;
	return { ...init, headers: { ...record, 'Content-Type': 'application/json' } };
}

function isSameOrigin(requestUrl: string): boolean {
	if (requestUrl.startsWith('/')) return true;
	try {
		return new URL(requestUrl, window.location.origin).origin === window.location.origin;
	} catch {
		return false;
	}
}

function install(): void {
	if (typeof window === 'undefined' || installed) return;
	installed = true;
	const originalFetch = window.fetch;
	window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
		let url: string;
		let promise: Promise<Response>;
		if (input instanceof Request) {
			url = input.url;
			if (input.headers.has('Content-Type')) {
				promise = originalFetch(input);
			} else {
				const headers = new Headers(input.headers);
				headers.set('Content-Type', 'application/json');
				promise = originalFetch(new Request(input, { headers }));
			}
		} else {
			url = typeof input === 'string' ? input : input.toString();
			const requestInit = ensureContentType(init ?? {});
			promise = originalFetch(url, requestInit);
		}
		return promise.then((response) => {
			const pathname = window.location.pathname;
			const alreadyOnLogin = pathname === '/login';
			const onHomePage = pathname === '/';
			if (
				response.status === 401 &&
				isSameOrigin(url) &&
				getIsAuthenticatedForFetch() &&
				!alreadyOnLogin &&
				!onHomePage
			) {
				toast.push('You need to sign in again.', FAILURE_TOAST_OPTIONS);
				const path = pathname + window.location.search;
				window.location.href = '/login?redirectTo=' + encodeURIComponent(path);
			}
			return response;
		});
	};
}

install();
