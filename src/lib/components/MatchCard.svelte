<script lang="ts">
	import { competitionLabel, formatOvers, formatScore, formatWhen, teamLabel } from '$lib/format';
	import type { MatchSummary } from '$lib/match-types';
	import { chaseLine, matchHeadline } from '$lib/match-view';

	let { match }: { match: MatchSummary } = $props();

	const inningsByTeam = $derived.by(() => {
		const map = new Map<string, typeof match.innings>();
		for (const innings of match.innings) {
			const list = map.get(innings.battingTeamId) ?? [];
			list.push(innings);
			map.set(innings.battingTeamId, list);
		}
		return map;
	});

	function teamLine(teamId: string): string {
		const rows = inningsByTeam.get(teamId);
		if (!rows?.length) return '—';
		return rows
			.map(
				(innings) =>
					`${formatScore(innings.runs, innings.wickets, innings.declared)} (${formatOvers(innings.overs)})`
			)
			.join(' & ');
	}
</script>

<a class="ccl-match" href="/match/{match.id}">
	<article class="oh-card">
		<div class="oh-row" style="width:100%; justify-content:space-between">
			<span class="oh-eyebrow {match.status === 'live' ? 'oh-eyebrow--band' : ''}"
				>{match.status}</span
			>
			{#if match.status === 'live'}
				<span class="ccl-live-dot" aria-hidden="true"></span>
			{/if}
		</div>
		<p class="ccl-kicker">{competitionLabel(match.competitionId, match.groupId)}</p>
		<h3 class="oh-card__title">{matchHeadline(match)}</h3>
		{#if match.status !== 'upcoming'}
			<p class="ccl-score">
				{teamLabel(match.homeTeamId, match.format)}
				{teamLine(match.homeTeamId)}
			</p>
			<p>
				{teamLabel(match.awayTeamId, match.format)}
				{teamLine(match.awayTeamId)}
			</p>
		{:else}
			<p class="oh-muted">{formatWhen(match.startAt)} · {match.venue}</p>
		{/if}
		{#if chaseLine(match)}
			<p><strong>{chaseLine(match)}</strong></p>
		{:else if match.resultText}
			<p><strong>{match.resultText}</strong></p>
		{/if}
		<p class="oh-muted">
			{match.venue}{#if match.status === 'live' && match.dayNumber}
				· Day {match.dayNumber}{/if}
		</p>
	</article>
</a>
