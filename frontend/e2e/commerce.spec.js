import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { testDatabaseSQL } from '../scripts/e2e-database.mjs';
import { account, api, call, login } from './marketplace-fixtures';

const serviceInput = {
  name: 'Electrical safety check',
  description: 'Check a household electrical installation.',
  category: 'Electrical',
  priceModel: 'FIXED',
  price: '250.00',
  durationMinutes: 60,
  active: true,
};

const profileInput = {
  headline: 'Community electrician', bio: 'Checks and repairs',
  skills: ['Wiring'], serviceCategories: ['Electrical'], city: 'Daveyton', province: 'Gauteng',
};

const future = (hours = 24) => new Date(Date.now() + hours * 3600000).toISOString();
const sastField = (value) => new Date(new Date(value).getTime() + 7200000).toISOString().slice(0, 16);
const requestInput = (serviceId, preferredAt = future()) => ({
  serviceId, preferredAt, requestKey: randomUUID(), serviceArea: 'Daveyton',
  workDescription: 'Check the installation in the kitchen.',
});
const changePath = (booking) => `/bookings/${booking.id}/status`;
const change = (request, booking, actor, action, status = 200, extra = {}) => call(
  request, 'PATCH', changePath(booking), actor.token, { revision: booking.revision, action, ...extra }, status,
);

async function workerProvider(request) {
  const worker = await account(request, 'WORKER');
  const profile = await call(request, 'POST', '/workers/me', worker.token, profileInput, 201);
  return { worker, profile };
}

test('worker publishes a service and customer requests and accepts a revised booking', async ({ page, request }, testInfo) => {
  const { worker, profile } = await workerProvider(request);
  const customer = await account(request);
  await login(page, worker);
  await page.goto('/services/manage');
  await page.getByRole('button', { name: 'Add service' }).click();
  await page.getByLabel('Service name').fill(serviceInput.name);
  await page.getByLabel('Description', { exact: true }).fill(serviceInput.description);
  await page.getByLabel('Price (ZAR)', { exact: true }).fill(serviceInput.price);
  await page.getByRole('button', { name: 'Save service' }).click();
  await expect(page.getByText('Service saved.')).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await login(page, customer);
  await page.goto(`/workers/${profile.id}`);
  await page.getByRole('link', { name: 'Book service' }).click();
  await page.getByLabel('What work do you need?').fill('Check the kitchen installation.');
  await page.getByLabel('Service area or location').fill('Daveyton');
  await page.getByLabel('Preferred date and time (South Africa)').fill(sastField(future()));
  await page.route(`${api}/bookings`, (route) => route.abort(), { times: 1 });
  await page.getByRole('button', { name: 'Send booking request' }).click();
  await expect(page.getByRole('alert')).toContainText('Connection unavailable');
  await expect(page.getByLabel('Service area or location')).toHaveValue('Daveyton');
  await page.getByRole('button', { name: 'Send booking request' }).click();
  await expect(page.getByText('Awaiting provider response')).toBeVisible();
  const bookingUrl = new URL(page.url()).pathname;
  await page.goto('/bookings');
  await page.getByRole('link', { name: 'View booking' }).click();
  await expect(page).toHaveURL(new RegExp(`${bookingUrl}$`));
  await page.evaluate(() => localStorage.clear());
  await login(page, worker);
  await page.goto('/bookings/incoming');
  await page.getByRole('link', { name: 'View booking' }).click();
  await page.getByRole('button', { name: 'Propose time or price' }).click();
  await page.getByLabel('Proposed date and time (South Africa)').fill(sastField(future(26)));
  await page.getByLabel('Total service price (ZAR)').fill('275.50');
  await page.getByRole('button', { name: 'Send proposal' }).click();
  await expect(page.getByText('Alternative proposed')).toBeVisible();
  if (process.env.COMMERCE_SCREENSHOT_DIR && testInfo.project.name === 'desktop') {
    await page.locator('.page-wrapper').screenshot({
      path: `${process.env.COMMERCE_SCREENSHOT_DIR}/desktop-provider-proposal.png`,
      style: '.skip-link:not(:focus) { visibility: hidden; }',
    });
  }
  await page.evaluate(() => localStorage.clear());
  await login(page, customer);
  await page.goto('/notifications');
  await page.getByText('Booking updated', { exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${bookingUrl}$`));
  await page.getByRole('button', { name: 'Accept proposal' }).click();
  await expect(page.getByText('Booking confirmed')).toBeVisible();
  await expect(page.getByText('Payment outside KasiCircle')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Booking confirmed')).toBeVisible();
  if (process.env.COMMERCE_SCREENSHOT_DIR && testInfo.project.name === 'mobile') {
    await page.locator('.page-wrapper').screenshot({
      path: `${process.env.COMMERCE_SCREENSHOT_DIR}/mobile-confirmed-booking.png`,
      style: '.skip-link:not(:focus) { visibility: hidden; }',
    });
  }
  await page.getByRole('button', { name: 'Cancel booking' }).click();
  await page.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect(page.getByText('Cancelled', { exact: true })).toBeVisible();
});

test('business booking enforces pricing, participant access, idempotency and concurrent slot confirmation', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'API integration does not depend on viewport');
  const businessOwner = await account(request, 'BUSINESS');
  const customer = await account(request);
  const secondCustomer = await account(request);
  const admin = await account(request, 'RESIDENT', true);
  const business = await call(request, 'POST', '/businesses', businessOwner.token, {
    name: 'QA Electrical', description: 'Community electrical services', phoneNumber: '+27821234567',
    email: 'commerce@example.test', category: 'Services', address: '1 Main Road', city: 'Daveyton', province: 'Gauteng',
  }, 201);
  const input = { ...serviceInput, category: business.category };
  await call(request, 'POST', '/services', customer.token, { ...input, providerId: business.id }, 403);
  await call(request, 'POST', '/services', businessOwner.token, { ...input, price: '30.001' }, 400);
  await call(request, 'POST', '/services', businessOwner.token, { ...input, price: '-0.01' }, 400);
  const service = await call(request, 'POST', '/services', businessOwner.token, input, 201);
  expect((await call(request, 'GET', `/services?providerType=BUSINESS&providerId=${business.id}`)).content)
    .toEqual([expect.objectContaining({ id: service.id })]);
  await call(request, 'PUT', `/services/${service.id}`, customer.token, input, 403);
  await call(request, 'POST', '/bookings', businessOwner.token, requestInput(service.id), 403);
  await call(request, 'POST', '/bookings', customer.token, requestInput(service.id, future(-1)), 400);
  await call(request, 'GET', '/bookings/provider', customer.token, undefined, 403);
  const first = requestInput(service.id);
  const submit = () => call(request, 'POST', '/bookings', customer.token, first, 201);
  const [booking, repeat] = await Promise.all([submit(), submit()]);
  expect(repeat.id).toBe(booking.id);
  await call(request, 'POST', '/bookings', customer.token, { ...first, serviceArea: 'Changed area' }, 409);
  await call(request, 'POST', '/bookings', customer.token, { ...first, requestKey: randomUUID() }, 409);
  const competing = await call(request, 'POST', '/bookings', secondCustomer.token, requestInput(service.id, first.preferredAt), 201);
  const history = await call(request, 'GET', '/notifications', businessOwner.token);
  expect(history.content.filter((event) => event.resourceId === booking.id)).toHaveLength(1);
  await call(request, 'GET', `/bookings/${booking.id}`, null, undefined, 401);
  await call(request, 'GET', `/bookings/${booking.id}`, secondCustomer.token, undefined, 404);
  expect((await call(request, 'GET', `/bookings/${booking.id}`, admin.token)).viewer).toBe('ADMIN');
  await change(request, booking, admin, 'ACCEPT', 404);
  await change(request, booking, secondCustomer, 'CANCEL', 404);
  await change(request, booking, customer, 'ACCEPT', 409);
  await call(request, 'PUT', `/services/${service.id}`, businessOwner.token, { ...input, price: '399.00' });
  const results = await Promise.all([booking, competing].map((item) => request.patch(api + changePath(item), {
    headers: { Authorization: `Bearer ${businessOwner.token}` },
    data: { revision: item.revision, action: 'ACCEPT' },
  })));
  expect(results.map((result) => result.status()).sort()).toEqual([200, 409]);
  const accepted = await results.find((result) => result.ok()).json();
  expect(accepted.agreedPrice).toBe(250);
  const declined = [booking, competing].find((item) => item.id !== accepted.id);
  const stillOpen = await call(request, 'GET', `/bookings/${declined.id}`, businessOwner.token);
  expect(stillOpen.status).toBe('REQUESTED');
  expect(stillOpen.revision).toBe(declined.revision);
  await change(request, stillOpen, businessOwner, 'DECLINE');
  await change(request, accepted, businessOwner, 'START', 409);
  await change(request, accepted, businessOwner, 'COMPLETE', 409);
  // Advance only this test's accepted slot, without waiting for tomorrow.
  testDatabaseSQL(`UPDATE service_bookings SET scheduled_at = now() - interval '1 minute',
      ends_at = now() + interval '59 minutes' WHERE id = '${accepted.id}';`);
  const started = await change(request, accepted, businessOwner, 'START');
  expect(started.status).toBe('IN_PROGRESS');
  await change(request, started, businessOwner, 'CANCEL', 409);
  const completed = await change(request, started, businessOwner, 'COMPLETE');
  expect(completed.status).toBe('COMPLETED');
  expect(completed.paymentStatus).toBe('OUTSIDE_PLATFORM');
  const quoteService = await call(request, 'POST', '/services', businessOwner.token,
    { ...input, priceModel: 'QUOTE', price: null }, 201);
  const quoteBooking = await call(request, 'POST', '/bookings', customer.token, requestInput(quoteService.id), 201);
  await change(request, quoteBooking, businessOwner, 'ACCEPT', 409);
  const proposal = await change(request, quoteBooking, businessOwner, 'PROPOSE', 200,
    { proposedAt: future(28), proposedPrice: '100.50' });
  const revised = await change(request, proposal, businessOwner, 'PROPOSE', 200,
    { proposedAt: future(29), proposedPrice: '130.00' });
  await change(request, proposal, customer, 'ACCEPT_PROPOSAL', 409);
  testDatabaseSQL(`UPDATE service_bookings SET proposed_at = now() - interval '1 minute' WHERE id = '${revised.id}';`);
  expect((await call(request, 'GET', `/bookings/${revised.id}`, customer.token)).status).toBe('EXPIRED');
  await change(request, revised, customer, 'ACCEPT_PROPOSAL', 409);

  await call(request, 'DELETE', `/services/${service.id}`, businessOwner.token, undefined, 204);
  await call(request, 'GET', `/services/${service.id}`, null, undefined, 404);
  await call(request, 'POST', '/bookings', customer.token, requestInput(service.id), 404);
  expect((await call(request, 'GET', `/bookings/${accepted.id}`, businessOwner.token)).status).toBe('COMPLETED');
});
