import type { TSearchSection } from '../types/search';

export const VALID_SEARCH_SECTIONS: TSearchSection[] = ['all', 'artists', 'tags', 'users', 'posts'];
export const DEFAULT_RESULTS_LIMIT = 5;
export const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;