const assert = require('node:assert/strict');
const { chromium } = require('../capstone-app/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:3001/');
    await page.locator('.cinematic-intro h1').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate(async () => {
      const spacer = document.querySelector('.pin-spacer');
      const stage = document.querySelector('.cinematic-stage');
      const startY = spacer.getBoundingClientRect().top + scrollY - 72;
      const trigger = { start: startY, end: startY + spacer.offsetHeight - stage.offsetHeight };
      const gaps = [];
      let previous = performance.now();
      await new Promise(resolve => {
        const start = performance.now();
        function frame(now) {
          gaps.push(now - previous);
          previous = now;
          const progress = Math.min(1, (now - start) / 2500);
          window.scrollTo(0, trigger.start + (trigger.end - trigger.start) * progress);
          if (progress < 1) requestAnimationFrame(frame);
          else resolve();
        }
        requestAnimationFrame(frame);
      });
      gaps.sort((a, b) => a - b);
      return { start: trigger.start, end: trigger.end, frames: gaps.length, p95: gaps[Math.floor(gaps.length * 0.95)], max: Math.max(...gaps), over33ms: gaps.filter(gap => gap > 33.4).length };
    });
    await page.waitForTimeout(1000);
    const label = process.argv[2] || 'after';
    await page.screenshot({ path: `tmp/cinematic-${label}.png` });
    const card = await page.locator('.cinematic-card').boundingBox();
    assert(card && card.y < 110 && card.y > 0, 'Revealed card stays below the navigation');
    assert.equal(await page.locator('.cinematic-intro').evaluate(el => Number(getComputedStyle(el).opacity)), 0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('.cinematic-intro').evaluate(el => Number(getComputedStyle(el).opacity)), 1);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ label, ...result, forwardAndReverse: 'passed', errors }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
