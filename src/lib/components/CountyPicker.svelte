<script lang="ts">
	import { enhance } from '$app/forms';
	import { countyById, counties, FAVOURITE_STORAGE_KEY } from '$lib/config';

	let { favourite }: { favourite: string | null } = $props();

	function persist(id: string | null) {
		try {
			if (id) {
				localStorage.setItem(FAVOURITE_STORAGE_KEY, id);
				document.documentElement.setAttribute('data-county', id);
			} else {
				localStorage.removeItem(FAVOURITE_STORAGE_KEY);
				document.documentElement.removeAttribute('data-county');
			}
		} catch {
			/* private mode */
		}
	}
</script>

<form
	method="POST"
	action="/my-team?/setFavourite"
	class="ccl-picker"
	use:enhance={() => {
		return async ({ result, update }) => {
			if (result.type === 'success' && result.data && 'favourite' in result.data) {
				persist((result.data.favourite as string | null) ?? null);
			}
			await update();
		};
	}}
>
	{#each counties as county (county.id)}
		<button
			class="oh-chip"
			type="submit"
			name="county"
			value={county.id}
			aria-pressed={favourite === county.id}
			style="--county-band: {county.palette.light.band}"
		>
			<span class="ccl-swatch" aria-hidden="true"></span>
			{county.shortName}
		</button>
	{/each}
	{#if favourite}
		<button class="oh-chip" type="submit" name="county" value="" aria-pressed="false"
			>Clear favourite</button
		>
		<p class="oh-muted" style="grid-column:1/-1;margin:0">
			Colours overlay OddHours petrol for {countyById[favourite]?.name}. Not a ninth house theme.
		</p>
	{/if}
</form>
