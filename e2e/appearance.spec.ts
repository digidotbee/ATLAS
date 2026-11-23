import { expect, test } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`Storm is the default and saved theme choices survive reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('./#/settings');
    const root = page.locator('html');
    await expect(root).toHaveCSS('color-scheme', 'dark');
    await expect(page.getByRole('button', { name: 'Storm', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Auto', exact: true }).click();
    await page.reload();
    await expect(root).toHaveCSS('color-scheme', 'light');
    await expect(page.getByRole('button', { name: 'Auto', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(root).toHaveCSS('color-scheme', 'dark');

    await page.getByRole('button', { name: 'Daylight', exact: true }).click();
    await page.reload();
    await expect(root).toHaveCSS('color-scheme', 'light');
  });
}

test('the busy sync dot pulses only when motion is allowed', async ({ page }) => {
  await page.goto('./');
  // Isolate the busy style without connecting a Gist or depending on network timing.
  await page.locator('body').evaluate(body => {
    const badge = document.createElement('span');
    badge.className = 'sync-badge sync-busy';
    badge.append(document.createElement('i'), 'Syncing…');
    body.append(badge);
  });
  const dot = page.locator('.sync-busy i');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(dot).toBeVisible();
  await expect(dot).toHaveCSS('animation-name', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(dot).toHaveCSS('animation-name', 'pulse');
});
