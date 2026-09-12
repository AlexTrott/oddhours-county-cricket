import { json } from '@sveltejs/kit';
import { healthSnapshot } from '$lib/server/queries';

export const GET = () => json(healthSnapshot());
