import { NOTIFICATION_EXCHANGE } from '../../constants/rabbitmq';
import { BasePublisher } from '../basePublisher';

export type TNewPostLikeMessage = {
	postId: string;
	postAuthorId: string;
	likerUserId: string;
	totalLikes: number;
	wasRead: boolean;
};

export class NewPostLikePublisher extends BasePublisher<TNewPostLikeMessage> {
	public static BASE_ROUTING_KEY: string = 'event.new_post_like.';

	public static buildRoutingKey(postAuthorId: string): string {
		return `${NewPostLikePublisher.BASE_ROUTING_KEY}${postAuthorId}`;
	}

	public toMessageDto(data: TNewPostLikeMessage): TNewPostLikeMessage {
		return {
			postId: data.postId,
			postAuthorId: data.postAuthorId,
			likerUserId: data.likerUserId,
			totalLikes: data.totalLikes,
			wasRead: false,
		};
	}
}

export default new NewPostLikePublisher(NOTIFICATION_EXCHANGE);
