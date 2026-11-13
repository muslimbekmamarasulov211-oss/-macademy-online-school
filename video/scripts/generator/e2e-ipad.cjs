/**
 * Real run through the studio page as iPad Safari (emulated in Chromium): type Uzbek text,
 * one tap on VIDEO YARATISH, preview playback, real downloads (byte-identical), the
 * "Rasmlarga saqlash / Ulashish" share sheet (Safari Web Share emulated), the refused-share
 * message and "Yangi oynada ochish". Needs a running generator: npm run e2e:ipad [out-dir]
 */
const { chromium } = require("playwright");
const crypto = require("crypto");
const fs = require("fs");
// Downloads go to a separate folder so they can be compared with the server files in out/.
const OUT =
  process.argv[2] || fs.mkdtempSync(require("path").join(require("os").tmpdir(), "e2e-ipad-"));
const VIDEO_DIR = require("path").resolve(__dirname, "../../out");
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 820, height: 1180 },
    deviceScaleFactor: 2,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    acceptDownloads: true,
  });
  // Safari-like Web Share: accepts video files and records what would go to the share sheet.
  await context.addInitScript(() => {
    window.__shared = [];
    window.__shareMode = "ok";
    navigator.canShare = (d) =>
      Array.isArray(d?.files) && d.files.every((f) => f.type === "video/mp4");
    navigator.share = async (d) => {
      if (window.__shareMode === "denied") throw new DOMException("not allowed", "NotAllowedError");
      window.__shared.push(...d.files.map((f) => ({ name: f.name, type: f.type, size: f.size })));
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(process.env.GENERATOR_URL || "http://localhost:3333");
  await page.waitForFunction(
    () => document.getElementById("engine-badge").textContent === "Navoiy TTS tayyor",
    null,
    { timeout: 240000, polling: 1000 },
  );
  log("badge:", await page.textContent("#engine-badge"));

  // 1. Type Uzbek text like a person (keyboard), choose settings by tapping.
  const text =
    "Assalomu alaykum, aziz doʻstlar! M.ACADEMY onlayn maktabida bugun yangi dars boshlanadi. " +
    "Har kuni oʻn besh daqiqa shugʻullansangiz, ingliz tilini tez oʻrganasiz. Keling, birga boshlaymiz!";
  await page.locator("#text").tap();
  await page.locator("#text").pressSequentially(text, { delay: 2 });
  await page.fill("#title", "Yangi dars boshlanadi");
  await page.locator('input[name="emotion"][value="xursand"] + span').tap();
  await page.locator('input[name="music"][value="ilhom"] + span').tap();
  log(
    "text chars:",
    (await page.inputValue("#text")).length,
    "| formats:",
    await page.$$eval('input[name="formats"]:checked', (e) => e.map((x) => x.value)),
  );
  await page.screenshot({ path: `${OUT}/ipad-1-form.png` });

  // 2–3. One tap: voice + render + MP4 export.
  const t0 = Date.now();
  await page.locator("#submit").tap();
  let last = "";
  const timer = setInterval(async () => {
    try {
      const s = await page.textContent("#step");
      const e = await page.textContent("#elapsed");
      const phase = s.replace(/\d+%/, "");
      if (phase !== last) (log(s, "|", e), (last = phase));
    } catch {}
  }, 2000);
  await page.waitForFunction(
    () => {
      const s = document.getElementById("step");
      return s.textContent.startsWith("Tayyor") || s.classList.contains("error");
    },
    null,
    { timeout: 1500000, polling: 1000 },
  );
  clearInterval(timer);
  log(
    "FINISHED:",
    await page.textContent("#step"),
    "|",
    await page.textContent("#detail"),
    "|",
    await page.textContent("#elapsed"),
    "| wall",
    Math.round((Date.now() - t0) / 1000),
    "s",
  );
  if ((await page.textContent("#step")).startsWith("Xatolik"))
    throw new Error(await page.textContent("#detail"));

  // 4. Preview: each video really plays in the page player.
  const items = page.locator("#result .result-item");
  const n = await items.count();
  for (let i = 0; i < n; i++) {
    const label = await items.nth(i).locator("strong").textContent();
    const r = await items
      .nth(i)
      .locator("video")
      .evaluate(async (v) => {
        v.muted = true;
        await v.play();
        await new Promise((res) => setTimeout(res, 2000));
        const out = {
          w: v.videoWidth,
          h: v.videoHeight,
          duration: v.duration,
          currentTime: v.currentTime,
          paused: v.paused,
        };
        v.pause();
        return out;
      });
    log("PREVIEW", label, JSON.stringify(r));
  }
  await page.locator("#result").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/ipad-2-result.png` });

  // 5a. Download through the page's button — the real browser download.
  for (let i = 0; i < n; i++) {
    const [dl] = await Promise.all([
      page.waitForEvent("download"),
      items.nth(i).locator("a.action.solid").tap(),
    ]);
    const file = `${OUT}/${dl.suggestedFilename()}`;
    await dl.saveAs(file);
    const got = fs.readFileSync(file);
    const orig = fs.readFileSync(`${VIDEO_DIR}/${dl.suggestedFilename()}`);
    log(
      "DOWNLOAD",
      dl.suggestedFilename(),
      got.length,
      "bytes | identical to server file:",
      sha(got) === sha(orig),
    );
  }

  // 5b. "Save to Photos / Share" → Safari share sheet receives the MP4.
  await page.waitForSelector("#result button.action", { timeout: 60000 });
  const shareButtons = page.locator("#result button.action");
  log("share buttons:", await shareButtons.count());
  for (let i = 0; i < (await shareButtons.count()); i++) await shareButtons.nth(i).tap();
  const shared = await page.evaluate(() => window.__shared);
  for (const f of shared) {
    const size = fs.statSync(`${VIDEO_DIR}/${f.name}`).size;
    log("SHARE SHEET got", JSON.stringify(f), "| size matches file:", f.size === size);
  }

  // 5c. If sharing is refused (e.g. embedded preview window), a clear message appears.
  await page.evaluate(() => (window.__shareMode = "denied"));
  await shareButtons.first().tap();
  const note = items.first().locator("p.hint");
  await note.waitFor({ state: "visible", timeout: 5000 });
  log("DENIED message:", await note.textContent());

  // 5d. "Open in new window" opens the MP4 itself (Safari: Share → Save Video).
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    items.first().locator('a:has-text("Yangi oynada ochish")').tap(),
  ]);
  const resp = await popup.waitForEvent("response");
  log("NEW WINDOW", popup.url(), resp.status(), resp.headers()["content-type"]);

  log("console errors:", JSON.stringify(errors));
  await browser.close();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
