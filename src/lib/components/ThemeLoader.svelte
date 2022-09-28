<script type="ts">
	import { onMount } from 'svelte';
	import { styles } from '$lib/theme';

	const setRootStyles = (theme: Record<string, string | string[]>) => {
		Object.entries(theme).forEach(([prop, value]) => {
			const cssVariableLabel = `--${prop}`;
			const cssVariableValue = value instanceof Array ? value.join(', ') : value;
			document.documentElement.style.setProperty(cssVariableLabel, cssVariableValue);
		});
	};

	onMount(() => {
		setRootStyles(styles);
	});
</script>

<slot />
