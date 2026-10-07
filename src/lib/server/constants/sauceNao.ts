export const SAUCENAO_SEARCH_URL = 'https://saucenao.com/search.php';

export const SAUCENAO_OUTPUT_TYPE_JSON = '2';
export const SAUCENAO_RESULTS_PER_SEARCH = '8';
export const SAUCENAO_DEDUPE_ALL_METHODS = '2';
export const SAUCENAO_HIDE_NOTHING = '0';

export const SAUCENAO_ATTEMPT_TIMEOUT_MS = 15_000;
export const SAUCENAO_MAX_ATTEMPTS = 3;
export const SAUCENAO_BACKOFF_BASE_MS = 1_000;
export const SAUCENAO_BACKOFF_CAP_MS = 8_000;

export const SAUCENAO_COOLDOWN_KEY = 'saucenao:cooldown';
export const SAUCENAO_SHORT_COOLDOWN_MS = 30_000;
export const SAUCENAO_DAILY_COOLDOWN_MS = 60 * 60 * 1000;

export const SAUCENAO_INDEX_CATALOG_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const SAUCENAO_CACHE_KEY_PREFIX = 'saucenao:v2';
export const SAUCENAO_CACHE_TTL_NONEMPTY_MS = 7 * 24 * 60 * 60 * 1000;
export const SAUCENAO_CACHE_TTL_EMPTY_MS = 24 * 60 * 60 * 1000;
