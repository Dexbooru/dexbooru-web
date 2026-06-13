import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockControllerHelpers } from '../../../../mocks';
import { buildDefaultApplicationConfiguration } from '$lib/shared/applicationConfiguration';

const configuration = buildDefaultApplicationConfiguration();

vi.mock('$lib/server/applicationConfiguration', () => ({
	getApplicationConfiguration: vi.fn(async () => configuration),
	validateApplicationConfigurationUpdate: vi.fn(async () => undefined),
	syncDatabaseVarcharConstraints: vi.fn(async () => undefined),
	setApplicationConfigurationInMemory: vi.fn(),
	setApplicationConfigurationInRedis: vi.fn(async () => undefined),
	publishApplicationConfigurationUpdate: vi.fn(async () => undefined),
}));

vi.mock('$lib/server/db/actions/applicationConfiguration', () => ({
	updateApplicationConfiguration: vi.fn(async () => ({
		...configuration,
		maximumTagLength: 200,
	})),
}));

vi.mock('$lib/server/controllers/moderation/ownerRoleCheck', () => ({
	handleOwnerRoleCheck: vi.fn(async () => undefined),
}));

vi.mock('$lib/server/events/applicationConfiguration', () => ({
	applicationConfigurationEmitter: {
		emitUpdated: vi.fn(),
	},
}));

describe('application configuration controllers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _type, _schema, callback) => {
				return await callback({
					body: {
						maximumTagLength: 200,
					},
				});
			},
		);
	});

	it('returns application configuration in GET handler', async () => {
		const event = {} as never;
		const { handleGetApplicationConfiguration } =
			await import('$lib/server/controllers/applicationConfiguration');

		const response = (await handleGetApplicationConfiguration(event, 'api-route')) as {
			status: number;
			data: { maximumTagLength: number };
		};
		expect(response.status).toBe(200);
		expect(response.data.maximumTagLength).toBe(configuration.maximumTagLength);
	});

	it('updates configuration in PATCH handler for owner', async () => {
		const event = {
			locals: { user: { id: 'owner-id' } },
		} as never;
		const { handleUpdateApplicationConfiguration } =
			await import('$lib/server/controllers/applicationConfiguration');
		const { syncDatabaseVarcharConstraints } = await import('$lib/server/applicationConfiguration');

		const response = (await handleUpdateApplicationConfiguration(event)) as {
			status: number;
			data: { maximumTagLength: number };
		};
		expect(response.status).toBe(200);
		expect(response.data.maximumTagLength).toBe(200);
		expect(syncDatabaseVarcharConstraints).toHaveBeenCalledWith({
			updates: { maximumTagLength: 200 },
			previousConfiguration: configuration,
			nextConfiguration: {
				...configuration,
				maximumTagLength: 200,
			},
		});
	});
});
