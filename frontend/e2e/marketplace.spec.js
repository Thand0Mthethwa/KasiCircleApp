import { test, expect } from '@playwright/test';
import { testDatabaseSQL } from '../scripts/e2e-database.mjs';
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
  expect(response.status(), `${method} ${path}: unexpected HTTP status`).toBe(status);
  return response.status() === 204 || !(await response.text()) ? null : response.json();
}

async function account(request, accountType = 'RESIDENT', admin = false) {
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

async function login(page, user) {
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill(user.email);
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

test('registration validates fields, logs in a resident, and protects account routes after logout', async ({ page, request }) => {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/welcome$/);
  await page.goto('/register');
  await page.getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(page.getByLabel('Full Name')).toHaveAttribute('aria-invalid', 'true');
  const email = `qa-ui-${randomUUID()}@example.test`;
  await page.getByLabel('Full Name').fill('QA Resident');
  await page.getByLabel('Phone Number').fill('0821234567');
  await page.getByLabel('Email Address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm Password').fill(password);
  await page.locator('#terms').check();
  await page.getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  const token = await page.evaluate(() => localStorage.getItem('kasicircle_token'));
  const registered = await call(request, 'GET', '/users/me', token);
  expect(registered.email).toBe(email);
  expect(registered.accountType).toBe('RESIDENT');
  await page.getByLabel('Account menu').click();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/welcome$/);
  await page.goto('/messages');
  await expect(page).toHaveURL(/\/welcome$/);
  await page.goto('/login');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('WrongFixturePassword123!');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('business owner creates and edits a listing; real API filters and database-backed images render', async ({ page, request }, testInfo) => {
  const owner = await account(request, 'BUSINESS');
  await login(page, owner);
  await page.goto('/business-profile');
  const name = `QA Acceptance ${randomUUID()}`;
  await page.getByLabel(/Business Name/).fill(name);
  await page.locator('#business-category').selectOption('Retail');
  await page.locator('#business-description').fill('Controlled isolated database acceptance fixture.');
  await page.getByLabel(/Phone Number/).fill('+27821234567');
  await page.getByLabel(/Business Email/).fill('fixture@example.test');
  await page.getByLabel(/Physical Address/).fill('1 QA Test Road');
  await page.getByLabel(/Township \/ City/).fill('Soweto');
  await page.locator('#business-province').selectOption('Gauteng');
  await page.getByRole('button', { name: 'Create Business Profile', exact: true }).click();
  await expect(page.getByTestId('existing-business-view')).toBeVisible();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit Business Profile', exact: true }).click();
  await page.locator('#business-description').fill('Edited through the redesigned owner form.');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page.getByText('Business profile updated successfully!', { exact: true })).toBeVisible();
  const listing = (await call(request, 'GET', `/businesses?search=${encodeURIComponent(name)}&category=Retail&city=Soweto`)).content[0];
  expect(listing.description).toBe('Edited through the redesigned owner form.');
  // Only the identity-verified isolated DB is seeded. No Cloudinary account is mutated.
  // API responses are real; the local image is an explicitly controlled test fixture.
  const imageId = randomUUID();
  testDatabaseSQL(`INSERT INTO business_images (id,business_id,image_url,storage_id,file_name,content_type,file_size,is_cover,sort_order,created_at) VALUES ('${imageId}','${listing.id}','http://127.0.0.1:5176/images/kota.webp','qa-only-${imageId}','QA image fixture.webp','image/webp',1000,true,0,now());`);
  expect((await call(request, 'GET', `/businesses/${listing.id}/images`))[0].id).toBe(imageId);
  await page.goto('/explore');
  await page.getByRole('searchbox', { name: 'Search businesses by name' }).fill(name);
  await page.getByRole('textbox', { name: 'Filter by township or city' }).fill('Soweto');
  await page.getByRole('button', { name: 'Retail', exact: true }).click();
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const card = page.getByTestId(`business-card-${listing.id}`);
  await expect(card).toBeVisible();
  const photo = card.getByRole('img');
  await expect(photo).toBeVisible();
  expect(await photo.evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('real-explore.png'), fullPage: true });
  await card.getByRole('link', { name: `View details for ${name}` }).click();
  await expect(page.getByTestId('business-image-gallery')).toBeVisible();
  const cover = page.getByRole('button', { name: 'View business cover photo' });
  await cover.click();
  await expect(page.getByRole('dialog', { name: 'Photo lightbox view' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('real-business-detail.png'), fullPage: true });
});

test('live directory navigation and responsive layouts work with persisted fixtures', async ({ page, request }, testInfo) => {
  const owner = await account(request, 'BUSINESS');
  const business = await call(request, 'POST', '/businesses', owner.token, {
    name: `QA Visual ${randomUUID()}`, description: 'Isolated real backend visual acceptance fixture.',
    phoneNumber: '+27821234567', email: 'visual@example.test', category: 'Retail',
    address: '1 QA Road', city: 'Soweto', province: 'Gauteng',
  }, 201);
  const imageId = randomUUID();
  testDatabaseSQL(`INSERT INTO business_images (id,business_id,image_url,storage_id,file_name,content_type,file_size,is_cover,sort_order,created_at) VALUES ('${imageId}','${business.id}','http://127.0.0.1:5176/images/kota.webp','qa-only-${imageId}','QA visual fixture.webp','image/webp',1000,true,0,now());`);
  const sizes = testInfo.project.name === 'desktop'
    ? [[1440, 900], [768, 1024]] : [[375, 812]];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.goto(`/explore?search=${encodeURIComponent(business.name)}`);
    await expect(page.getByTestId(`business-card-${business.id}`)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => page.locator('img:visible').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
    const layout = await page.evaluate(() => ({
      viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      squares: [...document.querySelectorAll('.app-header .brand-mark i')].map((square) => {
        const box = square.getBoundingClientRect();return { width: box.width, height: box.height };
      }),
      headingFont: getComputedStyle(document.querySelector('h1')).fontFamily,
      background: getComputedStyle(document.body).backgroundColor,
      hero: (() => { const b = document.querySelector('.hero').getBoundingClientRect(); return {x:b.x,y:b.y,width:b.width,height:b.height}; })(),
      search: (() => { const b = document.querySelector('.search-panel').getBoundingClientRect(); return {x:b.x,y:b.y,width:b.width,height:b.height}; })(),
    }));
    expect(layout.scrollWidth).toBe(layout.viewport);
    expect(layout.squares).toHaveLength(4);
    for (const square of layout.squares) { expect(square.width).toBeGreaterThan(10); expect(square.height).toBeGreaterThan(10); }
    await testInfo.attach(`layout-${width}`, { body: Buffer.from(JSON.stringify(layout, null, 2)), contentType: 'application/json' });
    await page.screenshot({ path: testInfo.outputPath(`real-explore-${width}.png`), fullPage: true });
  }
  const worker = await account(request, 'WORKER');
  const headline = `QA Discovery ${randomUUID()}`;
  const profile = await call(request, 'POST', '/workers/me', worker.token, { headline, bio: 'Controlled live discovery fixture.',
    skills: ['Pipes'], serviceCategories: ['Plumbing'], city: 'Soweto', province: 'Gauteng' }, 201);
  // A full one-row page forces the PostgreSQL count query as well as the content query.
  for (let mask = 0; mask < 16; mask++) {
    const params = new URLSearchParams({ size: '1' });
    for (const [index, [key, value]] of [['search', headline], ['category', 'Plumbing'], ['skill', 'Pipes'], ['city', 'Soweto']].entries()) {
      if (mask & (1 << index)) params.set(key, value);
    }
    const matches = await call(request, 'GET', `/workers?${params}`);
    expect(matches.totalElements).toBeGreaterThan(0);
    expect(matches.content.map((item) => item.id)).toContain(profile.id);
  }
  async function navigateMarketplace(label) {
    if (page.viewportSize().width < 1024) {
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await page.getByRole('navigation', { name: 'Mobile marketplace' }).getByRole('link', { name: label, exact: true }).click();
    } else {
      await page.getByRole('navigation', { name: 'Marketplace' }).getByRole('link', { name: label, exact: true }).click();
    }
  }
  await navigateMarketplace('Workers');
  await page.getByLabel('Name or keyword').fill(headline);
  await page.getByLabel('Filter by skill').fill('Pipes');
  await page.getByLabel('Filter workers by city').fill('Soweto');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('button', { name: `View QA Member, ${headline}` })).toBeVisible();
  const job = await call(request, 'POST', '/jobs', owner.token, jobData(`QA Discovery Job ${randomUUID()}`), 201);
  await navigateMarketplace('Jobs');
  await page.getByRole('textbox', { name: 'Search jobs', exact: true }).fill(job.title);
  await page.getByRole('textbox', { name: 'Filter jobs by city' }).fill('Soweto');
  await page.getByRole('button', { name: 'Search jobs', exact: true }).click();
  await page.getByRole('button', { name: job.title, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/jobs/${job.id}$`));
});
