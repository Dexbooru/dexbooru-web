import { vi } from 'vitest';

export const mockMLApiHelpers = {
	indexPostImages: vi.fn(),
	getSimilarPostsBySimilaritySearch: vi.fn(),
};

vi.mock('$lib/server/helpers/mlApi', () => mockMLApiHelpers);
