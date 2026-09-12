<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import MatchCard from '$lib/components/MatchCard.svelte';
	import { counties, COMPETITION_STORAGE_KEY } from '$lib/config';
	import { formatDay, londonDateKey, teamLabel } from '$lib/format';
	import type { MatchSummary } from '$lib/match-types';

	let { data } = $props();

	const grouped = $derived.by(() => {
		const map = new Map<string, { label: string; matches: MatchSummary[] }>();
		for (const match of data.matches) {
			const key = londonDateKey(match.startAt);
			const list = map.get(key);
			if (list) list.matches.push(match);
			else map.set(key, { label: formatDay(match.startAt), matches: [match] });
		}
		return [...map.entries()].map(([key, value]) => ({ key, ...value }));
	});

	const knockoutByComp = $derived.by(() => {
		const map = new Map<string, MatchSummary[]>();
		for (const match of data.knockouts) {
			const list = map.get(match.competitionId) ?? [];
			list.push(match);
			map.set(match.competitionId, list);
		}
		return [...map.entries()];
	});

	function remember(comp: string) {
		try {
			localStorage.setItem(COMPETITION_STORAGE_KEY, comp);
			document.cookie = `ccl_competition=${encodeURIComponent(comp)};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
		} catch {
			/* private mode */
		}
	}

	function selectComp(competitionId: string) {
		remember(competitionId);
		const params = new URLSearchParams();
		if (competitionId !== 'all') params.set('comp', competitionId);
		if (data.teamId) params.set('team', data.teamId);
		void goto(`/fixtures?${params.toString()}`);
	}

	function selectTeam(teamId: string) {
		const params = new URLSearchParams();
		if (data.competitionId && data.competitionId !== 'all') params.set('comp', data.competitionId);
		if (teamId) params.set('team', teamId);
		void goto(`/fixtures?${params.toString()}`);
	}

	onMount(() => {
		const today = londonDateKey(new Date().toISOString());
		const next =
			grouped.find((group) => group.key >= today) ??
			[...grouped].reverse().find((group) => group.key < today);
		const el = next ? document.getElementById(`day-${next.key}`) : null;
		el?.scrollIntoView({ block: 'start' });
	});

	function roundLabel(round: string | null): string {
		if (round === 'quarter-final') return 'Quarter-final';
		if (round === 'semi-final') return 'Semi-final';
		if (round === 'final') return 'Final';
		return 'Knockout';
	}
</script>

<svelte:head>
	<title>Fixtures · County Cricket Live</title>
</svelte:head>

<span class="oh-eyebrow">Diary</span>
<h1 class="ccl-page-title oh-display">When the next ball is.</h1>
<p class="oh-lede">
	Full 2026 season from seed (captured ESPN JSON). Filter by competition and team. Does not scrape
	from this page.
</p>

<div class="oh-stack">
	<div class="oh-seg" role="radiogroup" aria-label="Competition">
		<button
			type="button"
			class="oh-seg__opt"
			role="radio"
			aria-checked={data.competitionId === 'all'}
			onclick={() => selectComp('all')}
		>
			All
		</button>
		{#each data.competitions as competition (competition.id)}
			<button
				type="button"
				class="oh-seg__opt"
				role="radio"
				aria-checked={competition.id === data.competitionId}
				onclick={() => selectComp(competition.id)}
			>
				{competition.shortName}
			</button>
		{/each}
	</div>

	<div class="oh-chips" role="group" aria-label="Team">
		<button
			type="button"
			class="oh-chip"
			aria-pressed={!data.teamId}
			onclick={() => selectTeam('')}
		>
			All teams
		</button>
		{#each counties as county (county.id)}
			<button
				type="button"
				class="oh-chip"
				aria-pressed={data.teamId === county.id}
				onclick={() => selectTeam(county.id)}
			>
				{county.abbreviation}
			</button>
		{/each}
	</div>
</div>

{#if knockoutByComp.length}
	<section class="oh-stack ccl-knockouts">
		<h2>Knockouts</h2>
		<p class="oh-muted">Labelled list for v1 — not a bracket.</p>
		{#each knockoutByComp as [competitionId, matches] (competitionId)}
			<article class="oh-card">
				<h3 class="oh-card__title">
					{data.competitions.find((item) => item.id === competitionId)?.name ?? competitionId}
				</h3>
				<ol class="ccl-knockout-list">
					{#each matches as match (match.id)}
						<li>
							<span class="oh-eyebrow">{roundLabel(match.round)}</span>
							<a class="oh-text-link" href="/match/{match.id}">
								{teamLabel(match.homeTeamId, match.format)} vs {teamLabel(
									match.awayTeamId,
									match.format
								)}
							</a>
							<span class="oh-muted">{formatDay(match.startAt)}</span>
						</li>
					{/each}
				</ol>
			</article>
		{/each}
	</section>
{/if}

{#each grouped as group (group.key)}
	<section class="oh-stack" id="day-{group.key}" data-date={group.key}>
		<h2>{group.label}</h2>
		<div class="ccl-grid ccl-grid--2">
			{#each group.matches as match (match.id)}
				<MatchCard {match} />
			{/each}
		</div>
	</section>
{/each}
