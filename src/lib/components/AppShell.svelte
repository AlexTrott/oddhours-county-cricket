<script lang="ts">
	import { page } from '$app/state';
	import { countyById, type ColourScheme } from '$lib/config';
	import { isTabActive, tabs } from '$lib/nav';

	let {
		favourite,
		scheme,
		children
	}: {
		favourite: string | null;
		scheme: ColourScheme;
		children: import('svelte').Snippet;
	} = $props();

	const pathname = $derived(page.url.pathname);
	const fav = $derived(favourite ? countyById[favourite] : null);
</script>

<a class="skip-link" href="#main">Skip to scores</a>

<div class="ccl-shell">
	<header class="ccl-masthead">
		<div class="ccl-masthead__inner">
			<a class="oh-nav__mark" href="/">
				<span class="oh-nav__logo">CC</span>
				<span class="ccl-wordmark">County Cricket Live</span>
			</a>
			<nav class="ccl-desktop-nav" aria-label="Primary">
				{#each tabs as tab (tab.id)}
					<a href={tab.href} aria-current={isTabActive(pathname, tab.href) ? 'page' : undefined}>
						{tab.label}
					</a>
				{/each}
			</nav>
			{#if fav}
				<a class="oh-btn oh-btn--primary ccl-desktop-nav" href="/my-team" style="min-height:2.4rem">
					{fav.shortName}
				</a>
			{/if}
		</div>
	</header>

	<main id="main" class="ccl-main">
		{@render children()}
	</main>

	<footer class="oh-footer ccl-footer">
		<div class="oh-footer__inner">
			<p class="oh-footer__wordmark">County Live</p>
			<div class="oh-footer__meta">
				<span
					>Unofficial fan site. Not affiliated with the ECB or any county club. Scheme: {scheme}.</span
				>
				<a href="/about">About &amp; sources</a>
			</div>
		</div>
	</footer>
</div>

<nav class="ccl-tabbar" aria-label="Primary">
	{#each tabs as tab (tab.id)}
		<a href={tab.href} aria-current={isTabActive(pathname, tab.href) ? 'page' : undefined}>
			<span class="ccl-tabbar__dot" aria-hidden="true"></span>
			{tab.label}
		</a>
	{/each}
</nav>
