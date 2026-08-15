import { Page, expect } from '@playwright/test';

/**
 * Logs in through the real UI form and waits for redirection to the
 * expected role dashboard. Throws (via expect) if login fails.
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string,
  expectedPathPrefix: string
) {
  await page.goto('/login');
  await page.getByPlaceholder('Masukkan email Anda').fill(email);
  await page.getByPlaceholder('Masukkan password Anda').fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL(new RegExp(expectedPathPrefix.replace(/\//g, '\\/')), {
    timeout: 15000,
  });
  await expect(page).toHaveURL(new RegExp(expectedPathPrefix.replace(/\//g, '\\/')));
}
