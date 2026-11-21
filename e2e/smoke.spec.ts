import { expect, test, type Page } from '@playwright/test';

async function center(page: Page, selector: string) {
  const box = (await page.locator(selector).first().boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function drag(page: Page, from: string, to: string) {
  const a = await center(page, `[data-node="${from}"] :is(.vertex-core,.ext-dot)`);
  const b = await center(page, `[data-node="${to}"] :is(.vertex-core,.ext-dot)`);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) await page.mouse.move(a.x + ((b.x - a.x) * i) / 8, a.y + ((b.y - a.y) * i) / 8);
  await page.mouse.up();
}

test('onboarding and the whole first level', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await page.getByRole('button', { name: 'Empezar el nivel 1' }).click();
  await page.getByRole('button', { name: 'Empezar' }).click();

  await page.locator('[aria-label^="Línea: electrón"]').first().click({ force: true });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.locator('[aria-label^="Línea: fotón"]').first().click({ force: true });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('listitem').filter({ hasText: 'De izquierda a derecha' }).click();
  await page.getByRole('button', { name: 'Ver resultado' }).click();

  await expect(page.getByRole('img', { name: '3 de 3 estrellas' })).toBeVisible();
  await expect(page.getByText('+125 XP')).toBeVisible();
});

test('build level: drag a photon between vertices', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const progress: Record<number, { stars: number; completions: number }> = {};
    for (let i = 1; i <= 11; i++) progress[i] = { stars: 3, completions: 1 };
    localStorage.setItem('feynman-quest', JSON.stringify({ version: 1, state: { onboarded: true, xp: 0, progress, concepts: [], seenConcepts: [], settings: { sound: false, haptics: false, reducedMotion: true }, metrics: {}, mastery: { sessions: 0, correct: 0, total: 0 } } }));
  });
  await page.goto('/#/level/12');
  await page.reload();
  await page.getByRole('button', { name: 'Empezar' }).click();

  // Wrong particle first: the validator explains why.
  await drag(page, 'vA', 'vB');
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await expect(page.getByText('Vértice sin fotón')).toBeVisible();

  await page.getByRole('button', { name: 'Deshacer' }).click();
  await page.getByRole('radio', { name: /Fotón/ }).click();
  await drag(page, 'vA', 'vB');
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByRole('img', { name: '2 de 3 estrellas' })).toBeVisible();
});

test('bottom nav stays put across sections and tracks the active tab', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('feynman-quest', JSON.stringify({ state: { onboarded: true }, version: 1 })));
  await page.reload();
  const nav = page.locator('.bottom-nav');
  const home = await nav.boundingBox();
  const tabs = ['Campaña', 'Colección', 'Ajustes', 'Inicio'];
  for (const [i, name] of tabs.entries()) {
    await nav.getByRole('link', { name }).click();
    await expect(nav).toHaveCount(1);
    await expect(nav.getByRole('link', { name })).toHaveAttribute('aria-current', 'page');
    expect(await nav.boundingBox()).toEqual(home);
    await expect(nav).toHaveCSS('--i', String((i + 1) % 4));
  }
  await nav.getByRole('link', { name: 'Campaña' }).click();
  await page.mouse.wheel(0, 800);
  await expect(nav).toBeInViewport();
  expect(await nav.boundingBox()).toEqual(home);
});
