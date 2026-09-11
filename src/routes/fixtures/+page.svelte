<script lang="ts">
	import MatchCard from '$lib/components/MatchCard.svelte';
	import { formatDay } from '$lib/format';

	let { data } = $props();

	const grouped = $derived.by(() => {
		const map = new Map<string, typeof data.matches>();
		for (const match of data.matches) {
			const key = formatDay(match.startAt);
			const list = map.get(key) ?? [];
			list.push(match);
			map.set(key, list);
		}
		return [...map.entries()];
	});
</script>

<svelte:head>
	<title>Fixtures · County Cricket Live</title>
</svelte:head>

<span class="oh-eyebrow">Diary</span>
<h1 class="ccl-page-title oh-display">When the next ball is.</h1>
<p class="oh-lede">Seeded 2026 fixtures. Championship, Blast, One-Day Cup — names from config.</p>

{#each grouped as [day, matches] (day)}
	<section class="oh-stack">
		<h2>{day}</h2>
		<div class="ccl-grid ccl-grid--2">
			{#each matches as match (match.id)}
				<MatchCard {match} />
			{/each}
		</div>
	</section>
{/each}
