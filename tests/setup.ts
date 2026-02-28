import { vi } from 'vitest';
import './mocks/prisma';
import './mocks/redis';
import './mocks/logging/logger';
import './mocks/aws/s3';
import './mocks/aws/sqs';
import './mocks/db/actions/post';
import './mocks/db/actions/user';
import './mocks/db/actions/tag';
import './mocks/db/actions/artist';
import './mocks/db/actions/passwordRecoveryAttempt';
import './mocks/db/actions/emailVerification';
import './mocks/db/actions/preference';
import './mocks/db/actions/friend';
import './mocks/db/actions/linkedAccount';
import './mocks/events/uploadStatus';
import './mocks/helpers/controllers';
import './mocks/helpers/sessions';
import './mocks/helpers/mlApi';
import './mocks/helpers/email';
import './mocks/helpers/password';
import './mocks/helpers/totp';
import './mocks/helpers/cookies';
import './mocks/helpers/oauth';
import './mocks/helpers/images';

vi.mock('@sveltejs/kit', async (importActual) => {
	const actual = (await importActual()) as Record<string, unknown>;
	return {
		...actual,
		redirect: vi.fn(),
		isRedirect: vi.fn().mockImplementation((err) => err && err.status >= 300 && err.status <= 308),
		error: vi.fn().mockImplementation((status, body) => ({ status, body, __isError: true })),
		fail: vi.fn().mockImplementation((status, body) => ({ status, body, __isFail: true })),
		isHttpError: vi.fn().mockImplementation((err) => err && err.__isError),
	};
});
