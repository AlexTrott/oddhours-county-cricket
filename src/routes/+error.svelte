<script lang="ts">
	import { page } from '$app/state';

	let { error } = $props();
</script>

<svelte:head>
	<title>Gone · County Cricket Live</title>
</svelte:head>

<span class="oh-eyebrow">Missed stump</span>
<h1 class="ccl-page-title oh-display">{page.status}</h1>
<p class="oh-lede">{error.message ?? 'That page is not here.'}</p>
<p><a class="oh-btn oh-btn--primary" href="/">Back to live</a></p>
