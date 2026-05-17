import type {
	TApplicationConfiguration,
	TPartialApplicationConfiguration,
} from '$lib/shared/applicationConfiguration';
import { getApiAuthHeaders } from '../helpers/auth';

const APPLICATION_CONFIGURATION_API_URL = '/api/application-configuration';

type TApiResponse<T> = {
	status: number;
	message: string;
	data: T;
};

export const getApplicationConfiguration = async () => {
	return await fetch(APPLICATION_CONFIGURATION_API_URL, {
		method: 'GET',
		headers: getApiAuthHeaders(),
	});
};

export const updateApplicationConfiguration = async (
	configuration: TPartialApplicationConfiguration,
): Promise<TApplicationConfiguration> => {
	const response = await fetch(APPLICATION_CONFIGURATION_API_URL, {
		method: 'PATCH',
		headers: {
			...getApiAuthHeaders(),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(configuration),
	});

	const body = (await response.json()) as TApiResponse<TApplicationConfiguration>;
	if (!response.ok || !body?.data) {
		throw new Error(body?.message ?? 'Failed to update application configuration.');
	}
	return body.data;
};
