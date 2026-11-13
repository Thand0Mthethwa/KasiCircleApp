import { chromium } from '../../frontend/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';
const browser = await chromium.launch({ executablePath: process.env.E2E_CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const report=[];
const comparisonListings = [
  {id:'qa-kota', name:'QA Kota Corner',category:'Food & Beverage',city:'Daveyton',province:'Gauteng',averageRating:4.7,reviewCount:10,coverImageUrl:'/images/kota.webp'},
  {id:'qa-salon', name:'QA Braids & Bloom',category:'Salon & Beauty',city:'Daveyton',province:'Gauteng',averageRating:4.8,reviewCount:12,coverImageUrl:'/images/salon.webp'},
  {id:'qa-hardware', name:'QA Corner Hardware',category:'Retail',city:'Daveyton',province:'Gauteng',averageRating:4.6,reviewCount:8,coverImageUrl:'/images/hardware.webp'},
];
for (const [label,url] of [['reference','http://127.0.0.1:5175/#/explore'],['actual','http://127.0.0.1:5174/explore']]) {
  const page=await browser.newPage();
  // Explicit QA-only fixtures for comparing card styling; never shipped as live listings.
  if(label==='actual') await page.route('**/api/businesses?*',r=>r.fulfill({json:{content:comparisonListings,totalElements:3,totalPages:1}}));
  for (const [size,width,height] of [['desktop',1440,900],['tablet',768,1024],['mobile',375,812]]) {
    await page.setViewportSize({width,height});await page.goto(url);await page.evaluate(()=>document.fonts.ready);
    await page.locator('h1').waitFor();
    if(label==='actual') await page.getByTestId('business-cards-list').waitFor();
    await page.screenshot({path:new URL(`${label}-${size}.png`,import.meta.url).pathname,fullPage:true});
    await page.screenshot({path:new URL(`${label}-${size}-viewport.png`,import.meta.url).pathname});
    report.push({label,size,...await page.evaluate(()=>{
      const box=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
      return {viewport:innerWidth,scroll:document.documentElement.scrollWidth,headingFont:getComputedStyle(document.querySelector('h1')).fontFamily,bodyColor:getComputedStyle(document.body).color,hero:box('.hero'),search:box('.search-panel')};
    })});
  }
  await page.close();
}
await fs.writeFile(new URL('comparison.json',import.meta.url),JSON.stringify(report,null,2));
await browser.close();
