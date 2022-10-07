<script lang="ts">
	import { LogoVersion } from '$lib/types/LogoVersion';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/Button.svelte';
</script>

<Logo version={LogoVersion.PRIMARY} />
<div class="instructions">
	<h1>We're creating a more equitable world, one speaking engagement at a time.</h1>
	<p>Is your speaker line up diverse? Let us help!</p>
	<p>In a few simple steps, you can get an evaluation of the gender and racial diversity of your event.</p>
</div>
<div id="navigation">
	<Button primaryLabel="Get Started" href="/tally" />
</div>

<style>
	.instructions {
		display: flex;
		flex-direction: column;
		text-align: center;
	}
</style>
