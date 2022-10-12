import { json } from '@sveltejs/kit';
import { getCollection } from '$lib/firebase';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
	const values = await request.json();
	const {
		whiteWomenCount,
		womenOfColorCount,
		whiteMenCount,
		menOfColorCount,
		whiteNonbinaryPeopleCount,
		nonbinaryPeopleOfColorCount,
		sessionText,
		sessionDate,
		sessionLocation,
		chartPurpose
	} = values;
	try {
		const chartsCollection = getCollection('charts');
		const chartData = {
			whiteWomenCount,
			womenOfColorCount,
			whiteMenCount,
			menOfColorCount,
			whiteNonbinaryPeopleCount,
			nonbinaryPeopleOfColorCount,
			sessionText,
			sessionDate,
			sessionLocation,
			chartPurpose
		};
		const chartRef = await chartsCollection.add(chartData);
		return json({ id: chartRef.id });
	} catch (e: unknown) {
		return json({});
	}
}
