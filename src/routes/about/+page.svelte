<script lang="ts">
	let { data } = $props();
	const emailIsPlaceholder = $derived(data.takedownEmail.endsWith('@example.com'));
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
			Page loads read <strong>SQLite only</strong>. Scores arrive through a separate
			<code class="oh-mono">pnpm ingest</code>
			job (optional <code class="oh-mono">--watch</code>) that talks to ESPN's public cricket JSON —
			the same object IDs as ESPNCricinfo. BBC Sport and Cricbuzz are not fallbacks.
		</p>
		<ul>
			<li>ESPN / ESPNCricinfo — primary ingest path, off the request path.</li>
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
			If you represent a rights holder and want something removed, open a GitHub issue:
			<a class="oh-text-link" href={data.takedownIssuesUrl}>{data.takedownIssuesUrl}</a>.
			{#if emailIsPlaceholder}
				A dedicated email is not published yet; set <code class="oh-mono">TAKEDOWN_EMAIL</code> before
				a public deploy.
			{:else}
				You can also email
				<a href="mailto:{data.takedownEmail}">{data.takedownEmail}</a>.
			{/if}
			Season config: {data.season}.
		</p>
	</article>
</div>
