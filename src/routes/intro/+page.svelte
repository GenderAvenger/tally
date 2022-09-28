<script lang="ts">
	import { LogoVersion } from '$lib/types/LogoVersion';
	import Logo from '$lib/components/Logo.svelte';
</script>

<Logo version={LogoVersion.PRIMARY} />

<div role="main" class="container">
	<div class="row">
		<div
			class="col-xs-offset-1 col-xs-10 col-sm-offset-2 col-sm-8 col-md-offset-3 col-md-6 text-center"
		>
			<h1 class="hidden-xs">Start Counting</h1>
			<p>How well are women being represented in the spaces around you?</p>
			<p class="hidden-xs">Choose how to measure inclusion:</p>
		</div>
	</div>
	<div class="row text-center tool-list">
		<div class="col-xs-offset-1 col-sm-offset-2 col-sm-4 col-xs-10">
			<a href="tally">
				<div class="button btn-pad">
					<span class="larger">Count</span>
					<br />
					<span class="small">Who's Present</span>
				</div>
			</a>
		</div>
		<div class="col-xs-offset-1 col-sm-offset-0 col-sm-4 col-xs-10">
			<a href="whotalks/choice">
				<div class="button btn-pad">
					<span class="larger">Time</span>
					<br />
					<span class="small">Who's Talking</span>
				</div>
			</a>
		</div>
	</div>
</div>
