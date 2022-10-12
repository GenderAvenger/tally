<script>
	import './_global.css';
	import Footer from './_components/Footer.svelte';
	import ThemeLoader from '../lib/components/ThemeLoader.svelte';
</script>

<ThemeLoader />
<div id="container">
	<slot />
</div>
<Footer privacyPolicyUrl="https://google.com" />
