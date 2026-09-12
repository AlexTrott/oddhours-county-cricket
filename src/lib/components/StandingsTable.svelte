<script lang="ts">
	import { countyById } from '$lib/config';
	import type { StandingRow } from '$lib/match-types';

	let {
		rows,
		format
	}: {
		rows: StandingRow[];
		format: 'first-class' | 't20' | 'lista';
	} = $props();
</script>

<div class="ccl-table-wrap">
	<table class="ccl-table">
		<thead>
			<tr>
				<th>Team</th>
				<th class="num">P</th>
				<th class="num">W</th>
				<th class="num">L</th>
				{#if format === 'first-class'}
					<th class="num">D</th>
					<th class="num">Bat</th>
					<th class="num">Bowl</th>
				{:else}
					<th class="num">NR</th>
					<th class="num">NRR</th>
				{/if}
				<th class="num">Pts</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as row, index (row.teamId)}
				<tr>
					<td>
						<a class="oh-text-link" href="/team/{row.teamId}" style="margin-top:0">
							{index + 1}. {countyById[row.teamId]?.shortName ?? row.teamId}
						</a>
						{#if row.deducted}
							<div class="oh-muted">−{row.deducted} deducted</div>
						{/if}
					</td>
					<td class="num">{row.played}</td>
					<td class="num">{row.won}</td>
					<td class="num">{row.lost}</td>
					{#if format === 'first-class'}
						<td class="num">{row.drawn}</td>
						<td class="num">{row.battingBonus}</td>
						<td class="num">{row.bowlingBonus}</td>
					{:else}
						<td class="num">{row.noResult}</td>
						<td class="num">{row.netRunRate?.toFixed(3) ?? '—'}</td>
					{/if}
					<td class="num"><strong>{row.points}</strong></td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
