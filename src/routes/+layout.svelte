<script lang="ts">
	import '../app.css';
	import AppShell from '$lib/components/AppShell.svelte';
	import { countyOverlayCss, themeColorFor } from '$lib/config';

	let { data, children } = $props();
</script>

<svelte:head>
	<meta name="theme-color" content={themeColorFor(data.favourite, data.scheme)} />
	{@html `<style>${countyOverlayCss()}</style>`}
</svelte:head>

<AppShell favourite={data.favourite} scheme={data.scheme}>
	{@render children()}
</AppShell>
