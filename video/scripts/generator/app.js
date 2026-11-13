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

let status = null;

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
    const a = document.createElement("a");
    a.href = `/videos/${encodeURIComponent(name)}.mp4`;
    a.textContent = `${name}.mp4`;
    a.target = "_blank";
    li.append(a);
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
      showStep(
        `2/3 · Video render qilinmoqda… ${Math.round(job.progress * 100)}%`,
        0.5 + job.progress * 0.5,
        TIMING_TEXT[job.timing] ?? "",
      );
    }
    if (job.state === "error") return showStep("Xatolik", 0, job.error, true);
    if (job.state === "done") {
      showStep("Tayyor ✓", 1, `${TIMING_TEXT[job.timing] ?? ""}`);
      showAudio(job);
      if (job.videoRequested) {
        const src = `/videos/${encodeURIComponent(job.name)}.mp4`;
        $("player").src = `${src}?t=${Date.now()}`;
        $("download").href = `${src}?download`;
        $("result").hidden = false;
      }
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
  $("submit").disabled = true;
  $("result").hidden = true;
  $("audio-result").hidden = true;
  showStep("Yuborilmoqda…", 0);
  try {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

refreshStatus();
