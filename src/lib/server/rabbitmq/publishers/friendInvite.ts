import type { FriendRequest } from '$generated/prisma/client';
import { NOTIFICATION_EXCHANGE } from '../../constants/rabbitmq';
import { BasePublisher } from '../basePublisher';

type TFriendInviteMessageStatus = 'SENT' | 'ACCEPTED';

export type TFriendInviteMessage = {
	senderUserId: string;
	receiverUserId: string;
	requestSentAt: Date;
	wasRead: boolean;
	status: TFriendInviteMessageStatus;
};

export class FriendInvitePublisher extends BasePublisher<TFriendInviteMessage> {
	public static BASE_ROUTING_KEY: string = 'event.friend_invite.';

	public static buildRoutingKey(reciverUserId: string, status: TFriendInviteMessageStatus): string {
		const suffix = `${reciverUserId}-${status}`;
		return `${FriendInvitePublisher.BASE_ROUTING_KEY}${suffix}`;
	}

	public toMessageDto(
		data: FriendRequest & { status: TFriendInviteMessageStatus },
	): TFriendInviteMessage {
		return {
			wasRead: false,
			status: data.status,
			requestSentAt: data.sentAt,
			receiverUserId: data.receiverUserId,
			senderUserId: data.senderUserId,
		};
	}
}

export default new FriendInvitePublisher(NOTIFICATION_EXCHANGE);
