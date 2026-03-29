import { handleLogout } from '$lib/server/controllers/users';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = handleLogout;
