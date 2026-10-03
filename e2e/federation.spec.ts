import { test, expect } from '@playwright/test';

for (const [name, port] of [['MF host', 4200], ['Plain host', 4202]] as const) {
  test.describe(name, () => {
    test('lazy component, shared Angular, input/output and destroy/recreate', async ({ page }) => {
      const errors: string[] = [];
      const remoteRequests: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (request.url().startsWith('http://localhost:4201/')) remoteRequests.push(request.url());
      });
      await page.goto(`http://localhost:${port}`);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
      expect(remoteRequests).toHaveLength(0);
      await page.getByRole('button', { name: 'Загрузить компонент', exact: true }).click();
      await expect(page.getByTestId('shared-identity')).toContainText('Injector и Router совпадают');
      await expect(page.getByTestId('remote-count')).toHaveText('0');
      expect(remoteRequests.some(url => url.includes('remoteEntry.js'))).toBeTruthy();
      await page.getByLabel('Input из хоста').fill('Параметр из теста');
      await expect(page.getByRole('heading', { name: 'Параметр из теста' })).toBeVisible();
      await page.getByRole('button', { name: 'Увеличить счётчик' }).click();
      await expect(page.getByTestId('remote-count')).toHaveText('1');
      await expect(page.getByTestId('host-event')).toContainText('1');
      await page.getByRole('button', { name: 'Удалить компонент' }).click();
      await expect(page.locator('remote-widget')).toHaveCount(0);
      await page.getByRole('button', { name: 'Загрузить компонент', exact: true }).click();
      await expect(page.getByTestId('remote-count')).toHaveText('0');
      await page.getByRole('link', { name: 'Удалённые маршруты' }).click();
      await expect(page.getByRole('heading', { name: 'Обзор remote' })).toBeVisible();
      await page.getByRole('link', { name: 'Компонент', exact: true }).click();
      await page.getByRole('button', { name: 'Загрузить компонент', exact: true }).click();
      await expect(page.getByTestId('remote-count')).toHaveText('0');
      expect(errors).toEqual([]);
    });

    test('routes, child navigation and direct URL reload', async ({ page }) => {
      const errors: string[] = [];
      const logs: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => logs.push(message.text()));
      await page.goto(`http://localhost:${port}`);
      await page.getByRole('link', { name: 'Удалённые маршруты' }).click();
      await expect(page.getByRole('heading', { name: 'Обзор remote' })).toBeVisible();
      await page.getByRole('link', { name: 'Детали', exact: true }).click();
      await expect(page).toHaveURL(`http://localhost:${port}/remote/details`);
      await expect(page.getByRole('heading', { name: 'Детали remote' })).toBeVisible();
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Детали remote' })).toBeVisible();
      expect(logs.some(log => log.includes('Injector и Router совпадают'))).toBeTruthy();
      expect(errors).toEqual([]);
    });

    test('unavailable component gives an error and allows retry', async ({ page }) => {
      await page.route('http://localhost:4201/**', route => route.abort());
      await page.goto(`http://localhost:${port}`);
      await page.getByRole('button', { name: 'Загрузить компонент', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('Не удалось загрузить remote');
      await page.unroute('http://localhost:4201/**');
      await page.getByRole('button', { name: 'Загрузить компонент', exact: true }).click();
      await expect(page.getByTestId('remote-count')).toHaveText('0');
    });

    test('unavailable routes keep local host usable', async ({ page }) => {
      await page.route('http://localhost:4201/**', route => route.abort());
      await page.goto(`http://localhost:${port}/remote/details`);
      await expect(page.getByRole('alert')).toContainText('Не удалось загрузить удалённые маршруты');
      await page.getByRole('link', { name: 'Вернуться к локальному компоненту' }).click();
      await expect(page.getByRole('button', { name: 'Загрузить компонент', exact: true })).toBeEnabled();
    });
  });
}

test('remote runs independently', async ({ page }) => {
  await page.goto('http://localhost:4201/routes/details');
  await expect(page.getByRole('heading', { name: 'Remote · два экспорта' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Детали remote' })).toBeVisible();
  await page.getByRole('button', { name: 'Увеличить счётчик' }).click();
  await expect(page.getByTestId('remote-count')).toHaveText('1');
});
