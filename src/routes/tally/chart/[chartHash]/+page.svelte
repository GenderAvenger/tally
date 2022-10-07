<script lang="ts">
	import { LogoVersion } from '$lib/types/LogoVersion';
	import Logo from '$lib/components/Logo.svelte';
	import { page } from '$app/stores';
	import { describeArc } from '$lib/utils';
	import primaryLogo from '$lib/assets/logos/primary.png';

	const { chartHash } = $page.params;
	console.log(chartHash);
	const {
		womenCount,
		womenOfColorCount,
		menCount,
		menOfColorCount,
		nonbinaryPeopleCount,
		nonbinaryPeopleOfColorCount,
		sessionText
	} = JSON.parse(chartHash);
	const centerX = 450;
	const centerY = 350;
	const legendOffset = 450;
	const radius = 200;
	const totalCount = womenCount + menCount + nonbinaryPeopleCount;
	const womenPercentage = womenCount / Math.max(totalCount, 1);
	const womenOfColorPercentage = womenOfColorCount / Math.max(totalCount, 1);
	const menPercentage = menCount / Math.max(totalCount, 1);
	const menOfColorPercentage = menOfColorCount / Math.max(totalCount, 1);
	const nonbinaryPeoplePercentage = nonbinaryPeopleCount / Math.max(totalCount, 1);
	const nonbinaryPeopleOfColorPercentage = nonbinaryPeopleOfColorCount / Math.max(totalCount, 1);
</script>

<Logo version={LogoVersion.PRIMARY} />
<h1>Description text here</h1>
<svg id="chart" viewBox="0 0 900 900">
	<defs>
		<pattern
			id="womenOfColorHatch"
			width="20"
			height="20"
			patternTransform="rotate({(womenOfColorPercentage / 2) * 360 - 90} 0 0)"
			patternUnits="userSpaceOnUse"
		>
			<line x1="0" y1="0" x2="0" y2="20"/>
			<!-- <line x1="0" y1="0" x2="20" y2="0"/> -->
			<!-- <circle cx="10" cy="10" r="4" /> -->
		</pattern>
		<pattern
			id="menOfColorHatch"
			width="20"
			height="20"
			patternTransform="rotate({(menOfColorPercentage / 2) * 360 - 90 + womenPercentage * 360} 0 0)"
			patternUnits="userSpaceOnUse"
		>
			<line x1="0" y1="0" x2="0" y2="20"/>
			<!-- <line x1="0" y1="0" x2="20" y2="0"/> -->
			<!-- <circle cx="10" cy="10" r="4" /> -->
		</pattern>
		<pattern
			id="nonbinaryPeopleOfColorHatch"
			width="20"
			height="20"
			patternTransform="rotate({(nonbinaryPeopleOfColorPercentage / 2) * 360 -
				90 +
				(womenPercentage + menPercentage) * 360} 0 0)"
			patternUnits="userSpaceOnUse"
		>
			<line x1="0" y1="0" x2="0" y2="20"/>
			<!-- <line x1="0" y1="0" x2="20" y2="0"/> -->
			<!-- <circle cx="10" cy="10" r="4" /> -->
		</pattern>
	</defs>
	<rect class="background" x="3" y="3" />
	<image class="rating" href="ratingIcon.png" />
	<text class="title" x="40" y="80">{sessionText}</text>
	<circle cx={centerX} cy={centerY} r={radius} />
	<path class="womenCount" d={describeArc(centerX, centerY, radius, 0, womenPercentage * 360)} />
	<path
		class="womenOfColorCount"
		fill="url(#womenOfColorHatch)"
		d={describeArc(centerX, centerY, radius, 0, womenOfColorPercentage * 360)}
	/>
	<path
		class="menCount"
		d={describeArc(
			centerX,
			centerY,
			radius,
			womenPercentage * 360,
			(womenPercentage + menPercentage) * 360
		)}
	/>
	<path
		class="menOfColorCount"
		fill="url(#menOfColorHatch)"
		d={describeArc(
			centerX,
			centerY,
			radius,
			womenPercentage * 360,
			(womenPercentage + menOfColorPercentage) * 360
		)}
	/>
	<path
		class="nonbinaryPeopleCount"
		d={describeArc(
			centerX,
			centerY,
			radius,
			(womenPercentage + menPercentage) * 360,
			(womenPercentage + menPercentage + nonbinaryPeoplePercentage) * 360
		)}
	/>
	<path
		class="nonbinaryPeopleOfColorCount"
		fill="url(#nonbinaryPeopleOfColorHatch)"
		d={describeArc(
			centerX,
			centerY,
			radius,
			(womenPercentage + menPercentage) * 360,
			(womenPercentage + menPercentage + nonbinaryPeopleOfColorPercentage) * 360
		)}
	/>
	<!-- <text class="womenCount" x="80" y="700">{womenCount} {womenCount===1?' Woman':' Women'}</text>
	<text class="womenOfColorCount" x="90" y="730">∟</text>
	<text class="womenOfColorCount" x="115" y="738">{womenOfColorCount}{womenOfColorCount===1?' Woman':' Women'} of Color</text>
	<text class="menCount" x="600" y="250">{menCount} {menCount===1?' Man':' Men'}</text>
	<text class="menOfColorCount" x="610" y="280">∟</text>
	<text class="menOfColorCount" x="635" y="288">{menOfColorCount} {menOfColorCount===1?' Man':' Men'} of Color</text>
	<text class="nonbinaryPeopleCount" x="500" y="700">{nonbinaryPeopleCount} Nonbinary {nonbinaryPeopleCount===1?'Person':'People'}</text>
	<text class="nonbinaryPeopleOfColorCount" x="510" y="730">∟</text>
	<text class="nonbinaryPeopleOfColorCount" x="535" y="738">{nonbinaryPeopleOfColorCount} Nonbinary {nonbinaryPeopleOfColorCount===1?'Person':'People'} of Color</text> -->
	<!-- <text class="womenCount" x="80" y="700">{womenCount} {womenCount===1?' Woman':' Women'}</text>
	<text class="womenOfColorCount" x="83" y="730">∟</text>
	<text class="womenOfColorCount" x="110" y="737">{womenOfColorCount}{womenOfColorCount===1?' Woman':' Women'} of Color</text>
	<text class="nonbinaryPeopleCount" x="340" y="790">{nonbinaryPeopleCount} Nonbinary {nonbinaryPeopleCount===1?'Person':'People'}</text>
	<text class="nonbinaryPeopleOfColorCount" x="343" y="820">∟</text>
	<text class="nonbinaryPeopleOfColorCount" x="370" y="827">{nonbinaryPeopleOfColorCount} Nonbinary {nonbinaryPeopleOfColorCount===1?'Person':'People'} of Color</text>
	<text class="menCount" x="600" y="700">{menCount} {menCount===1?' Man':' Men'}</text>
	<text class="menOfColorCount" x="603" y="730">∟</text>
	<text class="menOfColorCount" x="630" y="737">{menOfColorCount} {menOfColorCount===1?' Man':' Men'} of Color</text> -->
	<!-- <text class="womenCount" x="80" y="700">{womenCount} {womenCount===1?' Woman':' Women'} ({womenOfColorCount}{womenOfColorCount===1?' Woman':' Women'} of Color)</text>
	<text class="menCount" x="80" y="730">{menCount} {menCount===1?' Man':' Men'} ({menOfColorCount} {menOfColorCount===1?' Man':' Men'} of Color)</text>
	<text class="nonbinaryPeopleCount" x="80" y="760">{nonbinaryPeopleCount} Nonbinary {nonbinaryPeopleCount===1?'Person':'People'} ({nonbinaryPeopleOfColorCount} Nonbinary {nonbinaryPeopleOfColorCount===1?'Person':'People'} of Color)</text> -->
	<text class="womenCount" x="180" y="{legendOffset + 200}"
		>■ {womenCount} White {womenCount === 1 ? 'Woman' : 'Women'}</text
	>
	<text class="womenOfColorCount" x="520" y="{legendOffset + 200}"
		>■ {womenOfColorCount} {womenOfColorCount === 1 ? ' Woman' : ' Women'} of Color</text
	>
	<text class="menCount" x="180" y="{legendOffset + 230}">■ {menCount} White {menCount === 1 ?' Man' : 'Men'}</text>
	<text class="menOfColorCount" x="520" y="{legendOffset + 230}"
		>■ {menOfColorCount} {menOfColorCount === 1 ? ' Man' : ' Men'} of Color</text
	>
	<text class="nonbinaryPeopleCount" x="180" y="{legendOffset + 260}"
		>■ {nonbinaryPeopleCount} White Nonbinary {nonbinaryPeopleCount === 1 ? 'Person' : 'People'}</text
	>
	<text class="nonbinaryPeopleOfColorCount" x="520" y="{legendOffset + 260}"
		>■ {nonbinaryPeopleOfColorCount} Nonbinary {nonbinaryPeopleOfColorCount === 1
			? 'Person'
			: 'People'} of Color</text
	>
	<image href="{primaryLogo}"
		width="200"
		x="350"
		y="790"
	/>
</svg>

<style>
	#chart {
		height: 600px;
		width: 600px;
	}
	@media (max-width: 900px) {
		#chart {
			height: 400px;
			width: 400px;
		}
	}
	rect.background {
		height: 894px;
		width: 894px;
		fill: var(--chart-background-color, #ffffff);
		stroke-width: 6px;
		stroke: var(--chart-border-color, #000000);
	}
	line.divider {
		stroke-width: 10px;
		stroke: var(--chart-border-color, #000000);
	}
	text.outcome {
		text-transform: uppercase;
		font: bold 40px arial;
		fill: var(--chart-outcome-text-color, #ffffff);
	}
	text.title {
		text-transform: uppercase;
		font: normal 40px arial;
		fill: var(--chart-title-text-color, #ffffff);
	}
	#womenOfColorHatch line,
	#menOfColorHatch line,
	#nonbinaryPeopleOfColorHatch line {
		stroke-width: 200px;
	}
	#womenOfColorHatch circle,
	#womenOfColorHatch line {
		stroke: var(--chart-women-of-color-fill, #999900);
		fill: var(--chart-women-of-color-fill, #999900);
	}
	#menOfColorHatch circle,
	#menOfColorHatch line {
		stroke: var(--chart-men-of-color-fill, #990099);
		fill: var(--chart-men-of-color-fill, #990099);
	}
	#nonbinaryPeopleOfColorHatch circle,
	#nonbinaryPeopleOfColorHatch line {
		stroke: var(--chart-nonbinary-people-of-color-fill, #669999);
		fill: var(--chart-nonbinary-people-of-color-fill, #669999);
	}
	/* path.womenOfColorCount {
		stroke: var(--chart-women-of-color-fill, #999900);
	}
	path.menOfColorCount {
		stroke: var(--chart-men-of-color-fill, #990099);
	}
	path.nonbinaryPeopleOfColorCount {
		stroke: var(--chart-nonbinary-people-of-color-fill, #669999);
	} */
	path.womenCount {
		fill: var(--chart-women-fill, #009900);
	}
	path.menCount {
		fill: var(--chart-men-fill, #990000);
	}
	path.nonbinaryPeopleCount {
		fill: var(--chart-nonbinary-people-fill, #0066ff);
	}
	text.womenCount,
	text.womenOfColorCount,
	text.menCount,
	text.menOfColorCount,
	text.nonbinaryPeopleCount,
	text.nonbinaryPeopleOfColorCount {
		font-size: 24px;
	}
	text.womenCount {
		fill: var(--chart-women-fill, #009900);
	}
	text.womenOfColorCount {
		fill: var(--chart-women-of-color-fill, #999900);
	}
	text.menCount {
		fill: var(--chart-men-fill, #990000);
	}
	text.menOfColorCount {
		fill: var(--chart-men-of-color-fill, #990099);
	}
	text.nonbinaryPeopleCount {
		fill: var(--chart-nonbinary-people-fill, #0066ff);
	}
	text.nonbinaryPeopleOfColorCount {
		fill: var(--chart-nonbinary-people-of-color-fill, #669999);
	}
</style>
