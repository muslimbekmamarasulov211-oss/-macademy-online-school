// Browser side of the video studio. It never sees any API key — it only talks to the local server.
const $ = (id) => document.getElementById(id);
const form = $("form");

const EMOTION_LABELS = {
  xotirjam: "Xotirjam",
  xursand: "Xursand",
  gamgin: "Gʻamgin",
  jahldor: "Jahldor",
  qorqqan: "Qoʻrqqan",
  hayratda: "Hayratda",
  pichirlab: "Pichirlab",
  mehribon: "Mehribon",
  charchagan: "Charchagan",
  kinoyali: "Kinoyali",
};
const MUSIC_LABELS = { "": "Musiqasiz", tinch: "Tinch", ilhom: "Ilhom", energiya: "Energiya" };
const BADGES = {
  ready: ["ready", "Navoiy TTS tayyor"],
  loading: ["loading", "Navoiy TTS yuklanmoqda…"],
  idle: ["loading", "Navoiy TTS ishga tushmoqda…"],
  error: ["error", "Navoiy TTS xatosi"],
  missing: ["error", "Navoiy TTS oʻrnatilmagan"],
};
const SAMPLE_TEXT =
  "Assalomu alaykum! Bugun ingliz tilidagi eng foydali uchta iborani oʻrganamiz. " +
  "Har kuni besh daqiqa takrorlang. Natijani bir haftada sezasiz!";

let status = null;
let statusTimer = null;
let jobRunning = false;

// ---------- small helpers ----------
const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};
const choice = (type, name, value, label, sub, checked) =>
  el("label", { className: "choice" }, [
    el("input", { type, name, value, checked }),
    el("span", {}, [label, ...(sub ? [el("small", { textContent: sub })] : [])]),
  ]);
const checkedValue = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value ?? "";
const formatTime = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// ---------- form behaviour ----------
const updateCount = () => ($("count").textContent = `${$("text").value.length} / 5000`);
$("text").addEventListener("input", updateCount);
$("sample").addEventListener("click", () => {
  $("text").value = SAMPLE_TEXT;
  updateCount();
});
$("clear").addEventListener("click", () => {
  $("text").value = "";
  updateCount();
  $("text").focus();
});
$("rate").addEventListener("input", () => {
  const v = Number($("rate").value);
  $("rate-value").textContent = v === 0 ? "odatiy" : `${v > 0 ? "+" : ""}${v}%`;
});
$("music-volume").addEventListener("input", () => {
  $("music-volume-value").textContent = `${$("music-volume").value}%`;
});
$("voice-only").addEventListener("change", () => {
  $("video-step").hidden = $("voice-only").checked;
});
form.addEventListener("change", (e) => {
  if (e.target.name === "engine") updateEngineUi();
  if (e.target.name === "music") updateMusicUi();
});

const updateMusicUi = () => {
  const id = checkedValue("music");
  $("music-preview").hidden = !id;
  $("music-volume-row").hidden = !id;
  if (id) $("music-preview").src = `/music/${encodeURIComponent(id)}.mp3`;
};

const updateEngineUi = () => {
  const engine = checkedValue("engine") || "navoiy";
  $("navoiy-options").hidden = engine !== "navoiy";
  $("azure-options").hidden = engine !== "azure";
  let warning = "";
  if (status && engine === "navoiy" && !status.navoiyInstalled) {
    warning = "Navoiy TTS oʻrnatilmagan. Claudeʼga “Navoiy TTS ni oʻrnat” deb yozing.";
  }
  $("engine-warning").textContent = warning;
  $("engine-warning").hidden = !warning;
  $("submit").disabled = Boolean(warning) || jobRunning || Boolean(status?.busy);
};

// ---------- status from the server ----------
const renderVideoList = (names) => {
  const list = $("videos");
  if (names.length === 0) {
    list.replaceChildren(el("li", { className: "hint", textContent: "Hali video yoʻq." }));
    return;
  }
  list.replaceChildren(
    ...names.map((name) => {
      const src = `/videos/${encodeURIComponent(name)}.mp4`;
      return el("li", {}, [
        el("span", { className: "name", textContent: `${name}.mp4` }),
        el("a", { href: src, target: "_blank", textContent: "Koʻrish" }),
        el("a", { href: `${src}?download`, textContent: "Yuklab olish" }),
      ]);
    }),
  );
};

const refreshStatus = async () => {
  status = await (await fetch("/api/status", { cache: "no-store" })).json();

  const [cls, text] = BADGES[status.navoiyState] ?? BADGES.error;
  $("engine-badge").className = `badge ${cls}`;
  $("engine-badge").textContent = text;
  clearTimeout(statusTimer);
  if (status.navoiyState === "loading" || status.navoiyState === "idle") {
    statusTimer = setTimeout(refreshStatus, 3000); // until the model is loaded
  }

  // Azure is only offered when its key is configured; otherwise Navoiy works automatically.
  $("engine-choice").hidden = !status.azureConfigured;

  if (!$("emotions").childElementCount) {
    $("emotions").replaceChildren(
      ...status.emotions.map((e, i) =>
        choice("radio", "emotion", e, EMOTION_LABELS[e] ?? e, "", i === 0),
      ),
    );
  }
  if (!$("music-choices").childElementCount) {
    const ids = ["", ...status.music];
    $("music-choices").replaceChildren(
      ...ids.map((m) =>
        choice(
          "radio",
          "music",
          m,
          MUSIC_LABELS[m] ?? m,
          m && !MUSIC_LABELS[m] ? "sizning faylingiz" : "",
          m === "ilhom",
        ),
      ),
    );
    if (!checkedValue("music") && !form.querySelector('input[name="music"]:checked')) {
      form.querySelector('input[name="music"]').checked = true;
    }
    updateMusicUi();
  }
  if (!$("reference").options.length) {
    $("reference").replaceChildren(
      ...status.referenceVoices.map((v) =>
        el("option", { value: v, textContent: v === "namuna" ? "Namuna (standart)" : v }),
      ),
    );
  }
  renderVideoList(status.videos);
  updateEngineUi();
};

// ---------- progress + result ----------
const showStep = (text, progress, detail = "", isError = false) => {
  $("placeholder").hidden = true;
  $("progress").hidden = false;
  $("step").textContent = text;
  $("step").className = isError ? "error" : "";
  $("bar").style.width = `${Math.round(progress * 100)}%`;
  $("detail").textContent = detail;
};

const TIMING_TEXT = {
  "word-boundary": "Subtitrlar har bir soʻzga moslandi.",
  sentence: "Subtitrlar har bir gapga moslandi.",
  estimated: "Subtitr vaqti taxminiy.",
};

/** iPad/iPhone: offer the system share sheet ("Save Video" → Photos) when it supports files. */
const addShareButton = async (container, url, fileName) => {
  if (!navigator.canShare) return;
  try {
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], fileName, { type: blob.type || "video/mp4" });
    if (!navigator.canShare({ files: [file] })) return;
    const btn = el("button", {
      type: "button",
      className: "action",
      textContent: "Rasmlarga saqlash / Ulashish",
    });
    btn.addEventListener("click", () => navigator.share({ files: [file] }).catch(() => {}));
    container.append(btn);
  } catch {
    // Sharing is optional; the download link always works.
  }
};

const showVideos = (outputs) => {
  const box = $("result");
  box.replaceChildren(
    ...outputs.map((o) => {
      const src = `/videos/${encodeURIComponent(o.file)}.mp4`;
      const actions = el("div", { className: "result-actions" }, [
        el("a", {
          className: "action solid",
          href: `${src}?download`,
          textContent: "MP4 yuklab olish",
        }),
      ]);
      void addShareButton(actions, src, `${o.file}.mp4`);
      return el("div", { className: "result-item" }, [
        el("strong", { textContent: o.label }),
        el("video", {
          src: `${src}?t=${Date.now()}`,
          controls: true,
          playsInline: true,
          preload: "metadata",
        }),
        actions,
      ]);
    }),
  );
  box.hidden = false;
};

const showAudio = (job) => {
  const ext = job.audioFile.split(".").pop();
  const src = `/audio/${encodeURIComponent(job.name)}.${ext}`;
  $("audio").src = `${src}?t=${Date.now()}`;
  $("audio-download").href = `${src}?download`;
  $("audio-download").textContent = `Ovozni yuklab olish (${ext.toUpperCase()})`;
  $("audio-result").hidden = false;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isNarrow = () => window.matchMedia("(max-width: 1099px)").matches;

const poll = async (id) => {
  for (;;) {
    await sleep(1000);
    const job = await (await fetch(`/api/jobs/${id}`, { cache: "no-store" })).json();
    $("elapsed").textContent = `Oʻtgan vaqt: ${formatTime(job.elapsedMs)}`;
    const voiceShare = job.videoRequested ? 0.5 : 1;
    if (job.state === "voice") {
      showStep(
        `1/2 · Ovoz yaratilmoqda… ${Math.round(job.voiceProgress * 100)}%`,
        0.02 + job.voiceProgress * voiceShare * 0.98,
        "Bir necha daqiqa kutib turing.",
      );
    }
    if (job.state === "render") {
      const fmt = job.renderingFormat === "youtube" ? "16:9 YouTube" : "9:16 Reels";
      showStep(
        `2/2 · Video tayyorlanmoqda (${fmt})… ${Math.round(job.progress * 100)}%`,
        0.5 + job.progress * 0.5,
        TIMING_TEXT[job.timing] ?? "",
      );
    }
    if (job.state === "error") return showStep("Xatolik", 0, job.error, true);
    if (job.state === "done") {
      showStep("Tayyor ✓", 1, TIMING_TEXT[job.timing] ?? "");
      showAudio(job);
      if (job.videoRequested) showVideos(job.outputs);
      if (isNarrow()) $("status").scrollIntoView({ behavior: "smooth" });
      return;
    }
  }
};

const runPoll = async (id) => {
  jobRunning = true;
  updateEngineUi();
  try {
    await poll(id);
  } catch (err) {
    showStep("Xatolik", 0, `Server bilan aloqa uzildi: ${err}`, true);
  } finally {
    jobRunning = false;
    await refreshStatus();
  }
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const voiceOnly = $("voice-only").checked;
  const data = {
    text: $("text").value,
    title: $("title").value,
    name: $("name").value,
    engine: checkedValue("engine") || "navoiy",
    voice: checkedValue("voice"),
    emotion: checkedValue("emotion"),
    reference: $("reference").value,
    format: $("format").value,
    rate: Number($("rate").value),
    video: !voiceOnly,
    formats: [...form.querySelectorAll('input[name="formats"]:checked')].map((x) => x.value),
    music: checkedValue("music"),
    musicVolume: Number($("music-volume").value) / 100,
  };
  $("result").hidden = true;
  $("audio-result").hidden = true;
  if (!data.text.trim()) return showStep("Xatolik", 0, "Matn kiriting.", true);
  if (data.video && data.formats.length === 0) {
    return showStep("Xatolik", 0, "Kamida bitta video formatini tanlang.", true);
  }
  $("submit").disabled = true;
  showStep("Yuborilmoqda…", 0);
  if (isNarrow()) $("status").scrollIntoView({ behavior: "smooth" });
  try {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Macademy-Generator": "1" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      showStep("Xatolik", 0, body.error, true);
      return updateEngineUi();
    }
    await runPoll(body.id);
  } catch (err) {
    showStep("Xatolik", 0, `Server bilan aloqa yoʻq: ${err}`, true);
    updateEngineUi();
  }
});

// If a video is already being made (e.g. the page was reloaded), keep showing its progress.
const start = async () => {
  await refreshStatus();
  if (status.currentJobId) {
    showStep("Davom etmoqda…", 0);
    await runPoll(status.currentJobId);
  }
};
start();
