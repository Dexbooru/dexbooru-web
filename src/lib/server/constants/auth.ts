export const PROTECTED_FORM_ROUTES: { route: string; methods: string[] }[] = [
	{
		route: '/posts/upload',
		methods: ['POST']
	},
	{
		route: '/profile/settings',
		methods: ['POST']
	}
];
export const PROTECTED_API_ENDPOINT_ROUTE_PREFIX = '/api/auth';
