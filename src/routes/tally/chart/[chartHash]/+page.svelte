<script lang="ts">
	import { LogoVersion } from '$lib/types/LogoVersion';
	import Logo from '$lib/components/Logo.svelte';
	import { page } from '$app/stores';
	import { describeArc } from '$lib/utils';
	import primaryLogo from '$lib/assets/logos/primary.png';
	const { chartHash } = $page.params;
	const {
		whiteWomenCount,
		womenOfColorCount,
		whiteMenCount,
		menOfColorCount,
		whiteNonbinaryPeopleCount,
		nonbinaryPeopleOfColorCount,
		sessionText
	} = JSON.parse(chartHash);
	const centerX = 450;
	const centerY = 350;
	const legendOffset = 450;
	const radius = 200;
	const womenCount = whiteWomenCount + womenOfColorCount;
	const menCount = whiteMenCount + menOfColorCount;
	const nonbinaryPeopleCount = whiteNonbinaryPeopleCount + nonbinaryPeopleOfColorCount;
	const totalCount = womenCount + menCount + nonbinaryPeopleCount;
	const whiteWomenPercentage = whiteWomenCount / Math.max(totalCount, 1);
	const womenOfColorPercentage = womenOfColorCount / Math.max(totalCount, 1);
	const womenPercentage = whiteWomenPercentage + womenOfColorPercentage;
	const whiteMenPercentage = whiteMenCount / Math.max(totalCount, 1);
	const menOfColorPercentage = menOfColorCount / Math.max(totalCount, 1);
	const menPercentage = whiteMenPercentage + menOfColorPercentage;
	const whiteNonbinaryPeoplePercentage = whiteNonbinaryPeopleCount / Math.max(totalCount, 1);
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
			<line x1="0" y1="0" x2="0" y2="20" />
		</pattern>
		<pattern
			id="menOfColorHatch"
			width="20"
			height="20"
			patternTransform="rotate({(menOfColorPercentage / 2) * 360 - 90 + womenPercentage * 360} 0 0)"
			patternUnits="userSpaceOnUse"
		>
			<line x1="0" y1="0" x2="0" y2="20" />
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
			<line x1="0" y1="0" x2="0" y2="20" />
		</pattern>
	</defs>
	<rect class="background" x="3" y="3" />
	<image class="rating" href="ratingIcon.png" />
	<text class="title" x="40" y="80">{sessionText}</text>
	<circle cx={centerX} cy={centerY} r={radius} />
	<path
		class="whiteWomenCount"
		d={describeArc(centerX, centerY, radius, 0, whiteWomenPercentage * 360)}
	/>
	<path
		class="womenOfColorCount"
		fill="url(#womenOfColorHatch)"
		d={describeArc(
			centerX,
			centerY,
			radius,
			whiteWomenPercentage * 360,
			(whiteWomenPercentage + womenOfColorPercentage) * 360
		)}
	/>
	<path
		class="whiteMenCount"
		d={describeArc(
			centerX,
			centerY,
			radius,
			womenPercentage * 360,
			(womenPercentage + whiteMenPercentage) * 360
		)}
	/>
	<path
		class="menOfColorCount"
		fill="url(#menOfColorHatch)"
		d={describeArc(
			centerX,
			centerY,
			radius,
			(womenPercentage + whiteMenPercentage) * 360,
			(womenPercentage + whiteMenPercentage + menOfColorPercentage) * 360
		)}
	/>
	<path
		class="whiteNonbinaryPeopleCount"
		d={describeArc(
			centerX,
			centerY,
			radius,
			(womenPercentage + menPercentage) * 360,
			(womenPercentage + menPercentage + whiteNonbinaryPeoplePercentage) * 360
		)}
	/>
	<path
		class="nonbinaryPeopleOfColorCount"
		fill="url(#nonbinaryPeopleOfColorHatch)"
		d={describeArc(
			centerX,
			centerY,
			radius,
			(womenPercentage + menPercentage + whiteNonbinaryPeoplePercentage) * 360,
			(womenPercentage +
				menPercentage +
				whiteNonbinaryPeoplePercentage +
				nonbinaryPeopleOfColorPercentage) *
				360
		)}
	/>
	<text class="whiteWomenCount" x="180" y={legendOffset + 200}
		>■ {whiteWomenCount} White {whiteWomenCount === 1 ? 'Woman' : 'Women'}</text
	>
	<text class="womenOfColorCount" x="520" y={legendOffset + 200}
		>■ {womenOfColorCount} {womenOfColorCount === 1 ? ' Woman' : ' Women'} of Color</text
	>
	<text class="whiteMenCount" x="180" y={legendOffset + 230}
		>■ {whiteMenCount} White {whiteMenCount === 1 ? ' Man' : 'Men'}</text
	>
	<text class="menOfColorCount" x="520" y={legendOffset + 230}
		>■ {menOfColorCount} {menOfColorCount === 1 ? ' Man' : ' Men'} of Color</text
	>
	<text class="whiteNonbinaryPeopleCount" x="180" y={legendOffset + 260}
		>■ {whiteNonbinaryPeopleCount} White Nonbinary {whiteNonbinaryPeopleCount === 1
			? 'Person'
			: 'People'}</text
	>
	<text class="nonbinaryPeopleOfColorCount" x="520" y={legendOffset + 260}
		>■ {nonbinaryPeopleOfColorCount} Nonbinary {nonbinaryPeopleOfColorCount === 1
			? 'Person'
			: 'People'} of Color</text
	>
	<image href={primaryLogo} width="200" x="350" y="790" />
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
	#womenOfColorHatch line {
		stroke: var(--chart-women-of-color-fill, #999900);
		fill: var(--chart-women-of-color-fill, #999900);
	}
	#menOfColorHatch line {
		stroke: var(--chart-men-of-color-fill, #990099);
		fill: var(--chart-men-of-color-fill, #990099);
	}
	#nonbinaryPeopleOfColorHatch line {
		stroke: var(--chart-nonbinary-people-of-color-fill, #669999);
		fill: var(--chart-nonbinary-people-of-color-fill, #669999);
	}
	path.whiteWomenCount {
		fill: var(--chart-white-women-fill, #009900);
	}
	path.whiteMenCount {
		fill: var(--chart-white-men-fill, #990000);
	}
	path.whiteNonbinaryPeopleCount {
		fill: var(--chart-white-nonbinary-people-fill, #0066ff);
	}
	text.whiteWomenCount,
	text.womenOfColorCount,
	text.whiteMenCount,
	text.menOfColorCount,
	text.whiteNonbinaryPeopleCount,
	text.nonbinaryPeopleOfColorCount {
		font-size: 24px;
	}
	text.whiteWomenCount {
		fill: var(--chart-white-women-fill, #009900);
	}
	text.womenOfColorCount {
		fill: var(--chart-women-of-color-fill, #999900);
	}
	text.whiteMenCount {
		fill: var(--chart-white-men-fill, #990000);
	}
	text.menOfColorCount {
		fill: var(--chart-men-of-color-fill, #990099);
	}
	text.whiteNonbinaryPeopleCount {
		fill: var(--chart-white-nonbinary-people-fill, #0066ff);
	}
	text.nonbinaryPeopleOfColorCount {
		fill: var(--chart-nonbinary-people-of-color-fill, #669999);
	}
</style>
