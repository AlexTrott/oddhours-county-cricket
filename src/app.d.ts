declare global {
	namespace App {
		interface Locals {
			favourite: string | null;
			scheme: 'light' | 'dark';
		}
	}
}

export {};
