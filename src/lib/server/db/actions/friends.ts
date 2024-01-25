import prisma from '../prisma';

export async function createFriendRequest(
	senderUserId: string,
	receiverUserId: string
): Promise<boolean> {
	const newFriendRequestBatchResult = await prisma.friendRequest.createMany({
		data: [
			{
				senderUserId,
				receiverUserId
			}
		]
	});

	return newFriendRequestBatchResult.count > 0;
}

export async function deleteFriendRequest(
	senderUserId: string,
	receiverUserId: string
): Promise<boolean> {
	const deleteFriendRequestBatchResult = await prisma.friendRequest.deleteMany({
		where: {
			OR: [
				{
					senderUserId,
					receiverUserId
				},
				{
					senderUserId: receiverUserId,
					receiverUserId: senderUserId
				}
			]
		}
	});

	return deleteFriendRequestBatchResult.count > 0;
}
