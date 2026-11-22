import { expect, test } from '@playwright/test';

test.describe('Catalan browser', () => {
  test.use({ locale: 'ca-ES' });
  test('follows the browser language', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'L’univers té un idioma' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
  });
});

test.describe('unsupported browser language', () => {
  test.use({ locale: 'de-DE' });
  test('falls back to English', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'The universe has a language' })).toBeVisible();
  });
});

test('switching language in Settings translates the UI and content', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Saltar' }).click();
  await page.getByRole('link', { name: 'Ajustes' }).click();
  await page.getByRole('radio', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByRole('link', { name: 'Campaign' }).click();
  await expect(page.getByRole('heading', { name: 'Campaign', level: 1 })).toBeVisible();
  await expect(page.getByText('Complete the previous chapter to unlock it.').first()).toBeVisible();

  // The choice persists across reloads.
  await page.reload();
  await expect(page.getByRole('link', { name: 'Collection' })).toBeVisible();

  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'Automatic' }).click();
  await expect(page.getByRole('heading', { name: 'Ajustes', level: 1 })).toBeVisible();
});
