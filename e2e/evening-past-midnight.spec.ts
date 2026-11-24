import { expect, test } from '@playwright/test';

test('LAUNCH-02 a single evening past midnight says next day in the list, the dates view and the print one-sheet', async ({ page }) => {
  const destination = 'Rooftop countdown';

  await page.clock.setFixedTime(new Date('2030-06-10T12:00:00Z'));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto('./');
  await page.getByRole('link', { name: 'Start a Venture' }).click();
  await page.getByRole('textbox', { name: 'Destination' }).fill(destination);
  const next = page.getByRole('button', { name: 'Next →', exact: true });
  await next.click();
  await page.getByRole('button', { name: /^set a date$/i }).click();
  await page.getByRole('button', { name: 'Select June 15, 2030' }).click();
  await page.getByLabel('Start time (optional)').fill('21:00');
  await page.getByLabel('End time (optional)').fill('01:00');
  await expect(page.getByText(/Ends 1:00\s?AM the next day\./)).toBeVisible();
  await next.click();
  await next.click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await expect(page.getByRole('region', { name: 'Invite card preview' })).toContainText(/\(next\sday\)/);
  await page.getByRole('button', { name: 'Launch Venture' }).click();
  await expect(page.getByRole('heading', { name: destination, exact: true })).toBeVisible();

  await page.getByRole('navigation', { name: 'Venture planning steps' }).getByRole('link', { name: /When/ }).click();
  await expect(page.locator('.locked-card')).toContainText(/9:00\s?PM.*1:00\s?AM.*\(next\sday\)/);

  await page.getByRole('link', { name: 'Print one-sheet' }).click();
  await expect(page.getByRole('article')).toContainText(/9:00\s?PM.*1:00\s?AM.*\(next\sday\)/);

  await page.goto('./');
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: destination }) });
  await expect(card).toContainText(/9:00\s?PM.*1:00\s?AM.*\(next\sday\)/);
});
