import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const api = 'http://127.0.0.1:18081/api';
const password = 'MarketplaceQA123!';

async function call(request, method, path, token, data, status = 200) {
  const response = await request.fetch(`${api}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data,
  });
  // Do not dump request headers or JWTs into test output.
  expect(response.status(), `${method} ${path}: ${await response.text()}`).toBe(status);
  return response.status() === 204 || !(await response.text()) ? null : response.json();
}

async function account(request, accountType = 'RESIDENT', admin = false) {
  const email = `qa-${randomUUID()}@example.test`;
  await call(request, 'POST', '/auth/register', null, {
    firstName: 'QA', lastName: 'Member', email, phoneNumber: '+27821234567', password, accountType,
  }, 201);
  if (admin) {
    // Generated UUID email only; restricted disposable local database is enforced by config.
    execFileSync('psql', [process.env.E2E_DATABASE_URL, '-v', 'ON_ERROR_STOP=1', '-c',
      `UPDATE users SET role = 'ADMIN' WHERE email = '${email}';`], { stdio: 'pipe' });
  }
  const { token } = await call(request, 'POST', '/auth/login', null, { email, password });
  const user = await call(request, 'GET', '/users/me', token);
  return { email, token, user };
}

async function login(page, user) {
  await page.goto('/login');
  await page.getByLabel('Email or Phone Number').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
}

const jobData = (title) => ({ title, description: 'Repair community water pipes.', category: 'Plumbing', employmentType: 'CONTRACT', city: 'Soweto', province: 'Gauteng' });

test('customer review persists, updates ratings and rejects duplicate/self/invalid reviews', async ({ page, request }) => {
  const owner = await account(request, 'BUSINESS');
  const customer = await account(request);
  const business = await call(request, 'POST', '/businesses', owner.token, {
    name: `QA Shop ${randomUUID()}`, description: 'Community shop', phoneNumber: '+27821234567',
    email: 'shop@example.test', category: 'Retail', address: '1 Main Road', city: 'Soweto', province: 'Gauteng',
  }, 201);
  const path = `/businesses/${business.id}/reviews`;
  await call(request, 'POST', path, null, { rating: 5, comment: 'Great' }, 401);
  await call(request, 'POST', path, owner.token, { rating: 5 }, 403);
  await call(request, 'POST', path, customer.token, { rating: 6 }, 400);
  await login(page, customer);
  await page.goto(`/businesses/${business.id}`);
  await page.getByRole('button', { name: /write.*review/i }).click();
  await page.getByRole('button', { name: '5 stars', exact: true }).click();
  await page.locator('#review-comment').fill('Helpful community service.');
  await page.getByRole('button', { name: /submit review/i }).click();
  await expect(page.getByTestId('average-rating-value')).toHaveText('5.0/5');
  const review = await call(request, 'GET', `${path}/me`, customer.token);
  await call(request, 'POST', path, customer.token, { rating: 4 }, 409);
  await call(request, 'PUT', `${path}/${review.id}`, owner.token, { rating: 1 }, 403);
  await call(request, 'PUT', `${path}/${review.id}`, customer.token, { rating: 4, comment: 'Updated' });
  const detail = await call(request, 'GET', `/businesses/${business.id}`);
  expect(detail.averageRating).toBe(4);
  expect(detail.reviewCount).toBe(1);
  await call(request, 'DELETE', `${path}/${review.id}`, customer.token, undefined, 204);
  expect((await call(request, 'GET', `${path}/summary`)).totalReviews).toBe(0);
});

test('worker creates and edits own skills, is discoverable, and can securely exchange messages', async ({ page, request }) => {
  const worker = await account(request, 'WORKER');
  const customer = await account(request);
  const outsider = await account(request);
  const headline = `QA plumber ${randomUUID()}`;
  await call(request, 'POST', '/workers/me', customer.token, {
    headline, bio: 'Repairs', skills: ['Pipes'], serviceCategories: ['Plumbing'], city: 'Soweto', province: 'Gauteng',
  }, 403);
  await login(page, worker);
  await page.goto('/worker-profile');
  await page.getByLabel('Professional headline').fill(headline);
  await page.getByLabel('About your work').fill('Reliable community plumbing repairs.');
  await page.getByLabel(/skills/i).fill('Pipes, Repairs');
  await page.getByLabel(/service categories/i).fill('Plumbing');
  await page.getByLabel(/township or city/i).fill('Soweto');
  await page.getByLabel('Province').fill('Gauteng');
  await page.getByRole('button', { name: 'Create worker profile' }).click();
  await expect(page.getByText(/profile.*saved/i)).toBeVisible();
  const profile = await call(request, 'GET', '/workers/me', worker.token);
  await call(request, 'PUT', '/workers/me', worker.token, {
    headline, bio: 'Updated plumbing services', skills: ['Pipes'], serviceCategories: ['Plumbing'], city: 'Soweto', province: 'Gauteng',
  });
  const results = await call(request, 'GET', `/workers?search=${encodeURIComponent(headline)}&skill=Pipes&category=Plumbing&city=Soweto`);
  expect(results.content.map((item) => item.id)).toContain(profile.id);
  expect(results.content[0]).not.toHaveProperty('email');
  expect(results.content[0]).not.toHaveProperty('phoneNumber');
  await page.goto(`/workers/${profile.id}`);
  await expect(page.getByText('Updated plumbing services')).toBeVisible();
  const conversation = await call(request, 'POST', '/conversations', customer.token, { participantId: worker.user.id }, 201);
  const reverse = await call(request, 'POST', '/conversations', worker.token, { participantId: customer.user.id }, 201);
  expect(reverse.id).toBe(conversation.id);
  const history = `/conversations/${conversation.id}/messages`;
  await call(request, 'POST', history, customer.token, { content: 'Can you repair pipes?' }, 201);
  await call(request, 'GET', history, outsider.token, undefined, 403);
  await call(request, 'POST', history, outsider.token, { content: 'Intrusion' }, 403);
  await page.goto(`/messages?conversation=${conversation.id}`);
  await expect(page.getByText('Can you repair pipes?')).toBeVisible();
  await page.getByLabel('Write a message').fill('Yes, I can help.');
  await page.getByRole('button', { name: /send/i }).click();
  await expect(page.getByText('Yes, I can help.')).toBeVisible();
  const messages = await call(request, 'GET', history, customer.token);
  expect(messages.content.map((item) => item.content)).toContain('Yes, I can help.');
  await page.reload();
  await expect(page.getByText('Yes, I can help.')).toBeVisible();
});

test('employer posts/edits job, applicant applies privately, employer decides, and notification opens', async ({ page, request }) => {
  const employer = await account(request);
  const applicant = await account(request, 'WORKER');
  const outsider = await account(request);
  const title = `QA Job ${randomUUID()}`;
  await login(page, employer);
  await page.goto('/jobs/new');
  await page.getByLabel('Job title').fill(title);
  await page.getByLabel('Description', { exact: true }).fill('Repair community water pipes.');
  await page.getByLabel('Service category').fill('Plumbing');
  await page.getByLabel('Township or city').fill('Soweto');
  await page.getByLabel('Province').fill('Gauteng');
  await page.getByRole('button', { name: 'Publish job' }).click();
  await expect(page).toHaveURL(/\/jobs\/[a-f0-9-]+$/);
  const id = page.url().split('/').pop();
  const path = `/jobs/${id}`;
  await call(request, 'PUT', path, outsider.token, jobData('Hijacked'), 403);
  await call(request, 'PUT', path, employer.token, jobData(title));
  await call(request, 'POST', `${path}/applications`, employer.token, {}, 403);
  await page.evaluate(() => localStorage.clear());
  await login(page, applicant);
  await page.goto(`/jobs?search=${encodeURIComponent(title)}`);
  await page.getByRole('button', { name: title, exact: true }).click();
  await page.getByLabel('Application message').fill('I can help with these repairs.');
  await page.getByRole('button', { name: /apply/i }).click();
  await expect(page.getByText(/application has been submitted/i)).toBeVisible();
  const application = (await call(request, 'GET', '/jobs/me/applications', applicant.token)).content.find((item) => item.jobId === id);
  expect(application).toBeTruthy();
  await call(request, 'POST', `${path}/applications`, applicant.token, {}, 409);
  await call(request, 'GET', `${path}/applications`, outsider.token, undefined, 403);
  await call(request, 'GET', `${path}/applications`, applicant.token, undefined, 403);
  await call(request, 'GET', `${path}/applications`, null, undefined, 401);
  await call(request, 'PATCH', `${path}/applications/${application.id}`, outsider.token, { status: 'ACCEPTED' }, 403);
  await page.evaluate(() => localStorage.clear());
  await login(page, employer);
  await page.goto(`/jobs/${id}`);
  await page.getByRole('button', { name: /view applications/i }).click();
  await page.getByRole('button', { name: 'Accept', exact: true }).click();
  await expect(page.getByText('Status: ACCEPTED', { exact: true })).toBeVisible();
  const notifications = (await call(request, 'GET', '/notifications', applicant.token)).content;
  const notice = notifications.find((item) => item.type === 'APPLICATION_STATUS' && item.resourceId === id);
  expect(notice).toBeTruthy();
  await call(request, 'PATCH', `/notifications/${notice.id}/read`, outsider.token, undefined, 404);
  await page.evaluate(() => localStorage.clear());
  await login(page, applicant);
  await page.goto('/notifications');
  await page.getByRole('button', { name: 'Unread notification: Application update' }).click();
  await expect(page).toHaveURL(new RegExp(`/jobs/${id}$`));
  expect((await call(request, 'GET', '/notifications/unread-count', applicant.token)).count).toBe(0);
  await call(request, 'PATCH', `${path}/status`, employer.token, { status: 'CLOSED' });
  await call(request, 'POST', `${path}/applications`, outsider.token, {}, 409);
  await call(request, 'PUT', path, employer.token, jobData(title), 409);
});

test('regular user reports content, cannot moderate, administrator resolves from UI', async ({ page, request }) => {
  const employer = await account(request);
  const reporter = await account(request);
  const admin = await account(request, 'RESIDENT', true);
  const job = await call(request, 'POST', '/jobs', employer.token, jobData(`Reported ${randomUUID()}`), 201);
  const reportData = { targetType: 'JOB', targetId: job.id, reason: 'SPAM', details: `QA report ${job.id}` };
  await call(request, 'POST', '/reports', null, reportData, 401);
  const report = await call(request, 'POST', '/reports', reporter.token, reportData, 201);
  expect(report).not.toHaveProperty('reporterId');
  await call(request, 'POST', '/reports', reporter.token, reportData, 409);
  await call(request, 'GET', '/reports', reporter.token, undefined, 403);
  await call(request, 'PATCH', `/reports/${report.id}/moderation`, reporter.token, { status: 'DISMISSED' }, 403);
  await login(page, reporter);
  await page.goto('/admin/reports');
  await expect(page).toHaveURL(/\/home$/);
  await page.evaluate(() => localStorage.clear());
  await login(page, admin);
  await page.goto('/admin/reports');
  const card = page.getByText(reportData.details, { exact: true }).locator('..');
  await card.getByLabel('Moderation note (optional)').fill('Reviewed test report.');
  await card.getByRole('button', { name: 'Dismiss', exact: true }).click();
  await expect(page.getByText('Report dismissed.', { exact: true })).toBeVisible();
  await expect(page.getByText(reportData.details, { exact: true })).toHaveCount(0);
  await call(request, 'PATCH', `/reports/${report.id}/moderation`, admin.token, { status: 'ACTIONED' }, 409);
});
