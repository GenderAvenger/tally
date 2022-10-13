<script lang="ts">
	import { LogoVersion } from '$lib/types/LogoVersion';
	import Logo from '$lib/components/Logo.svelte';
	import { describeArc } from '$lib/utils';
	import primaryLogo from '$lib/assets/logos/primary.png';

	export let data;
	const {
		whiteWomenCount,
		womenOfColorCount,
		whiteMenCount,
		menOfColorCount,
		whiteNonbinaryPeopleCount,
		nonbinaryPeopleOfColorCount,
		sessionText,
		sessionDate
	} = data;
	const centerX = 450;
	const centerY = 350;
	const legendOffset = 450;
	const legendFirstRow = 50;
	const legendSecondRow = 460;
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
	const notDudesOfColorPercentage = womenOfColorPercentage + nonbinaryPeopleOfColorPercentage;

	enum Rating {
		GREAT = 'great',
		OK = 'ok',
		NOT_GOOD = 'not_good'
	}

	let rating: Rating;

	if (womenPercentage >= 0.5 && notDudesOfColorPercentage >= 0.15) {
		rating = Rating.GREAT;
	} else if (
		(womenPercentage < 0.5 && womenPercentage >= 0.35) ||
		(womenPercentage >= 0.5 && notDudesOfColorPercentage < 0.15)
	) {
		rating = Rating.OK;
	} else {
		rating = Rating.NOT_GOOD;
	}

	const outcomeTitle = {
		[Rating.GREAT]: "You're Amazing!",
		[Rating.OK]: "You're Getting There!",
		[Rating.NOT_GOOD]: "There's Progress to be Made!"
	}[rating];
</script>

<Logo version={LogoVersion.PRIMARY} />
<h1>{outcomeTitle}</h1>
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
	<text class="title" x="40" y="80">{sessionText}</text>
	<text class="date" x="40" y="140">{sessionDate}</text>
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
	<text class="whiteWomenCount" x={legendFirstRow} y={legendOffset + 200}
		>■ {whiteWomenCount} White {whiteWomenCount === 1 ? 'Woman' : 'Women'}</text
	>
	<text class="womenOfColorCount" x={legendSecondRow} y={legendOffset + 200}
		>■ {womenOfColorCount} {womenOfColorCount === 1 ? ' Woman' : ' Women'} of Color</text
	>
	<text class="whiteMenCount" x={legendFirstRow} y={legendOffset + 230}
		>■ {whiteMenCount} White {whiteMenCount === 1 ? ' Man' : 'Men'}</text
	>
	<text class="menOfColorCount" x={legendSecondRow} y={legendOffset + 230}
		>■ {menOfColorCount} {menOfColorCount === 1 ? ' Man' : ' Men'} of Color</text
	>
	<text class="whiteNonbinaryPeopleCount" x={legendFirstRow} y={legendOffset + 260}
		>■ {whiteNonbinaryPeopleCount} White Nonbinary {whiteNonbinaryPeopleCount === 1
			? 'Person'
			: 'People'}</text
	>
	<text class="nonbinaryPeopleOfColorCount" x={legendSecondRow} y={legendOffset + 260}
		>■ {nonbinaryPeopleOfColorCount} Nonbinary {nonbinaryPeopleOfColorCount === 1
			? 'Person'
			: 'People'} of Color</text
	>
	<image href={primaryLogo} width="200" x="350" y="790" />
</svg>

<div class="explanation">
	{#if rating === Rating.GREAT}
		<p>
			<strong>Wow, you’re on your way to becoming an influencer!</strong>
		</p>
		<p>
			You are a leader in this space, and we couldn’t be more excited for you! We encourage you to
			lead by example for your fellow colleagues, departments, and organizations in your industry by
			continuing to put on and showcase diverse speaker programs. Let others know about the awesome
			work you’re doing, speak out about the benefits, and hold yourselves accountable.
		</p>
		<p>
			Show your colleagues how you are adding value by emailing your wins. Download the chart to
			save and access anytime, anywhere. It’s yours to keep and share how you want. Print it out to
			bring to a meeting, or send your wins to your management and leadership teams.
		</p>
		<p>Keep up the incredible work!</p>
	{:else if rating === Rating.OK}
		<p>
			<strong>You’re getting there!</strong> Your speaker program has some diversity – well done! We
			notice there’s still room for improvement. Have you done everything you could have to include diverse
			voices? We know you can do this!
		</p>
		<p>
			<strong
				><em>Here are some tips to help you when planning your next speaker program:</em></strong
			>
		</p>
		<p>
			<strong>Evaluate your current speaker network.</strong> Is your network diverse? Do you have groups
			of people to call on across multiple industries? If you don’t, why is that? How can you solve for
			more diversity? Be aware of what stage you are at right now, and be intentional in your diversity
			commitments.
		</p>
		<p>
			<strong>Expand your network.</strong> Think outside of the box when you’re finding speakers. Consider
			other experts in the field. Put out a call to the community for speaker nominations. Ask other
			speakers and attendees who they would like to hear from.
		</p>
		<p>
			<strong>Provide training, mentorship, and speaking opportunities to new voices.</strong> We all
			start somewhere. Give others the space and resources to come forward and speak. Bring your colleagues
			into the conversation. Ensure new speakers feel supported when they take the stage.
		</p>
		<p>
			<strong>Create a welcoming environment for speakers and attendees alike.</strong> Make it clear
			across your website, social media channels, email campaigns, signage and all other communications
			that your program is fully accessible and welcome to everyone.
		</p>
		<p>
			Show your colleagues how you are adding value by emailing your wins. Download the chart to
			save and access anytime, anywhere. It’s yours to keep and share how you want. Print it out to
			bring to a meeting, or send your wins to your management and leadership teams.
		</p>
		<p>Reference this chart for your next speaker program, and commit to doing better!</p>
	{:else}
		<p>
			<strong>You have a journey ahead of you...</strong> and we’re here to help you! You’ve made the
			first step by using this tool. We acknowledge that there are many industries that do not represent
			many women or women of color. We’re with you to help change that. Remember, progress is progress,
			and every win is worth celebrating – no matter how small. You’ve got this!
		</p>
		<p>
			<strong
				><em> Here are some tips to help you when planning your next speaker program: </em></strong
			>
		</p>
		<p>
			<strong>Evaluate your current speaker network.</strong> Is your network diverse? Do you have groups
			of people to call on across multiple industries? If you don’t, why is that? How can you solve for
			more diversity? Be aware of what stage you are at right now, and be intentional in your diversity
			commitments.
		</p>
		<p>
			<strong>Expand your network.</strong> Think outside of the box when you’re finding speakers. Consider
			other experts in the field. Put out a call to the community for speaker nominations. Ask other
			speakers and attendees who they would like to hear from.
		</p>
		<p>
			<strong>Provide training, mentorship, and speaking opportunities to new voices.</strong> We all
			start somewhere. Give others the space and resources to come forward and speak. Bring your colleagues
			into the conversation. Ensure new speakers feel supported when they take the stage.
		</p>
		<p>
			<strong>Create a welcoming environment for speakers and attendees alike.</strong> Make it clear
			across your website, social media channels, email campaigns, signage and all other communications
			that your program is fully accessible and welcome to everyone.
		</p>
		<p>
			Show your colleagues how you are adding value by emailing your wins. Download the chart to
			save and access anytime, anywhere. It’s yours to keep and share how you want. Print it out to
			bring to a meeting, or send your wins to your management and leadership teams.
		</p>
		<p>Reference this chart for your next speaker program, and commit to doing better!</p>
	{/if}
</div>

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
		font-size: 40px;
		font-weight: bold;
		fill: var(--chart-title-text-color, #ffffff);
	}
	text.date {
		font-size: 36px;
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
		font-size: 30px;
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
