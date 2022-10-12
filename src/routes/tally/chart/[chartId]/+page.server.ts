import { getCollection } from '$lib/firebase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { chartId } = params;
	const chartCollection = getCollection('charts');
	const chartRef = chartCollection.doc(chartId);
	const chart = await chartRef.get();
	return chart.data();
};
