<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	export let href = '';
	export let primaryLabel = '';
	export let secondaryLabel = '';

	let wrapperTag = 'span';
	if (href !== '') {
		wrapperTag = 'a';
	}

	const dispatchClick = (event: Event) => {
		dispatch('click', event);
	};
</script>

<svelte:element this={wrapperTag} {href} on:click={dispatchClick}>
	<div class="button">
		{#if primaryLabel}
			<div class="primaryLabel">{primaryLabel}</div>
		{/if}
		{#if secondaryLabel}
			<div class="secondaryLabel">{secondaryLabel}</div>
		{/if}
	</div>
</svelte:element>

<style>
	a {
		text-decoration: none;
	}
	.button {
		background-color: var(--button-background-color, #ffffff);
		color: var(--button-color, #000000);
		font-weight: bold;
		text-transform: uppercase;
		cursor: pointer;
		padding: 12px 30px;
		text-align: center;
		display: flex;
		flex-direction: column;
	}
	.primaryLabel {
		font-size: 1em;
	}
	.secondaryLabel {
		margin-top: 7px;
		font-size: 0.8em;
	}
</style>
