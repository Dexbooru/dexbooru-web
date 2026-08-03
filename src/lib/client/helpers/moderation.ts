/** Tailwind breakpoints matching moderation grid: 1 / sm:2 / lg:3 / xl:4 / 2xl:5 */
export const getModerationGridColumnCount = (width: number): number => {
	if (width >= 1536) return 5;
	if (width >= 1280) return 4;
	if (width >= 1024) return 3;
	if (width >= 640) return 2;
	return 1;
};

export const MODERATION_VIRTUAL_LIST_HEIGHT = 'calc(100dvh - 14rem)';
export const MODERATION_GRID_ROW_ESTIMATED_HEIGHT = 420;
export const MODERATION_MOD_LIST_ITEM_ESTIMATED_HEIGHT = 128;
export const MODERATION_MOD_LIST_MIN_ITEMS_TO_VIRTUALIZE = 16;
