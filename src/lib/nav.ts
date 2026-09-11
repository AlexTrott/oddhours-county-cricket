export const tabs = [
	{ href: '/', id: 'live', label: 'Live' },
	{ href: '/standings', id: 'standings', label: 'Standings' },
	{ href: '/fixtures', id: 'fixtures', label: 'Fixtures' },
	{ href: '/my-team', id: 'my-team', label: 'My Team' },
	{ href: '/more', id: 'more', label: 'More' }
] as const;

export function isTabActive(pathname: string, href: string): boolean {
	if (href === '/') return pathname === '/' || pathname.startsWith('/match');
	if (href === '/my-team') return pathname.startsWith('/my-team') || pathname.startsWith('/team');
	if (href === '/more') {
		return (
			pathname === '/more' || pathname.startsWith('/about') || pathname.startsWith('/settings')
		);
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}
