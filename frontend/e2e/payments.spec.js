import { expect, test } from '@playwright/test';
import { createHmac, randomUUID } from 'node:crypto';
import { account, api, call, login } from './marketplace-fixtures';
import { testDatabaseSQL } from '../scripts/e2e-database.mjs';

test.skip(process.env.E2E_PAYMENTS_MOCK !== 'true', 'Requires the guarded mock payment profile');

async function orderFixture(request, priceMinor = 4500) {
  const seller = await account(request, 'BUSINESS');
  const buyer = await account(request);
  const business = await call(request, 'POST', '/businesses', seller.token, {
    name: 'QA Test Checkout', description: 'Collection only', phoneNumber: '+27821234567',
    email: 'checkout@example.test', category: 'Food', address: '1 Main Road', city: 'Daveyton', province: 'Gauteng',
  }, 201);
  const product = await call(request, 'POST', '/products', seller.token, {
    name: 'QA Kota', description: 'Test item', category: 'Lunch', priceMinor, available: true, active: true, stock: 1,
  }, 201);
  const details = await call(request, 'POST', '/orders', buyer.token, {
    businessId: business.id, requestKey: randomUUID(), items: [{ productId: product.id, priceMinor, quantity: 1 }],
  }, 201);
  return { seller, buyer, id: details.order.id };
}

const init = (request, actor, kind, id, status = 200) =>
  call(request, 'POST', '/payments/initialize', actor.token, { kind, id, amountMinor: 1 }, status);
const setOutcome = (request, actor, reference, outcome) =>
  call(request, 'POST', `/payments/${reference}/simulate`, actor.token, { outcome });
async function simulate(request, actor, reference, outcome) {
  await setOutcome(request, actor, reference, outcome);
  return call(request, 'POST', `/payments/${reference}/verify`, actor.token);
}

function send(request, data, age = 0, signed = data) {
  const t = Math.floor(Date.now() / 1000) - age;
  const mac = createHmac('sha512', process.env.E2E_PAYMENT_SIGNING_SECRET).update(`${t}.${signed}`).digest('hex');
  return request.post(api + '/payments/webhooks/paystack', {
    data: Buffer.from(data), headers: { 'Content-Type': 'application/json', 'Paystack-Signature': `t=${t},v1=whk_qa:${mac}` },
  });
}

async function checkout(page) {
  await page.getByRole('button', { name: /^(pay online|retry online payment)$/i }).click();
  await expect(page.getByText('Review test payment')).toBeVisible();
  await page.getByRole('button', { name: 'Start test checkout' }).click();
  await expect(page.getByText('Payment pending', { exact: true })).toBeVisible();
}

test('collection order failure, retry and verified result stay separate from fulfillment', async ({ page, request }, info) => {
  test.setTimeout(90000);
  const { buyer, seller, id } = await orderFixture(request);
  await init(request, seller, 'ORDER', id, 404);
  await login(page, buyer);
  await page.goto(`/orders/${id}`);
  await checkout(page);
  const started = await call(request, 'GET', `/payments/history?kind=ORDER&id=${id}`, buyer.token);
  await page.goto(`/payments/return?reference=${started.attempts[0].reference}&status=success`);
  await expect(page.getByText('Payment pending', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'View order' }).click();
  await page.getByRole('button', { name: 'Simulate failure' }).click();
  await expect(page.getByText('Test payment failed', { exact: true })).toBeVisible();
  await checkout(page);
  if (process.env.PAYMENT_SCREENSHOT_DIR && info.project.name === 'mobile') {
    await page.getByRole('heading', { name: 'Payment', exact: true }).evaluate((label) => label.parentElement.scrollIntoView());
    await page.getByRole('heading', { name: 'Payment', exact: true }).locator('..').screenshot({
      path: `${process.env.PAYMENT_SCREENSHOT_DIR}/mobile-pending.png`,
      style: '.skip-link:not(:focus) { visibility: hidden; }',
    });
  }
  await page.getByRole('button', { name: 'Simulate success' }).click();
  await expect(page.getByText('Test payment verified', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /pay online/i })).toHaveCount(0);
  const order = await call(request, 'GET', `/orders/${id}`, buyer.token);
  expect(order.order.status).toBe('PLACED');
  const history = await call(request, 'GET', `/payments/history?kind=ORDER&id=${id}`, buyer.token);
  expect(history.attempts.map((attempt) => attempt.status)).toEqual(['PAID', 'FAILED']);
  expect(history.attempts.every((attempt) => attempt.amountMinor === 4500)).toBe(true);
  await page.goto(`/payments/return?reference=${history.attempts[0].reference}&status=success`);
  await expect(page.getByText('Test payment verified', { exact: true })).toBeVisible();
});

test('a negotiated booking becomes payable only after the agreed price is accepted', async ({ page, request }, info) => {
  test.setTimeout(90000);
  const worker = await account(request, 'WORKER');
  const buyer = await account(request);
  await call(request, 'POST', '/workers/me', worker.token, {
    headline: 'QA Electrician', bio: 'Test services', skills: ['Wiring'],
    serviceCategories: ['Electrical'], city: 'Daveyton', province: 'Gauteng',
  }, 201);
  const service = await call(request, 'POST', '/services', worker.token, {
    name: 'Test electrical check', description: 'Safety check', category: 'Electrical',
    priceModel: 'QUOTE', durationMinutes: 60, active: true,
  }, 201);
  const time = new Date(Date.now() + 86400000).toISOString();
  const booking = await call(request, 'POST', '/bookings', buyer.token, {
    serviceId: service.id, requestKey: randomUUID(), workDescription: 'Inspect the wiring',
    serviceArea: 'Daveyton', preferredAt: time,
  }, 201);
  await init(request, buyer, 'BOOKING', booking.id, 409);
  const path = `/bookings/${booking.id}/status`;
  const proposed = await call(request, 'PATCH', path, worker.token, {
    action: 'PROPOSE', revision: booking.revision, proposedAt: time, proposedPrice: '275.50',
  });
  await init(request, buyer, 'BOOKING', booking.id, 409);
  const revised = await call(request, 'PATCH', path, worker.token, {
    action: 'PROPOSE', revision: proposed.revision, proposedAt: time, proposedPrice: '280.25',
  });
  await call(request, 'PATCH', path, buyer.token, { action: 'ACCEPT_PROPOSAL', revision: proposed.revision }, 409);
  await call(request, 'PATCH', path, buyer.token, { action: 'ACCEPT_PROPOSAL', revision: revised.revision });
  await login(page, buyer);
  await page.goto(`/bookings/${booking.id}`);
  await checkout(page);
  await page.getByRole('button', { name: 'Simulate success' }).click();
  await expect(page.getByText('Test payment verified', { exact: true })).toBeVisible();
  if (process.env.PAYMENT_SCREENSHOT_DIR && info.project.name === 'desktop') {
    await page.locator('.page-wrapper').screenshot({
      path: `${process.env.PAYMENT_SCREENSHOT_DIR}/desktop-booking-payment.png`,
      style: '.skip-link:not(:focus) { visibility: hidden; }',
    });
  }
  const history = await call(request, 'GET', `/payments/history?kind=BOOKING&id=${booking.id}`, buyer.token);
  expect(history.attempts[0].amountMinor).toBe(28025);
  expect((await call(request, 'GET', `/bookings/${booking.id}`, buyer.token)).status).toBe('ACCEPTED');
});

test('concurrent initialization and confirmation, refund review, and signed webhook replay', async ({ request }, info) => {
  test.skip(info.project.name !== 'desktop', 'API checks run once');
  const { buyer, seller, id } = await orderFixture(request);
  const [first, duplicate] = await Promise.all([init(request, buyer, 'ORDER', id), init(request, buyer, 'ORDER', id)]);
  expect(duplicate.reference).toBe(first.reference);
  expect(first.amountMinor).toBe(4500);
  await call(request, 'POST', `/payments/${first.reference}/verify`, seller.token, undefined, 404);
  const pending = await call(request, 'POST', `/payments/${first.reference}/verify`, buyer.token);
  expect(pending.status).toBe('PROCESSING');
  expect((await simulate(request, buyer, first.reference, 'ABANDONED')).status).toBe('ABANDONED');
  const retry = await init(request, buyer, 'ORDER', id);
  expect(retry.reference).not.toBe(first.reference);

  const cancel = () => call(request, 'PATCH', `/orders/${id}/status`, buyer.token, { expectedStatus: 'PLACED', status: 'CANCELLED' });
  await cancel();
  const late = await Promise.all(Array.from({ length: 2 }, () => simulate(request, buyer, retry.reference, 'SUCCESS')));
  expect(late.map((result) => result.status)).toEqual(['REFUND_REQUIRED', 'REFUND_REQUIRED']);
  expect((await call(request, 'GET', '/products/mine', seller.token)).content[0].stock).toBe(1);
  expect((await call(request, 'GET', `/orders/${id}`, buyer.token)).order.status).toBe('CANCELLED');

  const transactionId = testDatabaseSQL(`SELECT provider_transaction_id FROM payment_attempts WHERE reference = '${retry.reference}';`).trim();
  const body = `{"event":"charge.success","data":{"status":"success","domain":"test","reference":"${retry.reference}","id":${transactionId}}}`;
  expect((await send(request, body, 301)).status()).toBe(401);
  expect((await send(request, body + ' ', 0, body)).status()).toBe(401);
  expect((await send(request, body)).status()).toBe(200);
  expect((await send(request, body.replace('{"event"', '{ "event"'))).status()).toBe(200);
  const events = testDatabaseSQL(`SELECT count(*) FROM payment_events e JOIN payment_attempts p ON p.id = e.payment_id
      WHERE p.reference = '${retry.reference}' AND e.event_type = 'charge.success';`);
  expect(events.trim()).toBe('1');
  const cases = testDatabaseSQL(`SELECT state FROM payment_cases c JOIN payment_attempts p ON p.id = c.payment_id
      WHERE p.reference = '${retry.reference}' AND c.kind = 'REFUND';`);
  expect(cases.trim()).toBe('REQUIRED');
  const tooSmall = await orderFixture(request, 50);
  await init(request, tooSmall.buyer, 'ORDER', tooSmall.id, 409);
});

test('a signed webhook verifies a payment and retries after the database rolls back', async ({ request }, info) => {
  test.skip(info.project.name !== 'desktop', 'API checks run once');
  const { buyer, id } = await orderFixture(request);
  const attempt = await init(request, buyer, 'ORDER', id);
  // Verification is deliberately separate from setting the controlled provider response.
  await setOutcome(request, buyer, attempt.reference, 'PROCESSING');
  await call(request, 'POST', `/payments/${attempt.reference}/verify`, buyer.token);
  const providerId = testDatabaseSQL(`SELECT provider_transaction_id FROM payment_attempts WHERE reference = '${attempt.reference}';`).trim();
  const body = `{"event":"charge.success","data":{"status":"success","domain":"test","reference":"${attempt.reference}","id":${providerId}}}`;
  expect((await send(request, body)).status()).toBe(503);
  expect((await call(request, 'GET', `/payments/${attempt.reference}`, buyer.token)).status).toBe('PROCESSING');
  await setOutcome(request, buyer, attempt.reference, 'SUCCESS');
  const name = 'qa_fail_payment_' + randomUUID().replaceAll('-', '');
  testDatabaseSQL(`BEGIN;
    CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.type = 'PAYMENT_UPDATE' AND NEW.resource_id = '${id}' THEN RAISE EXCEPTION 'Controlled QA failure'; END IF;
      RETURN NEW;
    END $$;
    CREATE TRIGGER ${name} BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION ${name}();
    COMMIT;`);
  try {
    expect((await send(request, body)).status()).toBe(500);
    expect((await call(request, 'GET', `/payments/${attempt.reference}`, buyer.token)).status).toBe('PROCESSING');
    expect(testDatabaseSQL(`SELECT count(*) FROM payment_events WHERE event_key LIKE '%:${attempt.reference}';`).trim()).toBe('0');
  } finally {
    testDatabaseSQL(`BEGIN; DROP TRIGGER ${name} ON notifications; DROP FUNCTION ${name}(); COMMIT;`);
  }
  expect((await send(request, body)).status()).toBe(200);
  expect((await call(request, 'GET', `/payments/${attempt.reference}`, buyer.token)).status).toBe('PAID');
  await call(request, 'PATCH', `/orders/${id}/status`, buyer.token, { expectedStatus: 'PLACED', status: 'CANCELLED' });
  expect((await call(request, 'GET', `/payments/${attempt.reference}`, buyer.token)).status).toBe('REFUND_REQUIRED');
});
