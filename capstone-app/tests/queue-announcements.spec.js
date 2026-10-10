import { test, expect } from "@playwright/test";
import { createTestToken } from "./helpers/auth";

async function mockMonitor(page, supported = true) {
  await page.addInitScript(({ token, supported }) => {
    localStorage.setItem("ek_user", JSON.stringify({ user_id: 8, role: "staff" }));
    localStorage.setItem("ek_token", token);
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
  await page.clock.install();
  return state;
}

const spokenTickets = (page) => page.evaluate(() => window.announcements);

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
  await expect(page.getByRole('region', { name: 'Missed calls' })).toContainText('Report to staff before 9:11 AM');
  expect(await spokenTickets(page)).toHaveLength(4);
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
