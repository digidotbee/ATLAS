import { expect, test } from '@playwright/test';

test('a Planner can create a fixed-date Venture, choose a cabin, and print the saved plan', async ({ page }) => {
  const destination = 'Big Bear Lake';
  const chosenCabin = 'Pine Ridge Cabin';
  const otherCabin = 'Lakeview Cabin';

  await page.clock.setFixedTime(new Date('2030-06-10T12:00:00Z'));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto('./');
  await page.getByRole('link', { name: 'Start a Venture' }).click();
  await page.getByRole('textbox', { name: 'Destination' }).fill(destination);
  const next = page.getByRole('button', { name: 'Next →', exact: true });
  await next.click();
  await page.getByRole('button', { name: /^set a date$/i }).click();
  await page.getByRole('checkbox', { name: 'Single day / evening' }).uncheck();
  await page.getByRole('button', { name: /Start date/ }).click();
  await page.getByRole('button', { name: 'Select June 15, 2030' }).click();
  await page.getByRole('button', { name: 'Select June 16, 2030' }).click();
  await next.click();
  await expect(page.getByRole('heading', { name: 'Crew', exact: true })).toBeVisible();
  await next.click();
  await page.getByRole('button', { name: 'Skip for now' }).click();
  const preview = page.getByRole('region', { name: 'Invite card preview' });
  await expect(preview).toContainText(/Jun 15, 2030.*Jun 16, 2030/);
  await expect(preview).not.toContainText('Opt in by');
  await page.getByRole('button', { name: 'Launch Venture' }).click();
  await expect(page).toHaveURL(/#\/trip\/[^/]+\/plan$/);
  await expect(page.getByRole('heading', { name: destination, exact: true })).toBeVisible();

  await page.getByRole('navigation', { name: 'Trip planning steps' }).getByRole('link', { name: /Explore/ }).click();
  for (const cabin of [chosenCabin, otherCabin]) {
    await page.getByRole('button', { name: /Add option/ }).click();
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill(cabin);
    await page.getByRole('combobox', { name: 'Category' }).selectOption('lodging');
    await page.getByRole('button', { name: 'Save option' }).click();
  }
  const chosenCard = page.getByRole('article').filter({ has: page.getByRole('heading', { name: chosenCabin }) });
  await chosenCard.getByRole('button', { name: /Choose/ }).click();
  await expect(chosenCard.getByRole('button', { name: /Back to shortlist/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: otherCabin })).toBeVisible();
  await page.getByRole('link', { name: 'Print one-sheet' }).click();

  // Observe the browser print request without opening an operating-system dialog.
  let printRequests = 0;
  await page.exposeFunction('print', () => { printRequests += 1; });
  const printButton = page.getByRole('button', { name: 'Print / Save as PDF' });
  await printButton.click();
  await expect.poll(() => printRequests).toBe(1);

  await page.emulateMedia({ media: 'print' });
  const sheet = page.getByRole('article');
  await expect(sheet.getByRole('heading', { name: destination })).toBeVisible();
  await expect(sheet).toContainText(/Jun 15.*Jun 16, 2030/);
  await expect(sheet.getByText(chosenCabin, { exact: true })).toBeVisible();
  await expect(sheet).not.toContainText(otherCabin);
  await expect(printButton).toBeHidden();
});
