import { AI_EVENTS_EXCHANGE } from '../../constants/rabbitmq';
import { BasePublisher } from '../basePublisher';

/**
 * Wire format for dexbooru-ai `DexbooruPost` (snake_case JSON for Pydantic).
 */
export type TNewPostVectorTargetMessage = {
	id: string;
	description: string;
	image_urls: string[];
	created_at: string;
	updated_at: string;
	author_id: string;
};

export type TNewPostVectorTargetSource = {
	id: string;
	description: string;
	imageUrls: string[];
	createdAt: Date;
	authorId: string;
};

/**
 * Publishes to the exchange and routing pattern consumed by
 * `dexbooru-ai` `NewPostConsumer` (`new_post_vector_target` queue).
 */
export class NewPostVectorTargetPublisher extends BasePublisher<TNewPostVectorTargetMessage> {
	public static ROUTING_KEY = 'new_post.vector_target';

	public toMessageDto(data: unknown): TNewPostVectorTargetMessage {
		const post = data as TNewPostVectorTargetSource;
		const created = post.createdAt.toISOString();
		return {
			id: post.id,
			description: post.description,
			image_urls: post.imageUrls,
			created_at: created,
			updated_at: created,
			author_id: post.authorId,
		};
	}
}

export default new NewPostVectorTargetPublisher(AI_EVENTS_EXCHANGE);
