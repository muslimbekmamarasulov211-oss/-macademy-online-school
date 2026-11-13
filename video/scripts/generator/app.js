// Browser side of the generator. It never sees the Azure key — it only talks to the local server.
const $ = (id) => document.getElementById(id);
const form = $("form");

$("text").addEventListener("input", () => {
  $("count").textContent = `${$("text").value.length} / 5000`;
});
$("rate").addEventListener("input", () => {
  const v = Number($("rate").value);
  $("rate-value").textContent = `${v > 0 ? "+" : ""}${v}%`;
});

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
  const res = await fetch("/api/status");
  const s = await res.json();
  $("not-configured").hidden = s.configured;
  renderVideoList(s.videos);
};

const showStep = (text, progress, detail = "", isError = false) => {
  $("status").hidden = false;
  $("step").textContent = text;
  $("step").className = isError ? "error" : "";
  $("bar").style.width = `${Math.round(progress * 100)}%`;
  $("detail").textContent = detail;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const poll = async (id) => {
  for (;;) {
    await sleep(1000);
    const job = await (await fetch(`/api/jobs/${id}`)).json();
    if (job.state === "voice") showStep("1/3 · Ovoz yaratilmoqda…", 0.05);
    if (job.state === "render") {
      const timing =
        job.timing === "word-boundary"
          ? "Subtitrlar ovozga aniq sinxronlandi."
          : "⚠ Subtitr vaqti taxminiy (soʻz vaqtlari olinmadi).";
      showStep(
        `2/3 · Video render qilinmoqda… ${Math.round(job.progress * 100)}%`,
        0.1 + job.progress * 0.9,
        timing,
      );
    }
    if (job.state === "error") return showStep("Xatolik", 0, job.error, true);
    if (job.state === "done") {
      showStep("3/3 · Tayyor ✓", 1, `${job.name}.mp4`);
      const src = `/videos/${encodeURIComponent(job.name)}.mp4`;
      $("video").src = `${src}?t=${Date.now()}`;
      $("download").href = `${src}?download`;
      $("result").hidden = false;
      return;
    }
  }
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.rate = Number(data.rate);
  $("submit").disabled = true;
  $("result").hidden = true;
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
    $("submit").disabled = false;
    refreshStatus();
  }
});

refreshStatus();
