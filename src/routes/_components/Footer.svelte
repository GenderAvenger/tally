<script lang="ts">
	export let privacyPolicyUrl: string;
</script>

<div class="footer">
	<a href={privacyPolicyUrl} target="_blank">Privacy Policy</a>
</div>

<style>
	a,
	a:visited,
	a:hover {
		color: var(--body-link-color, #0000ff);
		text-decoration: none;
	}
	.footer {
		position: fixed;
		bottom: 0px;
		left: 0px;
		padding-bottom: 20px;
		display: flex;
		justify-content: center;
		width: 100%;
	}
</style>
