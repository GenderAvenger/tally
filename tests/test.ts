import { expect, test } from '@playwright/test';

test('index page has expected h1', async ({ page }) => {
	await page.goto('/tally');
	expect(await page.textContent('h1')).toBe('Champion Gender Equality');
});
