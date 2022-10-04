<script lang="ts">
	import { womenCount, womenOfColorCount, menCount, nonbinaryCount } from '$lib/stores';
	import { LogoVersion } from '$lib/types/LogoVersion';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/Button.svelte';
</script>

<Logo version={LogoVersion.SUBMARK} />
<div class="instructions">
	<p>
		Tally and share the gender balance (good or bad!) of a conference panel, best-of list, or
		anywhere women's voices should be heard.
	</p>
</div>
<form>
	<div class="formItem">
		<label for="women">How many women total?</label>
		<input type="number" id="women" placeholder="0" min="0" bind:value={$womenCount} />
	</div>
	<div class="formItem">
		<label for="womenofcolor">How many women of color?</label>
		<input
			type="number"
			id="womenofcolor"
			placeholder="0"
			min="0"
			bind:value={$womenOfColorCount}
		/>
	</div>
	<div class="formItem">
		<label for="men">How many men?</label>
		<input type="number" id="men" placeholder="0" min="0" bind:value={$menCount} />
	</div>
	<div class="formItem">
		<label for="nonbinary">How many nonbinary persons?</label>
		<input type="number" id="nonbinary" placeholder="0" min="0" bind:value={$nonbinaryCount} />
	</div>
	<div id="navigation">
		<Button primaryLabel="Back" href="/" />
		<Button primaryLabel="Continue" href="/tally/details" />
	</div>
</form>

<style>
	#navigation {
		justify-content: space-between;
	}
</style>
