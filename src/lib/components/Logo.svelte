<script lang="ts">
	import primaryLogo from '$lib/assets/logos/primary.png';
	import submarkLogo from '$lib/assets/logos/submark.png';
	import { LogoVersion } from '$lib/types/LogoVersion';
	import { content } from '$lib/theme';
	export let version: LogoVersion = LogoVersion.PRIMARY;

	const logos = {
		[LogoVersion.PRIMARY]: primaryLogo,
		[LogoVersion.SUBMARK]: submarkLogo
	};
	const logoPath = logos[version];
</script>

<a href="/"><img src={logoPath} alt={content.logoAltText} /></a>

<style>
	a {
		text-align: center;
	}
	img {
		max-width: 300px;
	}
</style>
