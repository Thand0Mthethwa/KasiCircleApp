import { expect } from '@playwright/test';
import { testDatabaseSQL } from '../scripts/e2e-database.mjs';
import { randomUUID } from 'node:crypto';

export const api = 'http://127.0.0.1:18081/api';
export const password = 'MarketplaceQA123!';

export async function call(request, method, path, token, data, status = 200) {
  const response = await request.fetch(`${api}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data,
  });
  // Do not dump request headers or JWTs into test output.
  expect(response.status(), `${method} ${path}: unexpected HTTP status`).toBe(status);
  return response.status() === 204 || !(await response.text()) ? null : response.json();
}

export async function account(request, accountType = 'RESIDENT', admin = false) {
  const email = `qa-${randomUUID()}@example.test`;
  await call(request, 'POST', '/auth/register', null, {
    firstName: 'QA', lastName: 'Member', email, phoneNumber: '+27821234567', password, accountType,
  }, 201);
  if (admin) {
    // Generated UUID email only; restricted disposable local database is enforced by config.
    testDatabaseSQL(`UPDATE users SET role = 'ADMIN' WHERE email = '${email}';`);
  }
  const { token } = await call(request, 'POST', '/auth/login', null, { email, password });
  const user = await call(request, 'GET', '/users/me', token);
  return { email, token, user };
}

export async function login(page, user) {
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
}
