import type { TSauceNaoIndex } from '$lib/shared/types/sauceNao';
import { getApiAuthHeaders } from '../helpers/auth';

const SAUCENAO_INDEXES_API_URL = '/api/sauce-nao/indexes';

type TApiResponse<T> = {
	status: number;
	message: string;
	data: T;
};

export const updateEnabledSauceNaoIndexes = async (
	enabledIndexIds: number[],
): Promise<TSauceNaoIndex[]> => {
	const response = await fetch(SAUCENAO_INDEXES_API_URL, {
		method: 'PUT',
		headers: {
			...getApiAuthHeaders(),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ enabledIndexIds }),
	});

	const body = (await response.json()) as TApiResponse<TSauceNaoIndex[]>;
	if (!response.ok || !body?.data) {
		throw new Error(body?.message ?? 'Failed to update SauceNAO indexes.');
	}
	return body.data;
};
