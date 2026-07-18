import { MEDIA_UPLOADS_ROUTING_KEY, UPLOAD_EVENTS_EXCHANGE } from '../../constants/rabbitmq';
import type { TMediaUploadJob } from '../../types/upload';
import { BasePublisher } from '../basePublisher';

export class MediaUploadsPublisher extends BasePublisher<TMediaUploadJob> {
	public static ROUTING_KEY = MEDIA_UPLOADS_ROUTING_KEY;

	public toMessageDto(data: unknown): TMediaUploadJob {
		const job = data as TMediaUploadJob;
		return {
			uploadId: job.uploadId,
			resourceType: job.resourceType,
			isNsfw: job.isNsfw,
			images: job.images.map((image) => ({
				index: image.index,
				tempObjectKey: image.tempObjectKey,
				contentType: image.contentType,
				sha256: image.sha256,
			})),
		};
	}
}

export default new MediaUploadsPublisher(UPLOAD_EVENTS_EXCHANGE);
