import { chromium } from "../../frontend/node_modules/playwright-core/index.mjs";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox"],
});
for (const [label, url] of [
  ["reference", "http://127.0.0.1:5175/#/explore"],
  ["home", "http://127.0.0.1:5174/home"],
]) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log(label, e.message));
  for (const [size, width, height] of [
    ["desktop", 1440, 900],
    ["mobile", 375, 812],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(url);
    await page.waitForTimeout(1800);
    await page.screenshot({
      path: new URL(`${label}-${size}.png`, import.meta.url).pathname,
      fullPage: true,
    });
    await page.screenshot({path: new URL(`${label}-${size}-viewport.png`, import.meta.url).pathname});
    console.log(
      label,
      size,
      await page.locator(".hero-content").boundingBox(),
      await page
        .locator(".hero-message h1")
        .evaluate((e) => ({
          font: getComputedStyle(e).font,
          lineHeight: getComputedStyle(e).lineHeight,
        })),
      await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      })),
    );
  }
  await page.close();
}
await browser.close();
