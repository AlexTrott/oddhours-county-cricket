<script lang="ts">
	import { countyById } from '$lib/config';
</script>

<svelte:head>
	<title>More · County Cricket Live</title>
</svelte:head>

<span class="oh-eyebrow">Also</span>
<h1 class="ccl-page-title oh-display">The rest of the kit.</h1>

<div class="ccl-grid ccl-grid--2">
	<a class="oh-tile" href="/about">
		<div class="oh-tile__swatch" style="--oh-tile-colour: var(--oh-band)"></div>
		<div class="oh-tile__meta">
			<strong>About</strong>
			<span>Unofficial, sources, takedown</span>
		</div>
	</a>
	<a class="oh-tile" href="/settings">
		<div class="oh-tile__swatch" style="--oh-tile-colour: var(--oh-accent)"></div>
		<div class="oh-tile__meta">
			<strong>Settings</strong>
			<span>Scheme, alerts stub, YouTube stub</span>
		</div>
	</a>
	<a class="oh-tile" href="/health">
		<div class="oh-tile__swatch" style="--oh-tile-colour: var(--oh-sticker-free)"></div>
		<div class="oh-tile__meta">
			<strong>Health</strong>
			<span>JSON for deploys</span>
		</div>
	</a>
	<a class="oh-tile" href="/standings">
		<div class="oh-tile__swatch" style="--oh-tile-colour: var(--oh-ink)"></div>
		<div class="oh-tile__meta">
			<strong>Counties</strong>
			<span>{Object.keys(countyById).length} first-class sides</span>
		</div>
	</a>
</div>
