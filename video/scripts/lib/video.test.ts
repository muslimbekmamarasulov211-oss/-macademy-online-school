import assert from "node:assert/strict";
import { test } from "node:test";
import { DUCK, musicVolumeAt } from "../../src/lib/music-volume";
import { pickKeyword, sentencesFromCaptions } from "../../src/lib/sentences";

const speech = [{ startMs: 2000, endMs: 5000 }];
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

test("music fades in and out", () => {
  near(musicVolumeAt(0, 10000, 0.2, []), 0);
  near(musicVolumeAt(500, 10000, 0.2, []), 0.1);
  near(musicVolumeAt(10000, 10000, 0.2, []), 0);
});

test("music is ducked while the voice speaks and comes back in pauses", () => {
  near(musicVolumeAt(1500, 10000, 0.2, speech), 0.2); // before speech
  near(musicVolumeAt(3000, 10000, 0.2, speech), 0.2 * DUCK); // speaking
  near(musicVolumeAt(6000, 10000, 0.2, speech), 0.2); // pause after speech
  assert.ok(musicVolumeAt(1850, 10000, 0.2, speech) < 0.2); // ramping down before speech
});

test("sentencesFromCaptions rebuilds sentences with timings and keywords", () => {
  const words = [
    { text: "Salom,", startMs: 0, endMs: 400 },
    { text: "doʻstlar!", startMs: 400, endMs: 900 },
    { text: "Bugun", startMs: 1200, endMs: 1500 },
    { text: "grammatikani", startMs: 1500, endMs: 2200 },
    { text: "oʻrganamiz.", startMs: 2200, endMs: 2900 },
  ];
  const s = sentencesFromCaptions([
    { text: "Salom, doʻstlar! Bugun", startMs: 0, endMs: 1500, words: words.slice(0, 3) },
    { text: "grammatikani oʻrganamiz.", startMs: 1500, endMs: 2900, words: words.slice(3) },
  ]);
  assert.deepEqual(
    s.map((x) => [x.text, x.startMs, x.endMs, x.keyword]),
    [
      ["Salom, doʻstlar!", 0, 900, "doʻstlar"],
      ["Bugun grammatikani oʻrganamiz.", 1200, 2900, "grammatikani"],
    ],
  );
});

test("pickKeyword falls back to the first word for very short sentences", () => {
  assert.equal(pickKeyword(["Ha", "va"]), "Ha");
});
