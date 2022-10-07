<script lang="ts">
	import { womenCount, womenOfColorCount, menCount, menOfColorCount, nonbinaryPeopleCount, nonbinaryPeopleOfColorCount, sessionText, hashtag } from '$lib/stores';
	import { LogoVersion } from '$lib/types/LogoVersion';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/Button.svelte';

	const chartHash = JSON.stringify({
		womenCount: $womenCount,
		womenOfColorCount: $womenOfColorCount,
		menCount: $menCount,
		menOfColorCount: $menOfColorCount,
		nonbinaryPeopleCount: $nonbinaryPeopleCount,
		nonbinaryPeopleOfColorCount: $nonbinaryPeopleOfColorCount,
		sessionText: $sessionText,
		hashtag: $hashtag,
	});
</script>

<Logo version={LogoVersion.SUBMARK} />
<form>
	<div class="formItem">
		<label for="sessionText">What are you tallying?</label>
		<textarea
			id="sessionText"
			placeholder="e.g. ABC Conference or Top 100 Books XYZ Magazine"
			bind:value={$sessionText}
		/>
	</div>
	<div class="formItem">
		<label for="hashtag">Hashtag</label>
		<input type="text" id="hashtag" placeholder="optional" bind:value={$hashtag} />
	</div>
	<div id="navigation">
		<Button primaryLabel="Back" href="/tally" />
		<Button primaryLabel="Continue" href="/tally/chart/{chartHash}" />
	</div>
</form>

<style>
	#navigation {
		justify-content: space-between;
	}
</style>
