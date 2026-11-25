import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { testDatabaseSQL } from '../scripts/e2e-database.mjs';
import { account, api, call, login, password } from './marketplace-fixtures';

const productInput = {
  name: 'Classic kota',
  description: 'A toasted kota with chips and atchar.',
  category: 'Lunch',
  priceMinor: 3750,
  active: true,
  available: true,
  stock: 5,
};

async function business(request, name) {
  const owner = await account(request, 'BUSINESS');
  const listing = await call(request, 'POST', '/businesses', owner.token, {
    name, description: 'Fresh lunch for the neighbourhood.', phoneNumber: '+27821234567',
    email: 'shop@example.test', category: 'Food', address: '1 Main Road', city: 'Daveyton', province: 'Gauteng',
  }, 201);
  return { owner, listing };
}

const line = (product, quantity = 1) => ({ productId: product.id, quantity, priceMinor: product.priceMinor });
const placeInput = (listing, items) => ({ businessId: listing.id, items, requestKey: randomUUID(), notes: 'Collection after lunch.' });

function change(request, actor, details, status, expected = 200) {
  return call(request, 'PATCH', `/orders/${details.order.id}/status`, actor.token,
    { expectedStatus: details.order.status, status }, expected);
}

async function capture(page, filename) {
  if (process.env.PRODUCT_SCREENSHOT_DIR) {
    await page.locator('.page-wrapper').screenshot({
      path: `${process.env.PRODUCT_SCREENSHOT_DIR}/${filename}`,
      style: '.skip-link:not(:focus) { visibility: hidden; }',
    });
  }
}

test('seller publishes a product and guest checkout survives login, price review and order tracking', async ({ page, request }, info) => {
  const { owner, listing } = await business(request, 'Daveyton Kota Kitchen');
  const customer = await account(request);
  await login(page, owner);
  await page.goto('/products/manage');
  await page.getByRole('button', { name: 'Add product' }).click();
  await page.getByLabel('Product name').fill(productInput.name);
  await page.getByLabel('Description', { exact: true }).fill(productInput.description);
  await page.getByLabel('Product category').fill(productInput.category);
  await page.getByLabel('Price (ZAR)', { exact: true }).fill('37,50');
  await page.getByLabel('Available stock (optional)').fill('5');
  await page.getByRole('button', { name: 'Save product' }).click();
  await expect(page.getByText('Product saved.')).toBeVisible();
  const [product] = (await call(request, 'GET', '/products/mine', owner.token)).content;
  await page.evaluate(() => localStorage.clear());
  await page.goto(`/businesses/${listing.id}`);
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('link', { name: 'View cart (1)' }).click();
  await page.getByLabel('Quantity for Classic kota').selectOption('2');
  await page.getByRole('link', { name: 'Sign in to review order' }).click();
  await page.getByLabel('Email address', { exact: true }).fill(customer.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByLabel('Quantity for Classic kota')).toHaveValue('2');

  await page.getByRole('button', { name: 'Review collection order' }).click();
  await expect(page.getByRole('heading', { name: 'Confirm collection order' })).toBeVisible();
  const checked = page.getByLabel('I have reviewed my items, total and collection address.');
  await expect(page.getByRole('button', { name: 'Place order' })).toBeDisabled();
  await checked.check();
  await call(request, 'PUT', `/products/${product.id}`, owner.token,
    { ...productInput, revision: product.revision, priceMinor: 4000 });
  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page.getByRole('heading', { name: 'Review changes to your cart' })).toBeVisible();
  await expect(page.getByText(/Classic kota now costs/)).toBeVisible();
  await page.getByRole('button', { name: 'Update prices in cart' }).click();
  await page.getByRole('button', { name: 'Review collection order' }).click();
  await expect(checked).not.toBeChecked();
  await checked.check();
  if (info.project.name === 'mobile') await capture(page, 'mobile-cart-review.png');

  // Send the order to PostgreSQL and simulate losing only the browser response.
  await page.route(`${api}/orders`, async (route) => {
    const reply = await route.fetch();
    expect(reply.status()).toBe(201);
    await route.abort();
  }, { times: 1 });
  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page.getByRole('button', { name: 'Retry same order' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry same order' }).click();
  await expect(page.getByRole('heading', { name: 'Order details' })).toBeVisible();
  const path = new URL(page.url()).pathname;
  await expect(page.getByText('Order reference')).toBeVisible();
  const orders = await call(request, 'GET', '/orders/my', customer.token);
  expect(orders.content).toHaveLength(1);
  expect(orders.content[0].totalMinor).toBe(8000);
  await page.goto('/cart');
  await expect(page.getByText('Your cart is empty.')).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await login(page, owner);
  await page.goto('/notifications');
  await page.getByText('New collection order', { exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  for (const [action, status] of [
    ['Accept order', 'Order accepted'],
    ['Start preparing', 'Preparing'],
    ['Mark ready for collection', 'Ready for collection'],
    ['Mark collected', 'Collected'],
  ]) {
    await page.getByRole('button', { name: action, exact: true }).click();
    await page.getByRole('button', { name: 'Confirm change' }).click();
    await expect(page.getByText(status, { exact: true })).toBeVisible();
    if (status === 'Ready for collection' && info.project.name === 'desktop') await capture(page, 'desktop-ready-order.png');
  }
  await page.evaluate(() => localStorage.clear());
  await login(page, customer);
  await page.goto('/orders');
  await page.getByRole('link', { name: 'View order' }).click();
  await expect(page.getByText('Collected', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Order history' })).toBeVisible();
});

test('stock and order history stay consistent across concurrent requests and cancellation', async ({ request }, info) => {
  test.skip(info.project.name !== 'desktop', 'API integration does not depend on viewport');
  const { owner, listing } = await business(request, 'QA Stock Shop');
  const other = await business(request, 'QA Other Shop');
  const customer = await account(request);
  const second = await account(request, 'WORKER');
  const admin = await account(request, 'RESIDENT', true);
  await call(request, 'POST', '/products', customer.token, productInput, 403);
  await call(request, 'POST', '/products', owner.token, { ...productInput, priceMinor: 1000.5 }, 400);
  await call(request, 'POST', '/products', owner.token, { ...productInput, priceMinor: 0 }, 400);
  await call(request, 'POST', '/products', owner.token, { ...productInput, imageId: randomUUID() }, 400);
  const imageId = randomUUID();
  testDatabaseSQL(`INSERT INTO business_images (id,business_id,image_url,storage_id,file_name,content_type,file_size,is_cover,sort_order,created_at)
      VALUES ('${imageId}','${listing.id}','http://127.0.0.1:5176/images/kota.webp','qa-only-${imageId}',
          'QA product fixture.webp','image/webp',1000,false,0,now());`);
  const input = { ...productInput, stock: 1, imageId };
  const product = await call(request, 'POST', '/products', owner.token, input, 201);
  const otherProduct = await call(request, 'POST', '/products', other.owner.token, { ...input, stock: null, imageId: null }, 201);
  await call(request, 'PUT', `/products/${product.id}`, other.owner.token, { ...input, revision: product.revision }, 404);
  await call(request, 'POST', '/orders', owner.token, placeInput(listing, [line(product)]), 403);
  await call(request, 'POST', '/orders', customer.token, placeInput(listing, [line(product, 1.5)]), 400);
  await call(request, 'POST', '/orders', customer.token, placeInput(listing, [line(product), line(product)]), 400);
  await call(request, 'POST', '/orders', customer.token, placeInput(listing, [line(product), line(otherProduct)]), 409);
  const publicCatalog = await call(request, 'GET', `/businesses/${listing.id}/products`);
  expect(publicCatalog.content[0]).not.toHaveProperty('stock');
  expect(publicCatalog.content[0].imageUrl).toContain('/images/kota.webp');
  const manual = await call(request, 'POST', '/orders', customer.token,
    placeInput(other.listing, [line(otherProduct, 20)]), 201);
  expect(manual.order.totalMinor).toBe(75000);
  await change(request, customer, manual, 'CANCELLED');
  expect((await call(request, 'GET', '/products/mine', other.owner.token)).content[0].stock).toBeNull();

  const first = placeInput(listing, [line(product)]);
  const secondInput = placeInput(listing, [line(product)]);
  const candidates = [[customer, first], [second, secondInput]];
  const results = await Promise.all(candidates.map(([actor, data]) => request.post(api + '/orders', {
    headers: { Authorization: `Bearer ${actor.token}` }, data,
  })));
  expect(results.map((result) => result.status()).sort()).toEqual([201, 409]);
  const index = results.findIndex((result) => result.ok());
  const details = await results[index].json();
  const [buyer, winning] = candidates[index];
  const [outsider] = candidates[1 - index];
  const path = `/orders/${details.order.id}`;
  expect((await call(request, 'POST', '/orders', buyer.token, winning, 201)).order.id).toBe(details.order.id);
  await call(request, 'POST', '/orders', buyer.token, { ...winning, notes: 'Changed notes' }, 409);
  await call(request, 'GET', path, outsider.token, undefined, 404);
  await call(request, 'GET', path, other.owner.token, undefined, 404);
  await call(request, 'GET', path, null, undefined, 401);
  expect((await call(request, 'GET', path, admin.token)).actions).toEqual([]);
  await change(request, other.owner, details, 'ACCEPTED', 404);
  await change(request, buyer, details, 'ACCEPTED', 409);
  const [reserved] = (await call(request, 'GET', '/products/mine', owner.token)).content;
  expect(reserved.stock).toBe(0);
  await call(request, 'PUT', `/products/${product.id}`, owner.token,
    { ...input, revision: product.revision }, 409);
  await call(request, 'PUT', `/products/${product.id}`, owner.token,
    { ...input, stock: null, revision: reserved.revision }, 409);
  const rejected = await change(request, owner, details, 'REJECTED');
  expect(rejected.history.map((event) => event.status)).toEqual(['PLACED', 'REJECTED']);
  await change(request, owner, details, 'REJECTED', 409);
  const [released] = (await call(request, 'GET', '/products/mine', owner.token)).content;
  expect(released.stock).toBe(1);
  const cancelledOrder = await call(request, 'POST', '/orders', buyer.token, placeInput(listing, [line(product)]), 201);
  const cancellations = await Promise.all([1, 2].map(() => request.patch(api + `/orders/${cancelledOrder.order.id}/status`, {
    headers: { Authorization: `Bearer ${buyer.token}` },
    data: { expectedStatus: 'PLACED', status: 'CANCELLED' },
  })));
  expect(cancellations.map((result) => result.status()).sort()).toEqual([200, 409]);
  const cancelled = await cancellations.find((result) => result.ok()).json();
  expect(cancelled.history.map((event) => event.status)).toEqual(['PLACED', 'CANCELLED']);
  const [afterCancellation] = (await call(request, 'GET', '/products/mine', owner.token)).content;
  expect(afterCancellation.stock).toBe(1);
  await call(request, 'PUT', `/products/${product.id}`, owner.token,
    { ...input, revision: afterCancellation.revision, name: 'New name', priceMinor: 5500, active: false });
  expect((await call(request, 'GET', `/businesses/${listing.id}/products`)).content).toEqual([]);
  const historic = await call(request, 'GET', path, buyer.token);
  expect(historic.items[0]).toMatchObject({ productName: productInput.name, priceMinor: 3750, quantity: 1 });
  expect(historic.order.totalMinor).toBe(3750);
  expect(historic.paymentStatus).toBe('OUTSIDE_PLATFORM');
  const [notice] = (await call(request, 'GET', '/notifications', buyer.token)).content.filter((item) => item.resourceId === details.order.id);
  expect(notice.type).toBe('ORDER_UPDATE');
});
