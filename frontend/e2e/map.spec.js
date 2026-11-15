import { expect, test } from '@playwright/test';

const shop = { id: 'qa-map-shop', name: 'QA Map Shop', description: 'Controlled map browser fixture.', category: 'Retail', address: 'Approved public business location', city: 'Soweto', province: 'Gauteng', latitude: -26.23, longitude: 27.87, ownerId: 'qa-owner', averageRating: 0, reviewCount: 0 };
const second = { ...shop, id: 'qa-map-next', name: 'QA Next Page Shop', latitude: -25.75, longitude: 28.19 };
const worker = { id: 'qa-map-worker', displayName: 'QA Public Worker', headline: 'Repairs', bio: 'Controlled public worker fixture.', skills: ['Repairs'], serviceCategories: ['Services'], city: 'Soweto', province: 'Gauteng', latitude: -26, longitude: 28, address: 'PRIVATE WORKER HOME — MUST NOT DISPLAY' };
const pageOf = (content, totalElements = content.length, totalPages = 1) => ({ content, totalElements, totalPages });
const tile = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#f4eddf"/><path d="M0 60H256M0 190H256M70 0V256M210 0V256" stroke="#d6c4ce" stroke-width="8"/><path d="M0 130L256 90" stroke="#edbd44" stroke-width="5"/><text x="12" y="28" fill="#65435f" font-size="12">LOCAL QA TILE FIXTURE</text></svg>';
async function fixtures(page, { missing = false, tileFailure = false } = {}) {
  const apiCalls = [], tileCalls = [], publicCalls = [];
  await page.addInitScript(() => { localStorage.removeItem('kasicircle_token');localStorage.removeItem('kasicircle_user'); });
  await page.route(/https:\/\/[^/]*(openstreetmap|nominatim)[^/]*\//, route => { publicCalls.push(route.request().url());return route.abort(); });
  await page.route('**/__map_tiles/**', route => {
    tileCalls.push(route.request().url());
    return tileFailure ? route.abort() : route.fulfill({ contentType: 'image/svg+xml', body: tile, headers: { 'Cache-Control': 'public, max-age=604800' } });
  });
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url());apiCalls.push(url);
    if (url.pathname === '/api/businesses') {
      const current = url.searchParams.get('page') === '1' ? second : shop;
      return route.fulfill({ json: pageOf([{ ...current, ...(missing ? { latitude: null, longitude: null } : {}) }, { ...shop, id: 'qa-invalid', name: 'QA Unlocated Shop', latitude: 91 }], 10, 2) });
    }
    if (url.pathname === '/api/workers') return route.fulfill({ json: pageOf([worker], 3, 1) });
    if (url.pathname === `/api/businesses/${shop.id}` || url.pathname === `/api/businesses/${second.id}`) return route.fulfill({ json: url.pathname.endsWith(shop.id) ? shop : second });
    if (url.pathname.endsWith('/reviews/summary')) return route.fulfill({ json: { averageRating: 0, totalReviews: 0 } });
    if (url.pathname.endsWith('/reviews/me')) return route.fulfill({ status: 204 });
    if (url.pathname.endsWith('/reviews')) return route.fulfill({ json: pageOf([]) });
    if (url.pathname.endsWith('/images')) return route.fulfill({ json: [] });
    return route.fulfill({ status: 404, json: { message: 'Unconfigured map QA route' } });
  });
  return { apiCalls, tileCalls, publicCalls };
}

for (const width of [375, 768, 1440]) {
  test(`List / Map navigation, public pins and independent pages at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 950 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const requests = await fixtures(page);
    await page.goto('/explore?search=QA&city=Soweto');
    await expect(page.getByTestId(`business-card-${shop.id}`)).toBeVisible();
    await expect(page.getByRole('button', { name: 'List View', exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(requests.tileCalls).toHaveLength(0);
    const before = requests.apiCalls.length;
    const toggle = page.getByRole('button', { name: 'Map View', exact: true });
    await toggle.focus();
    expect(await toggle.evaluate(button => parseFloat(getComputedStyle(button).outlineWidth))).toBeGreaterThanOrEqual(2);
    await page.keyboard.press('Enter');
    const map = page.getByRole('region', { name: 'Interactive business locations map' });
    await expect(map).toBeVisible();
    await expect(page.getByText('Showing 1 business pin from the current business page (page 1).', { exact: true })).toBeVisible();
    await expect(page.getByText(/not all matching results/)).toBeVisible();
    await expect(page.getByText('10 businesses listed')).toBeVisible();await expect(page.getByText('3 independent workers listed')).toBeVisible();
    await expect(page.getByRole('searchbox')).toHaveValue('QA');await expect(page.getByLabel('Filter by township or city')).toHaveValue('Soweto');
    expect(requests.apiCalls.length).toBe(before);
    await expect(page.getByTestId(`worker-card-${worker.id}`)).toBeVisible();
    await expect(page.getByText(worker.address)).toHaveCount(0);
    const marker = page.getByRole('button', { name: `Location of ${shop.name}` });
    await expect(marker).toBeVisible();await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
    await expect.poll(() => marker.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.locator('.leaflet-tile').first()).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    await expect(page.locator('.leaflet-tile-loaded').first()).toBeVisible();
    await map.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('+');await page.keyboard.press('-');
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
    await marker.focus();await page.keyboard.press('Enter');
    await expect(page.getByRole('link', { name: `View details for ${shop.name}` })).toBeVisible();
    await expect(page.getByText('Approved public business location, Soweto, Gauteng')).toBeVisible();
    await expect.poll(async () => {
      const popupBox = await page.locator('.leaflet-popup').boundingBox();
      const mapBox = await map.boundingBox();
      return popupBox && mapBox && popupBox.y >= mapBox.y && popupBox.x >= mapBox.x
        && popupBox.y + popupBox.height <= mapBox.y + mapBox.height
        && popupBox.x + popupBox.width <= mapBox.x + mapBox.width;
    }).toBe(true);
    const zoomBox = await page.locator('.leaflet-control-zoom').boundingBox();
    const creditBox = await page.locator('.leaflet-control-attribution').boundingBox();
    expect(zoomBox.y + zoomBox.height).toBeLessThanOrEqual(creditBox.y);
    const box = await map.boundingBox();expect(box.height).toBeGreaterThanOrEqual(400);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await map.screenshot({ path: testInfo.outputPath(`map-pins-${width}.png`) });
    await page.screenshot({ path: testInfo.outputPath(`explore-map-${width}.png`), fullPage: true });
    await page.getByRole('link', { name: `View details for ${shop.name}` }).click();await expect(page).toHaveURL(new RegExp(`/businesses/${shop.id}$`));
    await page.goBack();await expect(page.getByRole('button', { name: 'Map View', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Next page', exact: true }).click();
    await expect(page.getByRole('button', { name: `Location of ${second.name}` })).toBeVisible();await expect(page.getByRole('button', { name: `Location of ${shop.name}` })).toHaveCount(0);
    await expect(page.getByText(/current business page \(page 2\)/)).toBeVisible();
    expect(requests.apiCalls.filter(url => url.pathname === '/api/businesses').every(url => url.searchParams.get('size') === '8')).toBe(true);
    await page.getByRole('tab', { name: 'Workers', exact: true }).click();await expect(map).toHaveCount(0);
    await expect(page.getByText(/Worker locations are private/)).toBeVisible();await expect(page.getByTestId(`worker-card-${worker.id}`)).toBeVisible();
    await page.getByRole('button', { name: 'List View', exact: true }).click();await page.getByRole('tab', { name: 'All', exact: true }).click();
    await expect(page.getByTestId(`business-card-${second.id}`)).toBeVisible();await expect(page.getByTestId(`worker-card-${worker.id}`)).toBeVisible();
    expect(requests.publicCalls).toEqual([]);
  });
}

test('missing coordinates show an honest empty map while businesses remain in List View', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 950 });const requests = await fixtures(page, { missing: true });
  await page.goto('/explore?view=map&provider=businesses');
  await expect(page.getByText('Precise business locations are not available on this page yet.')).toBeVisible();
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
  await page.getByRole('region', { name: 'Business map view' }).screenshot({ path: testInfo.outputPath('map-no-coordinates-375.png') });
  await page.getByRole('button', { name: 'Browse List View', exact: true }).click();await expect(page.getByTestId(`business-card-${shop.id}`)).toBeVisible();
  expect(requests.publicCalls).toEqual([]);
});

test('tile failures preserve keyboard-accessible pins and usable List View', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 950 });const requests = await fixtures(page, { tileFailure: true });
  await page.goto('/explore?view=map');await expect(page.getByRole('alert')).toContainText('Some map tiles could not load');
  await expect(page.getByRole('button', { name: `Location of ${shop.name}` })).toBeVisible();
  await page.getByRole('button', { name: 'Retry map tiles' }).click();await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('region', { name: 'Business map view' }).screenshot({ path: testInfo.outputPath('map-tile-failure-375.png') });
  await page.getByRole('button', { name: 'List View', exact: true }).click();await expect(page.getByTestId(`business-card-${shop.id}`)).toBeVisible();
  expect(requests.publicCalls).toEqual([]);
});

test('Workers-only map bookmark never initializes tiles or exposes private location data', async ({ page }) => {
  const requests = await fixtures(page);await page.goto('/explore?view=map&provider=workers');
  await expect(page.getByTestId(`worker-card-${worker.id}`)).toBeVisible();await expect(page.getByText(/Worker locations are private/)).toBeVisible();
  expect(requests.tileCalls).toEqual([]);await expect(page.getByRole('region', { name: 'Interactive business locations map' })).toHaveCount(0);
  await expect(page.getByText(worker.address)).toHaveCount(0);expect(requests.apiCalls.some(url => url.pathname === '/api/businesses')).toBe(false);
  expect(requests.publicCalls).toEqual([]);
});
