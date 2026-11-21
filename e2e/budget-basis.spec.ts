import { expect, test, type Page } from '@playwright/test';

async function launchBigBear(page: Page, adults: string, budget: (page: Page) => Promise<void>) {
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
  await page.getByLabel('Adults').fill(adults);
  await page.getByLabel('Children', { exact: true }).fill('0');
  await next.click();
  await budget(page);
  await page.getByRole('button', { name: 'Launch Venture' }).click();
  await expect(page).toHaveURL(/#\/trip\/[^/]+\/plan$/);
}

async function setAdults(page: Page, adults: string) {
  await page.getByRole('link', { name: 'Change in Venture settings' }).click();
  await page.getByLabel('Adults').fill(adults);
}

// PRD v0.18 MVP acceptance check and BUDGET-01 / BUDGET-03.
test('a per-person target keeps its pill through a headcount change while the group target follows it', async ({ page }) => {
  await launchBigBear(page, '4', async (p) => {
    await p.getByRole('button', { name: 'Per person' }).click();
    await p.getByLabel('Budget per person').fill('150');
    await expect(p.getByRole('region', { name: 'Invite card preview' })).toContainText('$150 per person');
  });
  const ventureUrl = page.url();

  const pill = page.getByRole('link', { name: 'Budget: $150 per person' });
  await expect(pill).toHaveText('$150 per person');
  await pill.click();
  await expect(page).toHaveURL(/\/budget$/);
  await expect(page.getByRole('heading', { name: 'Budget', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Per person' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Budget per person')).toHaveValue('150');
  await expect(page.getByText('$600 for 4 people · follows the headcount')).toBeVisible();

  await setAdults(page, '6');
  await expect(pill).toHaveText('$150 per person');

  await page.goto('./');
  await page.goto(ventureUrl);
  await page.reload();
  await expect(pill).toHaveText('$150 per person');
  await pill.click();
  await expect(page.getByText('6 people', { exact: true })).toBeVisible();
  await expect(page.getByText('$900 for 6 people · follows the headcount')).toBeVisible();
  const budgetPanel = page.getByRole('complementary', { name: 'Budget' });
  await expect(budgetPanel).toContainText('$900');
  await expect(budgetPanel).toContainText('$150 per person');

  await page.getByRole('button', { name: 'Total (Everything included)' }).click();
  await expect(page.getByLabel('Total budget')).toHaveValue('900');
  await expect(page.getByRole('link', { name: 'Budget: $900 total' })).toBeVisible();
  await setAdults(page, '2');
  await expect(page.getByRole('link', { name: 'Budget: $900 total' })).toBeVisible();
});

test('a skipped budget offers +Set budget, a total stays fixed, and a legacy total reads as a total', async ({ page }) => {
  await launchBigBear(page, '4', async (p) => {
    await p.getByRole('button', { name: 'Skip for now' }).click();
  });

  const setBudget = page.getByRole('link', { name: 'Set budget' });
  await expect(setBudget).toHaveText('+Set budget');
  await setBudget.click();
  await expect(page).toHaveURL(/\/budget$/);
  await page.getByLabel('Total budget').fill('600');
  const totalPill = page.getByRole('link', { name: 'Budget: $600 total' });
  await expect(totalPill).toHaveText('$600 total');
  await setAdults(page, '6');
  await expect(totalPill).toHaveText('$600 total');

  // A Venture saved before budget bases existed has only budgetTotal.
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('atlas:data:v1') ?? '{}');
    delete data.trips[0].budgetBasis;
    data.trips[0].budgetTotal = 450;
    localStorage.setItem('atlas:data:v1', JSON.stringify(data));
  });
  await page.reload();
  const legacyPill = page.getByRole('link', { name: 'Budget: $450 total' });
  await expect(legacyPill).toHaveText('$450 total');
  await legacyPill.click();
  await expect(page.getByRole('button', { name: 'Total (Everything included)' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Per person' }).click();
  await expect(page.getByRole('link', { name: 'Budget: $75 per person' })).toBeVisible();
});
