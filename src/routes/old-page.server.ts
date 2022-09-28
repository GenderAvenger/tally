import { redirect } from '@sveltejs/kit';
import type { ServerLoadEvent } from '@sveltejs/kit';

const USER_HAS_VISITED = 'false';

export const load = (event: ServerLoadEvent) => {
	if (event.cookies.get('hasVisited') === USER_HAS_VISITED) {
		throw redirect(302, '/toolSelect');
	} else {
		event.cookies.set('hasVisited', USER_HAS_VISITED);
		throw redirect(302, '/intro');
	}
};
