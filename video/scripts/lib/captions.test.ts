import assert from "node:assert/strict";
import { test } from "node:test";
import {
  alignWords,
  estimateWords,
  groupIntoCaptions,
  wordsFromSentenceSegments,
  type Boundary,
} from "./captions";
import { splitSentences, toDisplayText, toSpeechText } from "./uzbek-text";

test("toDisplayText uses ʻ after o/g and ʼ elsewhere", () => {
  assert.equal(toDisplayText("O'zbek g`alaba ta'lim sun’iy"), "Oʻzbek gʻalaba taʼlim sunʼiy");
});

test("toSpeechText keeps the same length so positions line up", () => {
  const d = toDisplayText("oʻqituvchi taʼlim");
  assert.equal(toSpeechText(d), "o'qituvchi ta'lim");
  assert.equal(toSpeechText(d).length, d.length);
});

const b = (text: string, startMs: number, endMs: number): Boundary => ({ text, startMs, endMs });

test("alignWords matches words with punctuation and apostrophes", () => {
  const words = alignWords(
    ["Salom,", "oʻzbek", "doʻstlar!", "—", "rahmat."],
    [b("Salom", 0, 400), b("o'zbek", 500, 900), b("do'stlar", 950, 1500), b("rahmat", 1800, 2300)],
  );
  assert.deepEqual(words, [
    { text: "Salom,", startMs: 0, endMs: 400 },
    { text: "oʻzbek", startMs: 500, endMs: 900 },
    { text: "doʻstlar!", startMs: 950, endMs: 1500 },
    { text: "—", startMs: 1500, endMs: 1500 },
    { text: "rahmat.", startMs: 1800, endMs: 2300 },
  ]);
});

test("alignWords joins several TTS words into one display word", () => {
  const words = alignWords(["2026-yil"], [b("2026", 0, 700), b("yil", 700, 1000)]);
  assert.deepEqual(words, [{ text: "2026-yil", startMs: 0, endMs: 1000 }]);
});

test("alignWords returns null when the texts do not match", () => {
  assert.equal(alignWords(["2026"], [b("ikki", 0, 300), b("ming", 300, 600)]), null);
});

test("estimateWords covers the full duration in order", () => {
  const w = estimateWords(["a", "bbbb", "cc"], 1000);
  assert.equal(w[0].startMs, 0);
  assert.equal(w[2].endMs, 1000);
  assert.ok(w[1].startMs < w[2].startMs);
});

test("groupIntoCaptions breaks at sentence ends and keeps lines short", () => {
  const words = "Assalomu alaykum! M.ACADEMY onlayn maktabiga xush kelibsiz va bugun boshlaymiz."
    .split(" ")
    .map((text, i) => ({ text, startMs: i * 400, endMs: i * 400 + 350 }));
  const caps = groupIntoCaptions(words);
  assert.equal(caps[0].text, "Assalomu alaykum!");
  for (const c of caps) {
    assert.ok(c.words!.length <= 5);
    assert.ok(c.startMs < c.endMs);
  }
  assert.equal(caps.map((c) => c.text).join(" "), words.map((w) => w.text).join(" "));
});

test("splitSentences splits on sentence ends and keeps punctuation", () => {
  assert.deepEqual(splitSentences("Salom! Bugun dars bor.\nSiz tayyormisiz?"), [
    "Salom!",
    "Bugun dars bor.",
    "Siz tayyormisiz?",
  ]);
  assert.deepEqual(splitSentences("Oxirida nuqta yoʻq"), ["Oxirida nuqta yoʻq"]);
  assert.deepEqual(splitSentences("M.ACADEMY maktabi. Narx 3.5 mln."), [
    "M.ACADEMY maktabi.",
    "Narx 3.5 mln.",
  ]);
});

test("splitSentences breaks very long sentences at commas", () => {
  const long = Array.from({ length: 30 }, (_, i) => `qism${i} soʻz soʻz`).join(", ") + ".";
  const parts = splitSentences(long);
  assert.ok(parts.length > 1);
  for (const p of parts) assert.ok(p.length <= 220);
  assert.equal(parts.join(" "), long);
});

test("wordsFromSentenceSegments keeps every word inside its sentence span", () => {
  const words = wordsFromSentenceSegments(
    ["Salom dunyo!", "Yaxshi dars."],
    [
      { startMs: 0, endMs: 1000 },
      { startMs: 1250, endMs: 2500 },
    ],
  );
  assert.equal(words.length, 4);
  assert.equal(words[0].startMs, 0);
  assert.equal(words[1].endMs, 1000);
  assert.equal(words[2].startMs, 1250);
  assert.equal(words[3].endMs, 2500);
});
