<script lang="ts">
	import {
		whiteWomenCount,
		womenOfColorCount,
		whiteMenCount,
		menOfColorCount,
		whiteNonbinaryPeopleCount,
		nonbinaryPeopleOfColorCount
	} from '$lib/stores';
	import { LogoVersion } from '$lib/types/LogoVersion';
	import Logo from '$lib/components/Logo.svelte';
	import Button from '$lib/components/Button.svelte';
</script>

<Logo version={LogoVersion.SUBMARK} />
<div class="instructions">
	<h1>Champion Gender Equality</h1>
	<p class="intro">
		As a meeting planner, you have a lot on your mind. We built this resource to align with your
		work. Let us help you meet your equality goals!
	</p>
	<p class="intro-two">
		Input the number of women, men, non-binary, and people of color who will be speaking at your
		program.
	</p>
	<p class="note">We affirm that trans men are men and trans women are women.</p>
</div>
<form>
	<div class="formItem">
		<label for="women">How many white women?</label>
		<input type="number" id="women" placeholder="0" min="0" bind:value={$whiteWomenCount} />
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
		<label for="men">How many white men?</label>
		<input type="number" id="men" placeholder="0" min="0" bind:value={$whiteMenCount} />
	</div>
	<div class="formItem">
		<label for="men">How many men of color?</label>
		<input type="number" id="men" placeholder="0" min="0" bind:value={$menOfColorCount} />
	</div>
	<div class="formItem">
		<label for="nonbinary">How many white nonbinary people?</label>
		<input
			type="number"
			id="nonbinary"
			placeholder="0"
			min="0"
			bind:value={$whiteNonbinaryPeopleCount}
		/>
	</div>
	<div class="formItem">
		<label for="men">How many nonbinary people of color?</label>
		<input
			type="number"
			id="men"
			placeholder="0"
			min="0"
			bind:value={$nonbinaryPeopleOfColorCount}
		/>
	</div>
	<div id="navigation">
		<Button primaryLabel="Continue" href="/tally/details" />
	</div>
</form>

<style>
	#navigation {
		justify-content: center;
	}
	.intro {
		max-width: 44rem;
		margin-bottom: 1.6rem;
	}
	.intro-two {
		max-width: 34rem;
		margin-bottom: 1.6rem;
	}
	.note {
		font-size: 1rem;
		font-style: italic;
		margin-bottom: 2rem;
	}
	p {
		margin: 5px;
	}
	form {
		max-width: 30rem;
	}
	div.formItem {
		display: flex;
		justify-content: space-between;
		column-gap: 30px;
		align-items: center;
	}
</style>
