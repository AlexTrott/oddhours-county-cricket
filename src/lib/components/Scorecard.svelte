<script lang="ts">
	import { countyById } from '$lib/config';
	import { formatOvers, formatScore, teamLabel } from '$lib/format';
	import type { MatchDetail } from '$lib/match-types';
	import { chaseLine, matchContext } from '$lib/match-view';

	let { match }: { match: MatchDetail } = $props();
</script>

{#each match.innings as innings (innings.id)}
	<section class="oh-card" aria-labelledby="inn-{innings.number}">
		<div class="oh-row" style="width:100%;justify-content:space-between">
			<h2 id="inn-{innings.number}" class="oh-card__title">
				{teamLabel(innings.battingTeamId, match.format)}
			</h2>
			<p class="ccl-score">
				{formatScore(innings.runs, innings.wickets, innings.declared)}
				<span class="oh-muted" style="font-size:1rem">{formatOvers(innings.overs)}</span>
			</p>
		</div>
		<div class="ccl-table-wrap">
			<table class="ccl-table">
				<caption class="visually-hidden">Batting</caption>
				<thead>
					<tr>
						<th>Batter</th>
						<th>How out</th>
						<th class="num">R</th>
						<th class="num">B</th>
						<th class="num">4</th>
						<th class="num">6</th>
					</tr>
				</thead>
				<tbody>
					{#each innings.batting as batter (batter.battingOrder)}
						<tr>
							<td>
								{batter.playerName}
								{#if batter.isStriker}<span class="oh-muted">*</span>{/if}
								{#if batter.isNonStriker}<span class="oh-muted">†</span>{/if}
							</td>
							<td>
								{batter.dismissal}
								{#if batter.dismissedBy}
									b {batter.dismissedBy}{/if}
								{#if batter.fielder && batter.dismissal === 'caught'}
									c {batter.fielder}{/if}
							</td>
							<td class="num">{batter.runs}</td>
							<td class="num">{batter.balls}</td>
							<td class="num">{batter.fours}</td>
							<td class="num">{batter.sixes}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="oh-muted">
			Extras: b {innings.byes}, lb {innings.legByes}, w {innings.wides}, nb {innings.noBalls}
			{#if innings.penalties}, pen {innings.penalties}{/if}
		</p>
		{#if innings.fow.length}
			<p>
				<strong>Fall:</strong>
				{innings.fow
					.map((row) => `${row.runs}/${row.wicketNumber} (${row.playerName}, ${row.overs})`)
					.join(', ')}
			</p>
		{/if}
		<div class="ccl-table-wrap">
			<table class="ccl-table">
				<caption class="visually-hidden">Bowling</caption>
				<thead>
					<tr>
						<th>Bowler</th>
						<th class="num">O</th>
						<th class="num">M</th>
						<th class="num">R</th>
						<th class="num">W</th>
					</tr>
				</thead>
				<tbody>
					{#each innings.bowling as bowler (bowler.bowlingOrder)}
						<tr>
							<td>{bowler.playerName}</td>
							<td class="num">{bowler.overs}</td>
							<td class="num">{bowler.maidens}</td>
							<td class="num">{bowler.runs}</td>
							<td class="num">{bowler.wickets}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/each}

{#if chaseLine(match)}
	<p class="oh-lede">{chaseLine(match)}</p>
{/if}
<p class="oh-muted">{matchContext(match)}</p>
{#if match.tossWinnerId}
	<p class="oh-muted">
		Toss: {countyById[match.tossWinnerId]?.name} chose to {match.tossDecision}.
	</p>
{/if}
