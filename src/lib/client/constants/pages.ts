import type { TErrorPageType } from '../types/page';

export const ERROR_PAGE_TITLE_MAP: Record<TErrorPageType, string> = {
	general: '404 - Page Not Found',
	posts: '404 - Post Not Found'
};
