declare global {
	namespace App {
		interface Locals {
			favourite: string | null;
			scheme: 'light' | 'dark';
			competition: string | null;
		}
	}
}

export {};
