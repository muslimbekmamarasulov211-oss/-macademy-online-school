/**
 * End-to-end test of the generator page in a real browser — every feature, real Navoiy TTS,
 * real rendering. Takes several minutes on a CPU.
 *
 *   1. npm run generator            (in another terminal; Navoiy TTS must be installed)
 *   2. npm run e2e                  (needs Playwright with Chromium installed globally)
 *
 * GENERATOR_URL overrides the address (default http://localhost:3333).
 */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const BASE = process.env.GENERATOR_URL || "http://localhost:3333";
const results = [];
const check = async (name, fn) => {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, secs: Math.round((Date.now() - started) / 1000) });
    console.log(`✅ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.log(`❌ ${name}\n   ${err.message}`);
  }
};

const waitForFinish = (page, timeout = 20 * 60 * 1000) =>
  page.waitForFunction(
    () => {
      const step = document.getElementById("step");
      return step && (step.textContent.startsWith("Tayyor") || step.classList.contains("error"));
    },
    null,
    { timeout, polling: 1000 },
  );

/** Download through the page's link and check headers, size and byte ranges. */
const checkDownload = async (request, href, type) => {
  const res = await request.get(BASE + href);
  assert.equal(res.status(), 200, `GET ${href}`);
  assert.equal(res.headers()["content-type"], type);
  assert.match(
    res.headers()["content-disposition"] ?? "",
    /^attachment; filename="[a-z0-9-]+\.(mp4|mp3|wav)"$/,
  );
  const body = await res.body();
  assert.equal(body.length, Number(res.headers()["content-length"]));
  assert.ok(body.length > 10_000, `file too small: ${body.length} bytes`);
  if (type === "video/mp4") assert.equal(body.subarray(4, 8).toString(), "ftyp", "not an MP4 file");
  const part = await request.get(BASE + href.replace("?download", ""), {
    headers: { Range: "bytes=0-1023" },
  });
  assert.equal(part.status(), 206, "Range request (needed by Safari/iPad)");
  assert.equal((await part.body()).length, 1024);
  return body.length;
};

/** Range sliders cannot be "filled" — set the value and fire the input event like a user drag. */
const setRange = (page, selector, value) =>
  page.$eval(
    selector,
    (el, v) => {
      el.value = String(v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    value,
  );

/** Tap a tile (radio/checkbox styled as a big button) by tapping its visible label. */
const tapChoice = (page, name, value) =>
  page.locator(`input[name="${name}"][value="${value}"] + span`).click();

const fillForm = async (page, o) => {
  await page.fill("#text", o.text);
  if (o.emotion) await tapChoice(page, "emotion", o.emotion);
  if (o.rate !== undefined) await setRange(page, "#rate", o.rate);
  await page.fill("#title", o.title ?? "");
  // Rarely needed options live under "Qoʻshimcha sozlamalar".
  await page.locator("#advanced").evaluate((d) => (d.open = true));
  if (o.format) await page.selectOption("#format", o.format);
  await page.fill("#name", o.name ?? "");
  await page.setChecked("#voice-only", o.video === false);
  for (const f of ["reels", "youtube"]) {
    if (o.video === false) break;
    const box = page.locator(`input[name="formats"][value="${f}"]`);
    const want = (o.formats ?? ["reels", "youtube"]).includes(f);
    if ((await box.isChecked()) !== want) await tapChoice(page, "formats", f);
  }
  if (o.music !== undefined) await tapChoice(page, "music", o.music);
  if (o.musicVolume !== undefined) await setRange(page, "#music-volume", o.musicVolume);
};

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 820, height: 1180 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  const request = context.request;

  await check("A1. Page loads with all controls (iPad 820px)", async () => {
    await page.goto(BASE);
    await page.waitForSelector('input[name="music"][value="ilhom"]', { state: "attached" });
    // Navoiy loads automatically when the server starts; wait until it reports ready.
    await page.waitForFunction(
      () => document.getElementById("engine-badge").textContent === "Navoiy TTS tayyor",
      null,
      { timeout: 180000, polling: 1000 },
    );
    assert.equal((await page.textContent("#submit")).trim(), "VIDEO YARATISH");
    assert.equal(await page.locator('input[name="emotion"]').count(), 10);
    assert.equal(await page.isChecked('input[name="music"][value="ilhom"]'), true);
    assert.equal(await page.isHidden("#engine-choice"), true, "no Azure key: engine choice hidden");
    assert.deepEqual(await page.$$eval('input[name="music"]', (o) => o.map((x) => x.value)), [
      "",
      "energiya",
      "ilhom",
      "tinch",
    ]);
    assert.equal(await page.locator('input[name="formats"]').count(), 2);
    assert.equal(await page.isEnabled("#submit"), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 820);
  });

  await check("A2. No horizontal overflow on a phone (390px)", async () => {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await phone.goto(BASE);
    await phone.waitForSelector('input[name="emotion"]', { state: "attached" });
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth), 390);
    await phone.close();
  });

  await check("A3. Music preview plays the selected track", async () => {
    await tapChoice(page, "music", "energiya");
    assert.match(await page.getAttribute("#music-preview", "src"), /\/music\/energiya\.mp3$/);
    const res = await request.get(`${BASE}/music/energiya.mp3`);
    assert.equal(res.status(), 200);
    assert.equal(res.headers()["content-type"], "audio/mpeg");
  });

  await check("B1. Empty text is rejected with a clear message", async () => {
    await fillForm(page, { text: "" });
    await page.click("#submit");
    await page.waitForSelector("#step.error");
    assert.match(await page.textContent("#detail"), /Matn kiriting/);
  });

  await check("B2. No video format selected is rejected", async () => {
    await fillForm(page, { text: "Salom.", formats: [] });
    await page.click("#submit");
    await page.waitForSelector("#step.error");
    assert.match(await page.textContent("#detail"), /formatini tanlang/);
  });

  await check("B3. Sample-text and clear buttons", async () => {
    await page.click("#sample");
    assert.ok((await page.inputValue("#text")).startsWith("Assalomu alaykum!"));
    await page.click("#clear");
    assert.equal(await page.inputValue("#text"), "");
    assert.equal(await page.textContent("#count"), "0 / 5000");
  });

  await check("C1. Cross-site POST without the page's header is blocked (403)", async () => {
    const res = await request.post(`${BASE}/api/jobs`, {
      headers: { "Content-Type": "application/json" },
      data: { text: "Salom." },
    });
    assert.equal(res.status(), 403);
  });

  // The B checks above trigger intended 400 responses, which the browser logs as console
  // errors. From here on, any console error is a real problem.
  consoleErrors.length = 0;

  await check("D. Full video: both formats + music + emotion + speed + MP3", async () => {
    await page.reload();
    await page.waitForSelector('input[name="music"][value="tinch"]', { state: "attached" });
    await fillForm(page, {
      text: "Assalomu alaykum! Bugun 2026-yilning eng foydali uchta odatini koʻrib chiqamiz. Birinchisi — har kuni kitob oʻqish.",
      emotion: "hayratda",
      rate: 10,
      format: "mp3",
      title: "3 ta foydali odat",
      name: "e2e-toliq",
      formats: ["reels", "youtube"],
      music: "tinch",
      musicVolume: 24,
    });
    await page.click("#submit");
    await page.waitForFunction(
      () => document.getElementById("step").textContent.includes("Ovoz"),
      null,
      { timeout: 30000 },
    );

    // E. A second job while one is running is refused (409).
    const busy = await request.post(`${BASE}/api/jobs`, {
      headers: { "Content-Type": "application/json", "X-Macademy-Generator": "1" },
      data: { text: "Salom." },
    });
    assert.equal(busy.status(), 409, "second job while busy");
    results.push({ name: "E1. Second job while busy is refused (409)", ok: true });
    console.log("✅ E1. Second job while busy is refused (409)");

    // E2. Reloading the page keeps showing the running job's progress.
    await page.reload();
    await page.waitForFunction(
      () => /Ovoz|render|Davom/.test(document.getElementById("step").textContent),
      null,
      { timeout: 30000 },
    );
    assert.equal(await page.isEnabled("#submit"), false, "button disabled while busy");
    results.push({ name: "E2. Page reload resumes progress", ok: true });
    console.log("✅ E2. Page reload resumes progress");

    await waitForFinish(page);
    assert.match(await page.textContent("#step"), /^Tayyor/, await page.textContent("#detail"));
    const hrefs = await page.$$eval("#result a.action.solid", (a) => a.map((x) => x.getAttribute("href")));
    assert.deepEqual(hrefs, [
      "/videos/e2e-toliq-reels.mp4?download",
      "/videos/e2e-toliq-youtube.mp4?download",
    ]);
    for (const h of hrefs) await checkDownload(request, h, "video/mp4");
    const audioHref = await page.getAttribute("#audio-download", "href");
    assert.equal(audioHref, "/audio/e2e-toliq.mp3?download");
    await checkDownload(request, audioHref, "audio/mpeg");

    // The videos really load in the page's player (metadata: size + duration).
    const meta = await page.$$eval("#result video", (vs) =>
      Promise.all(
        vs.map(
          (v) =>
            new Promise((resolve) => {
              const done = () => resolve({ w: v.videoWidth, h: v.videoHeight, d: v.duration });
              if (v.readyState >= 1) done();
              else v.addEventListener("loadedmetadata", done, { once: true });
              setTimeout(done, 15000);
            }),
        ),
      ),
    );
    assert.deepEqual(
      meta.map((m) => [m.w, m.h]),
      [
        [1080, 1920],
        [1920, 1080],
      ],
    );
    for (const m of meta) assert.ok(m.d > 5 && m.d < 60, `duration ${m.d}`);
    assert.match(await page.textContent("#elapsed"), /^Oʻtgan vaqt: \d+:\d\d$/);
    const shot = process.env.E2E_SCREENSHOT || "out/e2e-result.png";
    await page.screenshot({ path: shot, fullPage: true });
    // iPad landscape: form on the left, result on the right.
    await page.setViewportSize({ width: 1180, height: 820 });
    await page.locator("#result").scrollIntoViewIfNeeded();
    await page.screenshot({ path: shot.replace(/\.png$/, "-landscape.png") });
    await page.setViewportSize({ width: 820, height: 1180 });
  });

  await check("F. YouTube only, no music, WAV, calm emotion", async () => {
    await page.reload();
    await page.waitForSelector('input[name="emotion"]', { state: "attached" });
    await fillForm(page, {
      text: "Bu qisqa sinov videosi. Musiqasiz va faqat YouTube formatida.",
      emotion: "xotirjam",
      rate: 0,
      format: "wav",
      name: "e2e-youtube",
      formats: ["youtube"],
      music: "",
    });
    await page.click("#submit");
    await waitForFinish(page);
    assert.match(await page.textContent("#step"), /^Tayyor/, await page.textContent("#detail"));
    const hrefs = await page.$$eval("#result a.action.solid", (a) => a.map((x) => x.getAttribute("href")));
    assert.deepEqual(hrefs, ["/videos/e2e-youtube-youtube.mp4?download"]);
    await checkDownload(request, hrefs[0], "video/mp4");
    await checkDownload(request, "/audio/e2e-youtube.wav?download", "audio/wav");
  });

  await check("G. Voice only (no video), MP3", async () => {
    await page.reload();
    await page.waitForSelector('input[name="emotion"]', { state: "attached" });
    await fillForm(page, {
      text: "Faqat ovoz fayli kerak.",
      emotion: "mehribon",
      format: "mp3",
      name: "e2e-ovoz",
      video: false,
    });
    await page.click("#submit");
    await waitForFinish(page);
    assert.match(await page.textContent("#step"), /^Tayyor/, await page.textContent("#detail"));
    assert.equal(await page.isVisible("#audio-result"), true);
    assert.equal(await page.isVisible("#result"), false);
    await checkDownload(request, "/audio/e2e-ovoz.mp3?download", "audio/mpeg");
  });

  await check("H. Finished videos are listed with view + download links", async () => {
    await page.reload();
    await page.waitForSelector("#videos a", { state: "attached" });
    const links = await page.$$eval("#videos a", (a) => a.map((x) => x.getAttribute("href")));
    for (const n of ["e2e-toliq-reels", "e2e-toliq-youtube", "e2e-youtube-youtube"]) {
      assert.ok(links.includes(`/videos/${n}.mp4`), `view link for ${n}`);
      assert.ok(links.includes(`/videos/${n}.mp4?download`), `download link for ${n}`);
    }
  });

  await check("I. No browser console errors during the real runs (D–H)", async () => {
    assert.deepEqual(consoleErrors, []);
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})();
