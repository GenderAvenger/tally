<script lang="ts">
	import { LogoVersion } from '$lib/types/LogoVersion';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/Button.svelte';
</script>

<Logo version={LogoVersion.PRIMARY} />
<div class="instructions">
	<h1>Start Counting</h1>
	<p>How well are women being represented in the spaces around you?</p>
	<p>Choose how to measure inclusion:</p>
</div>
<div class="choices">
	<Button primaryLabel="Count" secondaryLabel="Who's Present" href="/tally" />
	<Button primaryLabel="Time" secondaryLabel="Who's Talking" href="/whotalks/choice" />
</div>

<style>
	.instructions {
		display: flex;
		flex-direction: column;
		text-align: center;
	}
	.choices {
		display: flex;
		justify-content: space-around;
		gap: 10px;
		margin-top: 1rem;
	}
</style>
