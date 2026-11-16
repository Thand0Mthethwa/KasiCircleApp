import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { testDatabaseSQL } from '../scripts/e2e-database.mjs';
const api = 'http://127.0.0.1:18081/api';
const password = 'LocationQA123!';
const tile = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#f5eedf"/><path d="M0 70H256M0 200H256M70 0V256M210 0V256" stroke="#d5c4cf" stroke-width="7"/><text x="12" y="30" font-size="12" fill="#65435f">LOCAL QA LOCATION TILE</text></svg>';
async function call(request, method, path, token, data, status = 200) {
  const response = await request.fetch(`${api}${path}`, { method, headers: token ? { Authorization: `Bearer ${token}` } : {}, data });
  expect(response.status(), `${method} ${path}: unexpected status`).toBe(status);
  return response.status() === 204 || !(await response.text()) ? null : response.json();
}
async function account(request, type = 'BUSINESS') {
  const email = `qa-location-${randomUUID()}@example.test`;
  await call(request,'POST','/auth/register',null,{firstName:'QA',lastName:'Location owner',email,phoneNumber:'+27821234567',password,accountType:type},201);
  const { token }=await call(request,'POST','/auth/login',null,{email,password});return {email,token};
}
async function create(request, owner) {
  const data={name:`QA Location ${randomUUID()}`,description:'Temporary isolated QA location fixture',phoneNumber:'+27821234567',email:'qa-location@example.test',category:'Retail',address:'Temporary QA fixture address',city:'Soweto',province:'Gauteng'};
  const business=await call(request,'POST','/businesses',owner.token,data,201);return {business,data};
}
async function tiles(page) {
  const publicRequests=[];
  await page.route(/https:\/\/[^/]*(openstreetmap|nominatim)[^/]*\//, route=>{publicRequests.push(route.request().url());return route.abort();});
  await page.route('**/__qa_location_tiles/**',route=>route.fulfill({contentType:'image/svg+xml',body:tile,headers:{'Cache-Control':'public, max-age=604800'}}));
  return publicRequests;
}
async function login(page, owner) {
  await page.goto('/login');await page.getByLabel('Email address',{exact:true}).fill(owner.email);await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Login',exact:true}).click();await expect(page).toHaveURL(/\/home$/);
}
async function publicView(request, business, expected) {
  const detail=await call(request,'GET',`/businesses/${business.id}`);
  const page=await call(request,'GET',`/businesses?search=${encodeURIComponent(business.name)}&size=8`);
  for(const item of [detail,page.content.find(item=>item.id===business.id)]) {
    expect(item).toBeTruthy();expect(item.latitude).toBe(expected?.latitude??null);expect(item.longitude).toBe(expected?.longitude??null);
  }
}

async function reviewPin(page) { await page.getByRole('button',{name:'Confirm this location'}).click();await page.getByRole('button',{name:'Continue to visibility'}).click(); }

test('owner selects, moves, saves, publishes, hides and removes a real QA business location',async({page,request},testInfo)=>{
  const publicRequests=await tiles(page);const owner=await account(request);const {business}=await create(request,owner);const endpoint=`/businesses/${business.id}/location`;
  await publicView(request,business,null);await login(page,owner);await page.goto('/business-profile');
  await page.getByRole('button',{name:'Set business location',exact:true}).click();
  await page.getByRole('button',{name:'Choose on the map',exact:true}).click();
  const map=page.getByRole('region',{name:'Business location picker'});await expect(map).toBeVisible();
  await expect(page.locator('details.location-advanced')).not.toHaveAttribute('open','');
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
  await map.click({position:{x:170,y:210}});const marker=page.getByRole('button',{name:'Selected business location'});await expect(marker).toBeVisible();
  await page.getByText('Advanced: Enter GPS coordinates',{exact:true}).click();
  const before=await page.getByLabel('Longitude',{exact:true}).inputValue();
  const point=await marker.boundingBox();await page.mouse.move(point.x+point.width/2,point.y+point.height/2);await page.mouse.down();await page.mouse.move(point.x+point.width/2+35,point.y+point.height/2+18,{steps:8});await page.mouse.up();
  await expect(page.getByLabel('Longitude',{exact:true})).not.toHaveValue(before);
  await page.getByRole('button',{name:'Cancel location',exact:true}).click();
  expect((await call(request,'GET',endpoint,owner.token)).latitude).toBeNull();
  await page.getByRole('button',{name:'Set business location',exact:true}).click();
  await page.getByRole('button',{name:'Choose on the map',exact:true}).click();
  await page.getByText('Advanced: Enter GPS coordinates',{exact:true}).click();
  await page.getByLabel('Latitude',{exact:true}).fill('-25.72');await page.getByLabel('Longitude',{exact:true}).fill('28.24');
  await reviewPin(page);await page.getByRole('button',{name:'Continue to save',exact:true}).click();
  await page.getByRole('button',{name:'Save location',exact:true}).click();await expect(page.getByText(/Business location saved privately/)).toBeVisible();
  await publicView(request,business,null);expect(await call(request,'GET',endpoint,owner.token)).toEqual({latitude:-25.72,longitude:28.24,locationPublic:false});
  await page.getByRole('button',{name:'Manage business location',exact:true}).click();
  await page.getByRole('button',{name:'Review my saved pin',exact:true}).click();await reviewPin(page);
  await page.getByRole('checkbox',{name:'Show this pin to customers',exact:true}).check();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('.business-location-editor').screenshot({path:testInfo.outputPath(`owner-location-editor-${testInfo.project.name}.png`)});
  await page.getByRole('button',{name:'Continue to save',exact:true}).click();
  await page.getByRole('button',{name:'Save location',exact:true}).click();await expect(page.getByText(/Business location published/)).toBeVisible();
  await publicView(request,business,{latitude:-25.72,longitude:28.24});await page.reload();
  await page.getByRole('button',{name:'Set business location',exact:true}).click();await page.getByRole('button',{name:'Review my saved pin',exact:true}).click();await page.getByText('Advanced: Enter GPS coordinates',{exact:true}).click();await expect(page.getByLabel('Latitude',{exact:true})).toHaveValue('-25.72');await reviewPin(page);await expect(page.getByRole('checkbox',{name:'Show this pin to customers'})).toBeChecked();
  await page.goto(`/explore?search=${encodeURIComponent(business.name)}&view=map`);const pin=page.getByRole('button',{name:`Location of ${business.name}`});await expect(pin).toBeVisible();
  await pin.focus();await page.keyboard.press('Enter');await expect(page.getByRole('link',{name:`View details for ${business.name}`})).toBeVisible();
  await page.getByRole('region',{name:'Interactive business locations map'}).screenshot({path:testInfo.outputPath(`published-location-${testInfo.project.name}.png`)});
  await page.getByRole('link',{name:`View details for ${business.name}`} ).click();await expect(page).toHaveURL(new RegExp(`/businesses/${business.id}$`));
  await page.goto('/business-profile');await page.getByRole('button',{name:'Set business location',exact:true}).click();await page.getByRole('button',{name:'Review my saved pin',exact:true}).click();await reviewPin(page);await page.getByRole('checkbox',{name:'Show this pin to customers'}).uncheck();await page.getByRole('button',{name:'Continue to save'}).click();
  await page.getByRole('button',{name:'Save location',exact:true}).click();await expect(page.getByText(/hidden from the marketplace map/)).toBeVisible();await publicView(request,business,null);
  await page.goto(`/explore?search=${encodeURIComponent(business.name)}&view=map`);await expect(page.getByText('Precise business locations are not available on this page yet.')).toBeVisible();await expect(pin).toHaveCount(0);
  await page.getByRole('button',{name:'List View',exact:true}).click();await expect(page.getByTestId(`business-card-${business.id}`)).toBeVisible();
  await page.goto('/business-profile');await page.getByRole('button',{name:'Set business location',exact:true}).click();await page.getByRole('button',{name:'Remove location',exact:true}).click();
  await expect(page.getByText(/Business location removed/)).toBeVisible();expect(await call(request,'GET',endpoint,owner.token)).toEqual({latitude:null,longitude:null,locationPublic:false});
  await publicView(request,business,null);expect(publicRequests).toEqual([]);
});

test('QA PostgreSQL constraints and JWT ownership protect private location drafts',async({request})=>{
  const owner=await account(request);const other=await account(request);const resident=await account(request,'RESIDENT');const worker=await account(request,'WORKER');
  const {business,data}=await create(request,owner);const endpoint=`/businesses/${business.id}/location`;
  for(const token of [null,other.token,resident.token,worker.token]) {
    const status=token?403:401;await call(request,'GET',endpoint,token,undefined,status);await call(request,'PUT',endpoint,token,{latitude:0,longitude:0,locationPublic:true},status);await call(request,'DELETE',endpoint,token,undefined,status);
  }
  await call(request,'PUT',endpoint,owner.token,{latitude:-25.72,longitude:28.24,locationPublic:false});await publicView(request,business,null);
  for(const body of [{latitude:91,longitude:0,locationPublic:true},{latitude:0,longitude:181,locationPublic:false},{latitude:null,longitude:0,locationPublic:false},{latitude:null,longitude:null,locationPublic:true},{latitude:0,longitude:0},{latitude:'NaN',longitude:0,locationPublic:false},{latitude:0,longitude:'Infinity',locationPublic:true}]) await call(request,'PUT',endpoint,owner.token,body,400);
  expect(business.id).toMatch(/^[a-f0-9-]{36}$/);
  // Each invalid SQL write must raise check_violation on this test-owned row inside a rolled-back QA transaction.
  for(const assignment of ["latitude='NaN'::double precision,longitude=0", "latitude='Infinity'::double precision,longitude=0", "latitude=0,longitude='-Infinity'::double precision", 'latitude=91,longitude=0', 'latitude=0,longitude=181', 'latitude=NULL,longitude=0', 'latitude=NULL,longitude=NULL,location_public=TRUE']) {
    expect(testDatabaseSQL(`BEGIN; DO $$ BEGIN BEGIN UPDATE businesses SET ${assignment} WHERE id='${business.id}'; RAISE EXCEPTION 'QA constraint was not enforced'; EXCEPTION WHEN check_violation THEN NULL; END; END $$; ROLLBACK; SELECT 'constraint checked';`)).toContain('constraint checked');
  }
  for(const published of [false,true]) {
    await call(request,'PUT',endpoint,owner.token,{latitude:-25.72,longitude:28.24,locationPublic:published});
    await call(request,'PUT',`/businesses/${business.id}`,owner.token,{...data,name:`${data.name} edited`});
    expect(await call(request,'GET',endpoint,owner.token)).toEqual({latitude:-25.72,longitude:28.24,locationPublic:published});
  }
  await call(request,'DELETE',endpoint,owner.token);await call(request,'DELETE',endpoint,owner.token);await publicView(request,{...business,name:`${data.name} edited`},null);
});
