import { vi } from 'vitest';

export const mockSQSActions = {
	enqueueBatchUploadedPostImages: vi.fn(),
};

vi.mock('$lib/server/aws/actions/sqs', () => mockSQSActions);
