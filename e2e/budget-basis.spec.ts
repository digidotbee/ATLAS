import { expect, test } from '@playwright/test';

test('a per-person budget is saved and its group total follows the headcount', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2030-06-10T12:00:00Z'));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto('./');
  await page.getByRole('link', { name: 'Start a Venture' }).click();
  await page.getByRole('textbox', { name: 'Destination' }).fill('Big Bear Lake');
  const next = page.getByRole('button', { name: 'Next →', exact: true });
  await next.click();
  await page.getByRole('button', { name: /^set a date$/i }).click();
  await page.getByRole('checkbox', { name: 'Single day / evening' }).uncheck();
  await page.getByRole('button', { name: /Start date/ }).click();
  await page.getByRole('button', { name: 'Select June 15, 2030' }).click();
  await page.getByRole('button', { name: 'Select June 16, 2030' }).click();
  await next.click();
  await page.getByLabel('Adults').fill('2');
  await page.getByLabel('Children', { exact: true }).fill('0');
  await next.click();
  await page.getByRole('button', { name: 'Per person' }).click();
  await page.getByLabel('Budget per person').fill('250');
  await expect(page.getByRole('region', { name: 'Invite card preview' })).toContainText('$250 per person');
  await page.getByRole('button', { name: 'Launch Venture' }).click();
  await expect(page).toHaveURL(/#\/trip\/[^/]+\/plan$/);

  await page.getByRole('link', { name: /Venture settings/ }).click();
  const perPerson = page.getByRole('button', { name: 'Per person' });
  const amount = page.getByLabel('Budget per person');
  const budgetPanel = page.getByRole('complementary', { name: 'Budget' });
  await expect(perPerson).toHaveAttribute('aria-pressed', 'true');
  await expect(amount).toHaveValue('250');
  await expect(page.getByText('$500 for 2 people · follows the headcount')).toBeVisible();

  await page.getByLabel('Adults').fill('4');
  await expect(page.getByText('$1,000 for 4 people · follows the headcount')).toBeVisible();
  await expect(budgetPanel).toContainText('$1,000');
  await expect(budgetPanel).toContainText('$250 per person');

  await page.reload();
  await expect(perPerson).toHaveAttribute('aria-pressed', 'true');
  await expect(amount).toHaveValue('250');
  await expect(page.getByText('$1,000 for 4 people · follows the headcount')).toBeVisible();

  await page.getByRole('button', { name: 'Total (Everything included)' }).click();
  const total = page.getByLabel('Total budget');
  await expect(total).toHaveValue('1000');
  await page.getByLabel('Adults').fill('6');
  await expect(total).toHaveValue('1000');
  await expect(budgetPanel).not.toContainText('per person');
});
