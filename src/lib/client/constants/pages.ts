import type { TErrorPageType } from '../types/page';

export const ERROR_PAGE_TITLE_MAP: Record<TErrorPageType, string> = {
	internalServerError: '500 - Internal Server Error',
	general: '404 - Page Not Found',
	posts: '404 - Post Not Found',
	collections: '404 - Collection Not Found',
};
