<script lang="ts">
	import { enhance } from '$app/forms';
	import { SCHEME_STORAGE_KEY } from '$lib/config';

	let { data } = $props();

	function persist(scheme: string) {
		try {
			localStorage.setItem(SCHEME_STORAGE_KEY, scheme);
			if (scheme === 'dark') document.documentElement.setAttribute('data-scheme', 'dark');
			else document.documentElement.removeAttribute('data-scheme');
		} catch {
			/* private mode */
		}
	}
</script>

<svelte:head>
	<title>Settings · County Cricket Live</title>
</svelte:head>

<span class="oh-eyebrow">Settings</span>
<h1 class="ccl-page-title oh-display">Keep it quiet.</h1>

<div class="oh-stack-lg">
	<article class="oh-card">
		<h2 class="oh-card__title">Colour scheme</h2>
		<p>
			Petrol stays on <code class="oh-mono">&lt;html&gt;</code>. Dark is a petrol-derived overlay,
			not OddHours night (studio magenta) and not a ninth house theme.
		</p>
		<form
			method="POST"
			action="?/setScheme"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success' && result.data && 'scheme' in result.data) {
						persist(String(result.data.scheme));
					}
					await update();
				};
			}}
		>
			<div class="oh-seg" role="radiogroup" aria-label="Colour scheme">
				<button
					class="oh-seg__opt"
					type="submit"
					name="scheme"
					value="light"
					role="radio"
					aria-checked={data.scheme === 'light'}
				>
					Light
				</button>
				<button
					class="oh-seg__opt"
					type="submit"
					name="scheme"
					value="dark"
					role="radio"
					aria-checked={data.scheme === 'dark'}
				>
					Dark
				</button>
			</div>
		</form>
	</article>

	<article class="oh-card">
		<h2 class="oh-card__title">Alerts</h2>
		<p>Push notifications are not in this milestone.</p>
		<button class="oh-btn oh-btn--closed" type="button" disabled>Coming later</button>
	</article>

	<article class="oh-card">
		<h2 class="oh-card__title">YouTube live</h2>
		<p>
			County channel IDs are empty placeholders in config. Discovery is a later milestone. Ingest
			cadence (when enabled): live scorecards {data.polling.liveMinSeconds}–{data.polling
				.liveMaxSeconds}s per live match; fixtures {data.polling.fixturesMatchDaySeconds}s on match
			days /
			{data.polling.fixturesIdleSeconds}s otherwise; standings {data.polling.standingsLiveSeconds}s
			if anything is live else {data.polling.standingsIdleSeconds}s.
		</p>
		<button class="oh-btn oh-btn--sold-out" type="button" disabled>Not wired</button>
	</article>
</div>
