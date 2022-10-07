<script lang="ts">
	import { womenCount, womenOfColorCount, menCount, menOfColorCount, nonbinaryPeopleCount, nonbinaryPeopleOfColorCount } from '$lib/stores';
	import { LogoVersion } from '$lib/types/LogoVersion';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/Button.svelte';
</script>

<Logo version={LogoVersion.SUBMARK} />
<div class="instructions">
	<h1>Plan Your Event</h1>
	<p class="intro">
		 It all starts here! Track your progress to a diverse speaking event.
		 Remember, every step counts! You can enter information for each panel or tabulate the results for the entire event. Let's get counting!
	</p>
	<p>
		 Below, input the number of women, men, nonbinary people, and people of color who will be speaking.
	</p>
	<p class="note">We affirm that trans men are men and trans women are women.</p>
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
		<label for="men">How many men of color?</label>
		<input type="number" id="men" placeholder="0" min="0" bind:value={$menOfColorCount} />
	</div>
	<div class="formItem">
		<label for="nonbinary">How many nonbinary persons?</label>
		<input type="number" id="nonbinary" placeholder="0" min="0" bind:value={$nonbinaryPeopleCount} />
	</div>
	<div class="formItem">
		<label for="men">How many nonbinary persons of color?</label>
		<input type="number" id="men" placeholder="0" min="0" bind:value={$nonbinaryPeopleOfColorCount} />
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
	.intro {
		max-width: 32rem;
	}
	.note {
		font-size: .8rem;
		font-style: italic;
		margin-bottom: 20px;
	}
	p {
		margin: 5px;
	}
	form {
		max-width: 25rem;
	}
	div.formItem {
		display: flex;
		justify-content: space-between;
		column-gap: 30px;
		align-items: center;
	}
</style>
