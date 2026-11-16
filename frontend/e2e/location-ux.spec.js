import { test, expect } from '@playwright/test';
const member = { id: 'ux-owner', firstName: 'QA', lastName: 'Owner', email: 'ux@example.test', accountType: 'BUSINESS', role: 'USER' };
const business = { id: 'ux-business', ownerId: member.id, name: 'QA Guided Location Shop', description: 'Controlled browser fixture', category: 'Retail', address: 'QA address', city: 'Soweto', province: 'Gauteng' };
async function fixtures(page, { error, accuracy = 15, published = false, unavailable = false, configured = true, empty = false } = {}) {
  const state = { saved: { latitude: published ? -26.23 : null, longitude: published ? 27.87 : null, locationPublic: published }, writes: [], searches: [], external: [] };
  await page.addInitScript(({ member, error, accuracy }) => {
    localStorage.setItem('kasicircle_token', 'controlled-qa-token');localStorage.setItem('kasicircle_user', JSON.stringify(member));
    window.geoCalls = 0;
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(success, failure) { window.geoCalls++; if (error) failure({ code: error }); else success({ coords: { latitude: -26.23, longitude: 27.87, accuracy } }); } } });
  }, { member, error, accuracy });
  await page.route(/https:\/\/[^/]*(openstreetmap|nominatim|photon|geoapify)[^/]*\//, route => { state.external.push(route.request().url());return route.abort(); });
  await page.route('**/__ux_tiles/**', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#f4eddf"/><path d="M0 70H256M70 0V256" stroke="#d6c4ce" stroke-width="8"/><text x="12" y="30">QA tile fixture</text></svg>' }));
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/places/status') return route.fulfill({ json: { enabled: configured } });
    if (path === '/api/places/search') { state.searches.push(route.request().url());return route.fulfill(unavailable ? { status: 503, json: {} } : { json: { places: empty ? [] : [{ name: 'Daveyton', formattedAddress: 'Daveyton, Gauteng, South Africa', latitude: -26.15, longitude: 28.42, attribution: '© OpenStreetMap contributors' }] } }); }
    if (path.endsWith('/location')) { if (route.request().method() === 'PUT') { state.saved = route.request().postDataJSON();state.writes.push(state.saved); } return route.fulfill({ json: state.saved }); }
    if (path === '/api/users/me') return route.fulfill({ json: member });
    if (path === '/api/users/me/businesses') return route.fulfill({ json: { content: [business], totalElements: 1, totalPages: 1 } });
    if (path.endsWith('/images')) return route.fulfill({ json: [] });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto('/business-profile');await page.getByRole('button', { name: 'Set business location', exact: true }).click();return state;
}
async function visibility(page) { await page.getByRole('button', { name: 'Confirm this location' }).click();await page.getByRole('button', { name: 'Continue to visibility' }).click(); }
for (const width of [375, 1440]) {
  test(`guided search and keyboard placement without coordinates at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 950 });const state = await fixtures(page);
    await expect(page.getByRole('heading', { name: 'Step 1 of 5: Find your area' })).toBeFocused();
    expect(await page.evaluate(() => window.geoCalls)).toBe(0);
    const input = page.getByRole('searchbox', { name: 'Search for a place', exact: true });await input.fill('Daveyton');await expect(input).toHaveValue('Daveyton');await input.press('Backspace');await expect(input).toHaveValue('Daveyto');await input.fill('Daveyton');expect(state.searches).toHaveLength(0);
    await expect(page.getByRole('button', { name: 'Search places', exact: true })).toBeEnabled();await page.locator('.business-location-editor').screenshot({path:info.outputPath(`search-input-${width}.png`),scale:'css',style:'.skip-link, .mobile-navigation { visibility: hidden !important; }'});await input.press('Enter');await page.getByRole('button', { name: /Daveyton.*Gauteng/ }).click();expect(state.searches).toHaveLength(1);
    await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);await expect(page.locator('details.location-advanced')).not.toHaveAttribute('open', '');expect(state.writes).toHaveLength(0);
    const map = page.getByRole('region', { name: 'Business location picker' });await map.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('+');
    const place = page.getByRole('button', { name: 'Place pin in the middle of the map' });await place.focus();await page.keyboard.press('Enter');await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
    expect((await place.boundingBox()).height).toBeGreaterThanOrEqual(48);expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.business-location-editor').screenshot({ path: info.outputPath(`guided-map-${width}.png`), scale: 'css', style: '.skip-link, .mobile-navigation { visibility: hidden !important; }' });
    await visibility(page);await expect(page.getByRole('checkbox', { name: 'Show this pin to customers' })).not.toBeChecked();
    await page.locator('.business-location-editor').screenshot({ path: info.outputPath(`guided-privacy-${width}.png`), scale: 'css', style: '.skip-link, .mobile-navigation { visibility: hidden !important; }' });
    await page.getByRole('button', { name: 'Continue to save' }).click();expect(state.writes).toHaveLength(0);await page.getByRole('button', { name: 'Save location', exact: true }).click();
    await expect(page.getByText(/Business location saved privately/)).toBeVisible();expect(state.writes).toHaveLength(1);expect(state.saved.locationPublic).toBe(false);expect(state.saved.latitude).toBeCloseTo(-26.15, 1);expect(state.saved.longitude).toBeCloseTo(28.42, 1);expect(state.external).toEqual([]);
  });
}
for (const variant of [{}, { accuracy: 700 }, { error: 1 }, { error: 2 }, { error: 3 }]) {
  test(`explicit device permission ${JSON.stringify(variant)}`, async ({ page }) => {
    const state = await fixtures(page, variant);await page.getByRole('button', { name: 'Use my current location', exact: true }).click();expect(await page.evaluate(() => window.geoCalls)).toBe(0);
    await page.getByRole('button', { name: 'Continue and ask permission' }).click();
    if (variant.error) await expect(page.getByRole('alert')).toContainText(variant.error === 1 ? 'permission was not given' : variant.error === 2 ? 'could not find' : 'took too long');
    else { await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);if (variant.accuracy) await expect(page.getByText(/about 700 metres/)).toBeVisible(); }
    expect(await page.evaluate(() => window.geoCalls)).toBe(1);await page.getByRole('button', { name: 'Cancel location' }).click();expect(state.writes).toHaveLength(0);expect(state.external).toEqual([]);
  });
}
test('published replacement requires new consent and cancellation preserves saved pin', async ({ page }) => {
  const state = await fixtures(page, { published: true });await page.getByRole('button', { name: 'Choose on the map', exact: true }).click();await page.getByRole('region', { name: 'Business location picker' }).click({ position: { x: 160, y: 180 } });await visibility(page);
  await expect(page.getByRole('checkbox', { name: 'Show this pin to customers', exact: true })).toBeChecked();await page.getByRole('button', { name: 'Continue to save' }).click();await expect(page.getByRole('alert')).toContainText('Confirm that customers');
  await page.getByRole('checkbox', { name: 'I confirm customers may see this changed location' }).check();await page.getByRole('button', { name: 'Continue to save' }).click();await page.getByRole('button', { name: 'Cancel location' }).click();expect(state.writes).toHaveLength(0);expect(state.saved).toEqual({ latitude: -26.23, longitude: 27.87, locationPublic: true });
});
test('unavailable search leaves map placement working', async ({ page }) => {
  const state = await fixtures(page, { unavailable: true });await page.getByRole('searchbox', { name: 'Search for a place', exact: true }).fill('Daveyton');await page.getByRole('button', { name: 'Search places', exact: true }).click();await expect(page.getByText(/Online place search is temporarily unavailable/)).toBeVisible();await page.getByRole('button', { name: 'Choose on the map', exact: true }).click();await expect(page.getByRole('region', { name: 'Business location picker' })).toBeVisible();expect(state.writes).toHaveLength(0);
});

for (const width of [375, 1440]) test(`unconfigured search stays editable and manual map works at ${width}px`, async ({ page }, info) => {
  await page.setViewportSize({width,height:950});const state=await fixtures(page,{configured:false,published:true});
  const input=page.getByRole('searchbox',{name:'Search for a place',exact:true});await input.tap();await input.pressSequentially('Daveyton');await expect(input).toHaveValue('Daveyton');await input.press('Backspace');await expect(input).toHaveValue('Daveyto');await input.fill('Benoni');await input.press('Enter');
  await expect(page.getByText(/Online place search is temporarily unavailable/)).toBeVisible();expect(state.searches).toHaveLength(0);await expect(input).toBeEnabled();expect(await input.evaluate(element=>element.readOnly)).toBe(false);expect(await input.evaluate(element=>getComputedStyle(element).pointerEvents)).not.toBe('none');await page.locator('.business-location-editor').screenshot({path:info.outputPath(`unconfigured-input-${width}.png`),scale:'css',style:'.skip-link, .mobile-navigation { visibility: hidden !important; }'});
  await page.getByRole('button',{name:'Choose on the map',exact:true}).click();await page.getByRole('region',{name:'Business location picker'}).click({position:{x:160,y:180}});await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
  await expect(page.getByText('Advanced: Enter GPS coordinates',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Cancel location'}).click();expect(state.writes).toHaveLength(0);expect(state.saved.locationPublic).toBe(true);expect(state.saved.latitude).toBe(-26.23);
});
test('empty results explain alternatives without inventing a pin',async({page})=>{
  const state=await fixtures(page,{empty:true});await page.getByRole('searchbox').fill('Daveyton');await page.getByRole('button',{name:'Search places',exact:true}).click();await expect(page.getByText(/No places found/)).toBeVisible();await expect(page.getByRole('list',{name:'Places found'})).toHaveCount(0);expect(state.writes).toHaveLength(0);
});
