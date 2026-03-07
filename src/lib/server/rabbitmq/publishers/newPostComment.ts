import { NOTIFICATION_EXCHANGE } from '../../constants/rabbitmq';
import { BasePublisher } from '../basePublisher';

export type TNewPostCommentMessage = {
	postId: string;
	postAuthorId: string;
	commentAuthorId: string;
	commentContent: string;
	parentCommentId: string | null;
	parentCommentAuthorId: string | null;
	wasRead: boolean;
};

export class NewPostCommentPublisher extends BasePublisher<TNewPostCommentMessage> {
	public static BASE_ROUTING_KEY: string = 'event.new_post_comment.';

	public static buildRoutingKey(postAuthorId: string): string {
		return `${NewPostCommentPublisher.BASE_ROUTING_KEY}${postAuthorId}`;
	}

	public toMessageDto(data: TNewPostCommentMessage): TNewPostCommentMessage {
		return {
			postId: data.postId,
			postAuthorId: data.postAuthorId,
			commentAuthorId: data.commentAuthorId,
			commentContent: data.commentContent,
			parentCommentId: data.parentCommentId,
			parentCommentAuthorId: data.parentCommentAuthorId,
			wasRead: false,
		};
	}
}

export default new NewPostCommentPublisher(NOTIFICATION_EXCHANGE);
