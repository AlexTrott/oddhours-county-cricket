<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>About · County Cricket Live</title>
</svelte:head>

<span class="oh-eyebrow">Unofficial</span>
<h1 class="ccl-page-title oh-display">A fan site. Not the counties.</h1>

<div class="oh-stack-lg">
	<article class="oh-card">
		<h2 class="oh-card__title">Not affiliated</h2>
		<p>
			County Cricket Live is an unofficial fan project from OddHours. It is not affiliated with,
			endorsed by, or sponsored by the England and Wales Cricket Board, any first-class county club,
			or any competition title sponsor. There are no county crests, logos, or sponsor marks here on
			purpose.
		</p>
	</article>

	<article class="oh-card">
		<h2 class="oh-card__title">Sources</h2>
		<p>
			This boot uses <strong>seeded SQLite</strong> (full 2026 fixture snapshot plus demo
			scorecards) so the app works offline. Production ingest hits ESPN public JSON from
			<code class="oh-mono">pnpm ingest</code>
			when <code class="oh-mono">INGESTION_ENABLED=true</code> — never from a page load.
		</p>
		<ul>
			<li>ESPNCricinfo / ESPN site.web.api JSON — primary ingest path (gated by env).</li>
			<li>
				ESPNCricinfo live-scores RSS — live discovery fallback only (no scorecards; skips women’s
				cricket).
			</li>
			<li>BBC Sport — not a fallback. robots.txt and Terms of Use forbid scraping.</li>
			<li>Cricbuzz — not a fallback. robots.txt Disallow: / for generic user-agents.</li>
		</ul>
		<p>
			<a class="oh-text-link" href="https://github.com/AlexTrott/oddhours-county-cricket"
				>Read docs/sources.md in the repo</a
			>
		</p>
	</article>

	<article class="oh-card">
		<h2 class="oh-card__title">Takedown</h2>
		<p>
			If you represent a rights holder and want something removed, email
			<a href="mailto:{data.takedownEmail}">{data.takedownEmail}</a>
			(placeholder). Season config: {data.season}.
		</p>
	</article>
</div>
