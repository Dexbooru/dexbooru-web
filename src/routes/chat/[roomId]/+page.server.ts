import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params, parent }) => {
    if (!locals.user) {
        throw redirect(302, '/');
    }   

    const chatLayoutData = await parent();
    const { roomId } = params;  
    const { chatRooms, friends } = chatLayoutData;

    const room = chatRooms.find(chatRoom => chatRoom.id === roomId);
    if (!room)  {
        throw redirect(302, '/chat');
    }

    const friendId = room.participants[0] === locals.user.id ? room.participants[1] : room.participants[0];
    const friend = friends.find(friend => friend.id === friendId);
    const isParticipant = room.participants.includes(locals.user.id);

    if (!friend || !isParticipant) {
        throw redirect(302, '/chat');
    }

    return {
        friend,
        roomId
    };
};