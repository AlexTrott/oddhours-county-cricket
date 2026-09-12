export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const cookieBase = {
	path: '/',
	maxAge: COOKIE_MAX_AGE,
	sameSite: 'lax' as const,
	httpOnly: false
};
