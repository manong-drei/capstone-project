import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockMonitor(page, supported = true) {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.addInitScript(({ token, supported }) => {
    sessionStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role: "staff" }));
    sessionStorage.setItem("ek_token", token);
    window.announcements = [];
    window.speechCancellations = 0;
    window.speechVoices = [
      { name: "Microsoft David Desktop", lang: "en-US" },
      { name: "Microsoft Zira Desktop", lang: "en-US" },
    ];
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: supported ? class { constructor(text) { this.text = text; } } : undefined,
    });
    const synth = Object.assign(new EventTarget(), {
        getVoices() { return window.speechVoices; },
        speak(utterance) {
          window.currentUtterance = utterance;
          window.announcements.push({ text: utterance.text, lang: utterance.lang, voice: utterance.voice.name });
        },
        cancel() { window.speechCancellations++; },
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: supported ? synth : undefined,
    });
  }, { token: createTestToken({ user_id: 8, role: "staff" }), supported });
  const state = { polls: 0, queues: [{ id: 1, queue_number: "Q01", type: "regular", status: "waiting" }] };
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    let body = {};
    if (url.pathname === "/api/queue") {
      expect(url.searchParams.get("category")).toBe("dental");
      state.polls++;
      body = state.queues;
    } else if (url.pathname === "/api/auth/profile") body = { data: { user_id: 8, role: "staff" } };
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.clock.install({ time: new Date('2026-10-10T09:00:00+08:00') });
  return state;
}

const spokenTickets = (page) => page.evaluate(() => window.announcements);

for (const viewport of [{ width: 1440, height: 640 }, { width: 1280, height: 720 }, { width: 1920, height: 1080 }]) {
  test(`monitor follows the concept layout at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    const state = await mockMonitor(page);
    state.queues = [
      { id: 1, queue_number: 'AQ15', status: 'serving', type: 'regular' },
      ...['AQ16', 'AQ17', 'AQ18', 'AQ19', 'AQ20'].map((queue_number, index) => ({ id: index + 2, queue_number, status: 'waiting', type: 'regular' })),
      { id: 7, queue_number: 'AQ11', status: 'missed', grace_expires_at: '2026-10-10T09:08:00+08:00' },
      { id: 8, queue_number: 'AQ13', status: 'missed', grace_expires_at: '2026-10-10T09:09:00+08:00' },
    ];
    await page.setViewportSize(viewport);
    await page.goto('/general-queue-monitor');
    const current = page.getByRole('region', { name: 'Current ticket', exact: true });
    const next = page.getByRole('region', { name: 'Next ticket', exact: true });
    const upcoming = page.getByRole('region', { name: 'Upcoming', exact: true });
    const skipped = page.getByRole('region', { name: 'Skipped tickets', exact: true });
    await expect(current.getByText('AQ15', { exact: true })).toBeVisible();
    await expect(next.getByText('AQ16', { exact: true })).toBeVisible();
    await expect(upcoming.getByRole('listitem')).toHaveText(['AQ17', 'AQ18', 'AQ19', 'AQ20']);
    await expect(skipped.getByRole('listitem')).toHaveCount(2);
    await page.clock.pauseAt(new Date('2026-10-10T09:01:00+08:00'));
    await page.screenshot({ path: testInfo.outputPath(`monitor-concept-${viewport.width}.png`), animations: 'disabled' });
    const currentBox = await current.boundingBox();
    const nextBox = await next.boundingBox();
    const upcomingBox = await upcoming.boundingBox();
    const skippedBox = await skipped.boundingBox();
    const imageBox = await page.locator('img[src="/assets/BGHero.png"]').boundingBox();
    expect(currentBox.width).toBeGreaterThan(nextBox.width);
    expect(upcomingBox.x).toBeCloseTo(currentBox.x, 1);
    expect(skippedBox.x).toBeCloseTo(nextBox.x, 1);
    expect(upcomingBox.y).toBeGreaterThanOrEqual(currentBox.y + currentBox.height);
    expect(skippedBox.y).toBeCloseTo(upcomingBox.y, 1);
    expect(imageBox.x).toBeCloseTo(viewport.width * 0.7, 1);
    expect(imageBox.width).toBeCloseTo(viewport.width * 0.3, 1);
    expect(imageBox.height).toBe(viewport.height);
    const tiles = await upcoming.getByRole('listitem').all();
    const firstTile = await tiles[0].boundingBox();
    for (const tile of tiles) expect((await tile.boundingBox()).y).toBeCloseTo(firstTile.y, 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  });
}

test('recall repeats the same ticket; presence and polling stay quiet; missed tickets show deadlines', async ({ page }) => {
  const state = await mockMonitor(page);
  Object.assign(state.queues[0], { status: 'called', last_called_at: '2026-10-10T09:00:00+08:00' });
  await page.goto('/general-queue-monitor');
  await page.getByRole('button', { name: 'Enable announcements' }).click();
  await expect.poll(() => spokenTickets(page)).toHaveLength(2);
  state.queues[0].last_called_at = '2026-10-10T09:00:30+08:00';
  await page.clock.fastForward(10_000);
  await expect.poll(() => spokenTickets(page)).toHaveLength(4);
  state.queues[0].status = 'serving';
  await page.clock.fastForward(30_000);
  expect(await spokenTickets(page)).toHaveLength(4);
  Object.assign(state.queues[0], { status: 'missed', grace_expires_at: '2026-10-10T09:11:00+08:00' });
  await page.clock.fastForward(10_000);
  await expect(page.getByRole('region', { name: 'Skipped tickets' }).locator('time')).toHaveText('9:11 AM');
  expect(await spokenTickets(page)).toHaveLength(4);
});

test('skipped tickets show only recoverable numbers, expire locally, and leave the panel after staff confirms a return', async ({ page }, testInfo) => {
  const state = await mockMonitor(page);
  state.queues.push(
    { id: 2, queue_number: 'AP02', status: 'serving', type: 'priority' },
    { id: 3, queue_number: 'Q03', status: 'missed', grace_expires_at: '2026-10-10T09:06:00+08:00', full_name: 'Private Patient Name' },
    { id: 4, queue_number: 'P04', status: 'missed', grace_expires_at: '2026-10-10T09:01:05+08:00' },
    { id: 5, queue_number: 'AQ05', status: 'missed', grace_expires_at: '2026-10-10T09:01:00+08:00' },
    { id: 6, queue_number: 'AP06', status: 'no_show', grace_expires_at: '2026-10-10T09:10:00+08:00' },
    { id: 7, queue_number: 'Q07', status: 'cancelled', grace_expires_at: '2026-10-10T09:10:00+08:00' },
    { id: 8, queue_number: 'Q08', status: 'missed', grace_expires_at: 'invalid' },
    { id: 9, queue_number: 'Q09', status: 'missed', grace_expires_at: null },
    { id: 10, queue_number: 'Q10', status: 'missed' },
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/general-queue-monitor');
  const skipped = page.getByRole('region', { name: 'Skipped tickets' });
  await expect(skipped.getByRole('heading', { name: 'Skipped tickets' })).toBeVisible();
  await page.clock.pauseAt(new Date('2026-10-10T09:01:00+08:00'));
  await expect(skipped.getByRole('listitem')).toHaveCount(2);
  await expect(skipped.getByRole('listitem').first()).toContainText('P04');
  await expect(skipped.locator('time').last()).toHaveText('9:06 AM');
  await expect(skipped.getByText('Report to staff before the deadline to keep your ticket.', { exact: true })).toHaveCount(1);
  await expect(page.getByText('Private Patient Name')).toHaveCount(0);
  for (const number of ['AQ05', 'AP06', 'Q07', 'Q08', 'Q09', 'Q10']) {
    await expect(skipped.getByText(number, { exact: true })).toHaveCount(0);
  }
  const pollsBeforeExpiry = state.polls;
  await page.clock.runFor(4_000);
  await expect(skipped.getByRole('listitem')).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath('skipped-tickets-monitor.png'), fullPage: true });
  const panel = await skipped.boundingBox();
  const upcoming = await page.getByRole('region', { name: 'Upcoming', exact: true }).boundingBox();
  const image = await page.locator('img[src="/assets/BGHero.png"]').boundingBox();
  expect(panel.x).toBeGreaterThan(upcoming.x + upcoming.width);
  expect(panel.y).toBeCloseTo(upcoming.y, 1);
  expect(panel.x + panel.width).toBeLessThanOrEqual(image.x);
  expect(image.x).toBeCloseTo(1440 * 0.7, 1);
  expect(image.width).toBeCloseTo(1440 * 0.3, 1);
  expect(image.y).toBe(0);
  expect(image.height).toBeGreaterThanOrEqual(900);
  expect(panel.y + panel.height).toBeLessThanOrEqual(900);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.clock.runFor(1_000);
  await expect(skipped.getByText('P04', { exact: true })).toHaveCount(0);
  await expect(skipped.getByRole('listitem')).toHaveCount(1);
  expect(state.polls).toBe(pollsBeforeExpiry);
  expect(state.queues.find(queue => queue.id === 4).status).toBe('missed');

  state.queues.find(queue => queue.id === 3).status = 'waiting';
  await page.clock.runFor(5_000);
  await expect(skipped.getByRole('listitem')).toHaveCount(0);
  await expect(page.getByText('Q03', { exact: true })).toBeVisible();
  expect(await spokenTickets(page)).toEqual([]);
});

test("announces each serving ticket twice with a female voice and keeps quiet on repeated polls", async ({ page }) => {
  const state = await mockMonitor(page);
  await page.goto("/general-queue-monitor");
  await expect(page.getByText("Q01", { exact: true })).toBeVisible();
  expect(await spokenTickets(page)).toEqual([]);
  await page.getByRole("button", { name: "Enable announcements" }).click();
  expect(await spokenTickets(page)).toEqual([]);

  for (const [id, ticket, spokenNumber] of [
    [1, "Q01", "Q 0 1"], [2, "P02", "P 0 2"], [3, "AQ03", "A Q 0 3"],
    [4, "AP100", "A P 1 0 0"], [5, "AP100", "A P 1 0 0"], [6, "Q-005", "Q 0 0 5"],
  ]) {
    state.queues = [{ id, queue_number: ticket, type: "regular", status: "serving" }];
    await page.clock.fastForward(10_000);
    await expect.poll(() => spokenTickets(page)).toHaveLength(id * 2);
    const announcement = {
      text: `Now serving. Queue number ${spokenNumber}. Please proceed to the dentist.`,
      lang: "en-US", voice: "Microsoft Zira Desktop",
    };
    expect((await spokenTickets(page)).slice(-2)).toEqual([announcement, announcement]);
    const previousPolls = state.polls;
    await page.clock.fastForward(30_000);
    await expect.poll(() => state.polls).toBeGreaterThan(previousPolls);
    expect(await spokenTickets(page)).toHaveLength(id * 2);
  }
});

test("enabling announces the current ticket, muting stops speech, and an empty queue cancels it", async ({ page }) => {
  const state = await mockMonitor(page);
  state.queues[0].status = "serving";
  await page.goto("/general-queue-monitor");
  await expect(page.getByText("Q01", { exact: true })).toBeVisible();
  expect(await spokenTickets(page)).toEqual([]);
  await page.getByRole("button", { name: "Enable announcements" }).click();
  await expect.poll(() => spokenTickets(page)).toHaveLength(2);
  const cancellations = await page.evaluate(() => window.speechCancellations);
  await page.getByRole("button", { name: "Mute announcements" }).click();
  await expect.poll(() => page.evaluate(() => window.speechCancellations)).toBeGreaterThan(cancellations);
  state.queues = [{ id: 2, queue_number: "AP02", type: "priority", status: "serving" }];
  await page.clock.fastForward(10_000);
  await expect(page.getByText("AP02", { exact: true })).toBeVisible();
  expect(await spokenTickets(page)).toHaveLength(2);
  await page.getByRole("button", { name: "Enable announcements" }).click();
  await expect.poll(() => spokenTickets(page)).toHaveLength(4);
  const beforeEmpty = await page.evaluate(() => window.speechCancellations);
  state.queues = [];
  await page.clock.fastForward(10_000);
  await expect(page.getByText("No patient being served", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.speechCancellations)).toBeGreaterThan(beforeEmpty);
  expect(await spokenTickets(page)).toHaveLength(4);
});

test("unsupported browsers keep the visual queue available", async ({ page }) => {
  const state = await mockMonitor(page, false);
  state.queues[0].status = "serving";
  await page.goto("/general-queue-monitor");
  await expect(page.getByText("Voice announcements are unavailable in this browser.")).toBeVisible();
  await expect(page.getByText("Q01", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enable announcements" })).toHaveCount(0);
});

test("speech failures show a retry message without breaking the queue", async ({ page }) => {
  const state = await mockMonitor(page);
  state.queues[0].status = "serving";
  await page.goto("/general-queue-monitor");
  await expect(page.getByText("Q01", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Enable announcements" }).click();
  await expect.poll(() => spokenTickets(page)).toHaveLength(2);
  await page.evaluate(() => window.currentUtterance.onerror({ error: "interrupted" }));
  await expect(page.getByRole("button", { name: "Mute announcements" })).toBeVisible();
  await page.evaluate(() => window.currentUtterance.onerror({ error: "audio-hardware" }));
  await expect(page.getByRole("status")).toContainText("Announcement could not play.");
  await expect(page.getByText("Q01", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Enable announcements" }).click();
  await expect.poll(() => spokenTickets(page)).toHaveLength(4);
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mute announcements' })).toBeVisible();
});

test("waits for voices to load, prefers a female Philippine-English voice, and ignores later voice events", async ({ page }) => {
  const state = await mockMonitor(page);
  state.queues[0].status = "serving";
  await page.goto("/general-queue-monitor");
  await expect(page.getByText("Q01", { exact: true })).toBeVisible();
  await page.evaluate(() => { window.speechVoices = []; });
  await page.getByRole("button", { name: "Enable announcements" }).click();
  expect(await spokenTickets(page)).toEqual([]);
  await page.evaluate(() => {
    window.speechVoices = [
      { name: "Microsoft David Desktop", lang: "en-US" },
      { name: "Microsoft Zira Desktop", lang: "en-US" },
      { name: "Microsoft Elsa", lang: "it-IT" },
      { name: "Microsoft Rosa Online (Natural)", lang: "en-PH" },
    ];
    window.speechSynthesis.dispatchEvent(new Event("voiceschanged"));
  });
  await expect.poll(() => spokenTickets(page)).toHaveLength(2);
  expect((await spokenTickets(page)).every((announcement) =>
    announcement.voice === "Microsoft Rosa Online (Natural)" && announcement.lang === "en-PH")).toBe(true);
  await page.evaluate(() => window.speechSynthesis.dispatchEvent(new Event("voiceschanged")));
  expect(await spokenTickets(page)).toHaveLength(2);
});

test("a missing female English voice shows instructions and never uses a male voice", async ({ page }) => {
  const state = await mockMonitor(page);
  state.queues[0].status = "serving";
  await page.goto("/general-queue-monitor");
  await expect(page.getByText("Q01", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    window.speechVoices = [
      { name: "Microsoft David Desktop", lang: "en-US" },
      { name: "Microsoft Zira Desktop", lang: "de-DE" },
    ];
  });
  await page.getByRole("button", { name: "Enable announcements" }).click();
  await expect(page.getByRole("status")).toContainText("No recognized female English voice is available.");
  await expect(page.getByRole("button", { name: "Enable announcements" })).toBeVisible();
  expect(await spokenTickets(page)).toEqual([]);
});
