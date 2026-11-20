import { expect, test } from '@playwright/test';

test.use({ timezoneId: 'America/Los_Angeles' });

test('a Planner can revise the opt-in deadline, review the invite, and launch into Date Decision', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2030-06-10T12:00:00Z'));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto('./');
  await page.getByRole('link', { name: 'Start a Venture' }).click();
  await page.getByRole('textbox', { name: 'Destination' }).fill('Lakeside picnic');
  const next = page.getByRole('button', { name: 'Next →', exact: true });
  await next.click();
  await page.getByRole('button', { name: /^set for date decision$/i }).click();
  await page.getByRole('button', { name: /Earliest start/ }).click();
  await page.getByRole('button', { name: 'Select June 15, 2030' }).click();
  await page.getByRole('button', { name: 'Select June 22, 2030' }).click();
  await page.getByRole('button', { name: 'In 24 hours' }).click();
  const cutoff = page.getByLabel('Opt in by', { exact: true });
  await expect(cutoff).toHaveValue('2030-06-11T05:00');
  await next.click();
  await page.getByRole('spinbutton', { name: 'Adults', exact: true }).fill('3');
  await next.click();
  await page.getByRole('button', { name: 'Per person', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Budget per person' }).fill('150');
  const preview = page.getByRole('region', { name: 'Invite card preview' });
  await expect(preview).toContainText('Jun 11, 2030');

  await page.getByRole('button', { name: 'Edit Schedule' }).click();
  await page.getByRole('button', { name: 'In 3 days' }).click();
  await expect(cutoff).toHaveValue('2030-06-13T05:00');
  await cutoff.fill('2030-06-13T18:30');
  await next.click();
  await expect(page.getByRole('spinbutton', { name: 'Adults', exact: true })).toHaveValue('3');
  await next.click();
  await expect(preview).toContainText(/Jun 15, 2030.*Jun 22, 2030/);
  await expect(preview).toContainText(/Opt in by.*Jun 13, 2030.*6:30 PM/);
  await expect(preview).not.toContainText('Jun 11, 2030');
  await expect(preview).toContainText('5 people');
  await expect(preview).toContainText('$150 per person');
  await page.getByRole('button', { name: 'Launch Venture' }).click();
  await expect(page).toHaveURL(/#\/trip\/[^/]+\/dates$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Lakeside picnic' })).toBeVisible();
  await expect(page.getByText(/Jun 13, 2030.*6:30 PM/)).toBeVisible();
});
