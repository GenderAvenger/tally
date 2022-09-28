<script lang="ts">
	export let href = '/';
	export let primaryLabel = '';
	export let secondaryLabel = '';
</script>

<a {href}>
	<div class="button">
		{#if primaryLabel}
			<div class="primaryLabel">{primaryLabel}</div>
		{/if}
		{#if secondaryLabel}
			<div class="secondaryLabel">{secondaryLabel}</div>
		{/if}
	</div>
</a>

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
		padding: 10px 24px;
		text-align: center;
		display: flex;
		flex-direction: column;
	}
	.primaryLabel {
		font-size: 1.25em;
	}
	.secondaryLabel {
		margin-top: 7px;
		font-size: 0.8em;
	}
</style>
