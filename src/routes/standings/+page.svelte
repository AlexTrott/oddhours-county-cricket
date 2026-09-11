<script lang="ts">
	import { goto } from '$app/navigation';
	import StandingsTable from '$lib/components/StandingsTable.svelte';
	import type { Competition } from '$lib/config';

	let { data } = $props();

	function selectComp(competition: Competition) {
		const groupId = competition.groups[0].id;
		void goto(`/standings?comp=${competition.id}&group=${groupId}`);
	}

	function selectGroup(groupId: string) {
		void goto(`/standings?comp=${data.competitionId}&group=${groupId}`);
	}

	const current = $derived(data.competitions.find((item) => item.id === data.competitionId));
</script>

<svelte:head>
	<title>Standings · County Cricket Live</title>
</svelte:head>

<span class="oh-eyebrow">Tables</span>
<h1 class="ccl-page-title oh-display">Who's sitting where.</h1>
<p class="oh-lede">
	Groups come from config, not from this page. Seeded 2026 tables, not live scrape.
</p>

<div class="oh-stack">
	<div class="oh-seg" role="radiogroup" aria-label="Competition">
		{#each data.competitions as competition (competition.id)}
			<button
				type="button"
				class="oh-seg__opt"
				role="radio"
				aria-checked={competition.id === data.competitionId}
				onclick={() => selectComp(competition)}
			>
				{competition.shortName}
			</button>
		{/each}
	</div>

	{#if current && current.groups.length > 1}
		<div class="oh-chips" role="group" aria-label="Group">
			{#each current.groups as group (group.id)}
				<button
					type="button"
					class="oh-chip"
					aria-pressed={group.id === data.groupId}
					onclick={() => selectGroup(group.id)}
				>
					{group.name}
				</button>
			{/each}
		</div>
	{/if}

	<article class="oh-card">
		<h2 class="oh-card__title">
			{current?.name} · {current?.groups.find((g) => g.id === data.groupId)?.name}
		</h2>
		<StandingsTable rows={data.rows} format={data.format} />
	</article>
</div>
