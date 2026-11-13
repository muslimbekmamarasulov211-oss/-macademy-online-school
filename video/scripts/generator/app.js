// Browser side of the generator. It never sees any API key — it only talks to the local server.
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

const MUSIC_LABELS = {
  tinch: "Tinch",
  ilhom: "Ilhom",
  energiya: "Energiya",
};

let status = null;

$("video").addEventListener("change", () => {
  $("video-options").hidden = !$("video").checked;
});
$("music-volume").addEventListener("input", () => {
  $("music-volume-value").textContent = `${$("music-volume").value}%`;
});
$("music").addEventListener("change", () => {
  const id = $("music").value;
  $("music-preview").hidden = !id;
  if (id) $("music-preview").src = `/music/${encodeURIComponent(id)}.mp3`;
});

$("text").addEventListener("input", () => {
  $("count").textContent = `${$("text").value.length} / 5000`;
});
$("rate").addEventListener("input", () => {
  const v = Number($("rate").value);
  $("rate-value").textContent = `${v > 0 ? "+" : ""}${v}%`;
});

const selectedEngine = () => form.querySelector('input[name="engine"]:checked').value;

const updateEngineUi = () => {
  const engine = selectedEngine();
  $("navoiy-options").hidden = engine !== "navoiy";
  $("azure-options").hidden = engine !== "azure";
  let warning = "";
  if (status && engine === "navoiy" && !status.navoiyInstalled) {
    warning = "Navoiy TTS oʻrnatilmagan. Terminalda: npm run navoiy:setup";
  }
  if (status && engine === "azure" && !status.azureConfigured) {
    warning = "Azure kaliti sozlanmagan (README → “Azure key setup”).";
  }
  $("engine-warning").textContent = warning;
  $("engine-warning").hidden = !warning;
  $("submit").disabled = Boolean(warning) || Boolean(status?.busy);
};
form
  .querySelectorAll('input[name="engine"]')
  .forEach((el) => el.addEventListener("change", updateEngineUi));

const fillSelect = (select, values, labels = {}) => {
  const current = select.value;
  select.replaceChildren(
    ...values.map((v) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = labels[v] ?? v;
      return o;
    }),
  );
  if (values.includes(current)) select.value = current;
};

const renderVideoList = (names) => {
  const list = $("videos");
  list.replaceChildren();
  if (names.length === 0) {
    const li = document.createElement("li");
    li.className = "hint";
    li.textContent = "Hali yoʻq";
    list.append(li);
    return;
  }
  for (const name of names) {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = `${name}.mp4 — `;
    const view = document.createElement("a");
    view.href = `/videos/${encodeURIComponent(name)}.mp4`;
    view.textContent = "Koʻrish";
    view.target = "_blank";
    const dl = document.createElement("a");
    dl.href = `/videos/${encodeURIComponent(name)}.mp4?download`;
    dl.textContent = "Yuklab olish";
    li.append(label, view, dl);
    list.append(li);
  }
};

const refreshStatus = async () => {
  status = await (await fetch("/api/status")).json();
  fillSelect($("emotion"), status.emotions, EMOTION_LABELS);
  fillSelect(
    $("reference"),
    status.referenceVoices,
    Object.fromEntries(
      status.referenceVoices.map((v) => [v, v === "namuna" ? "Namuna (standart)" : v]),
    ),
  );
  const hadMusic = $("music").options.length > 0;
  fillSelect($("music"), ["", ...status.music], { "": "Musiqasiz", ...MUSIC_LABELS });
  if (!hadMusic && status.music.includes("ilhom")) $("music").value = "ilhom";
  $("music").dispatchEvent(new Event("change"));
  $("navoiy-state").textContent = status.navoiyInstalled ? "lokal model · bepul" : "oʻrnatilmagan";
  $("azure-state").textContent = status.azureConfigured ? "bulut · tayyor" : "bulut · kalit yoʻq";
  renderVideoList(status.videos);
  updateEngineUi();
};

const showStep = (text, progress, detail = "", isError = false) => {
  $("status").hidden = false;
  $("step").textContent = text;
  $("step").className = isError ? "error" : "";
  $("bar").style.width = `${Math.round(progress * 100)}%`;
  $("detail").textContent = detail;
};

const TIMING_TEXT = {
  "word-boundary": "Subtitrlar har bir soʻzga aniq sinxronlandi.",
  sentence: "Subtitrlar har bir gapga aniq sinxronlandi.",
  estimated: "⚠ Subtitr vaqti taxminiy.",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const showAudio = (job) => {
  const ext = job.audioFile.split(".").pop();
  const src = `/audio/${encodeURIComponent(job.name)}.${ext}`;
  $("audio").src = `${src}?t=${Date.now()}`;
  $("audio-download").href = `${src}?download`;
  $("audio-download").textContent = `⬇ Ovozni yuklab olish (${ext.toUpperCase()})`;
  $("audio-result").hidden = false;
};

const showVideos = (outputs) => {
  const box = $("result");
  box.replaceChildren(
    ...outputs.flatMap((o) => {
      const src = `/videos/${encodeURIComponent(o.file)}.mp4`;
      const title = document.createElement("strong");
      title.textContent = o.label;
      title.style.display = "block";
      title.style.marginTop = "20px";
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.src = `${src}?t=${Date.now()}`;
      const link = document.createElement("a");
      link.className = "download";
      link.href = `${src}?download`;
      link.textContent = `⬇ ${o.label} MP4 ni yuklab olish`;
      return [title, video, link];
    }),
  );
  box.hidden = false;
};

const poll = async (id) => {
  for (;;) {
    await sleep(1000);
    const job = await (await fetch(`/api/jobs/${id}`)).json();
    const total = job.videoRequested ? 0.5 : 1;
    if (job.state === "voice") {
      showStep(
        `1/3 · Ovoz yaratilmoqda… ${Math.round(job.voiceProgress * 100)}%`,
        0.02 + job.voiceProgress * total * 0.98,
        "Birinchi marta model yuklanadi (≈20–60 soniya). Lokal model CPUʼda sekinroq ishlaydi.",
      );
    }
    if (job.state === "render") {
      const fmt = job.renderingFormat === "youtube" ? "16:9 YouTube" : "9:16 Reels";
      showStep(
        `2/3 · Video render qilinmoqda (${fmt})… ${Math.round(job.progress * 100)}%`,
        0.5 + job.progress * 0.5,
        TIMING_TEXT[job.timing] ?? "",
      );
    }
    if (job.state === "error") return showStep("Xatolik", 0, job.error, true);
    if (job.state === "done") {
      showStep("Tayyor ✓", 1, `${TIMING_TEXT[job.timing] ?? ""}`);
      showAudio(job);
      if (job.videoRequested) showVideos(job.outputs);
      return;
    }
  }
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const data = Object.fromEntries(fd);
  data.rate = Number(data.rate);
  data.video = $("video").checked;
  data.formats = fd.getAll("formats");
  data.music = $("music").value;
  data.musicVolume = Number($("music-volume").value) / 100;
  if (data.video && data.formats.length === 0) {
    return showStep("Xatolik", 0, "Kamida bitta video formatini tanlang.", true);
  }
  $("submit").disabled = true;
  $("result").hidden = true;
  $("audio-result").hidden = true;
  showStep("Yuborilmoqda…", 0);
  try {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Macademy-Generator": "1" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) return showStep("Xatolik", 0, body.error, true);
    await poll(body.id);
  } catch (err) {
    showStep("Xatolik", 0, String(err), true);
  } finally {
    await refreshStatus();
  }
});

// If a video is already being made (e.g. the page was reloaded), keep showing its progress.
const start = async () => {
  await refreshStatus();
  if (status.currentJobId) {
    $("submit").disabled = true;
    showStep("Davom etmoqda…", 0);
    try {
      await poll(status.currentJobId);
    } finally {
      await refreshStatus();
    }
  }
};
start();
