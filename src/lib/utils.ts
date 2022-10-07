// This function was written by StackOverflow user `opsb`
// https://stackoverflow.com/a/18473154/159522
// Under a CC BY-SA 3.0 license: https://creativecommons.org/licenses/by-sa/3.0/
export const polarToCartesian = (
	centerX: number,
	centerY: number,
	radius: number,
	angleInDegrees: number,
) => {
	const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
	return {
		x: centerX + (radius * Math.cos(angleInRadians)),
		y: centerY + (radius * Math.sin(angleInRadians))
	};
}

// This function was written by StackOverflow user `opsb`
// https://stackoverflow.com/a/18473154/159522
// Under a CC BY-SA 3.0 license: https://creativecommons.org/licenses/by-sa/3.0/
export const describeArc = (
	centerX: number,
	centerY: number,
	radius: number,
	startAngleInDegrees: number,
	endAngleInDegrees: number,
) => {
	const middleAngleInDegrees = (endAngleInDegrees + startAngleInDegrees) / 2;
	const start = polarToCartesian(centerX, centerY, radius, startAngleInDegrees);
	const middle = polarToCartesian(centerX, centerY, radius, middleAngleInDegrees);
	const end = polarToCartesian(centerX, centerY, radius, endAngleInDegrees);
	const firstLargeArcFlag = middleAngleInDegrees - startAngleInDegrees <= 180 ? "0" : "1";
	const secondLargeArcFlag = endAngleInDegrees - middleAngleInDegrees <= 180 ? "0" : "1";
	const d = [
			"M", centerX, centerY,
			"L", start.x, start.y,
			"A", radius, radius, 0, firstLargeArcFlag, 1, middle.x, middle.y,
			"A", radius, radius, 0, secondLargeArcFlag, 1, end.x, end.y,
	].join(" ");
	return d;
}
