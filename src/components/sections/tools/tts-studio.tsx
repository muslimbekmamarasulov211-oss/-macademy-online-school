"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  TTS_DEFAULT_MOOD,
  TTS_DEFAULT_SPEED,
  TTS_MAX_CHARS,
  TTS_MOOD_LABELS,
  TTS_MOODS,
  TTS_SPEED_MAX,
  TTS_SPEED_MIN,
  TTS_SPEED_STEP,
  type TtsErrorBody,
  type TtsMood,
  type TtsRequestBody,
} from "@/lib/tts/options";

type Result = { blob: Blob; url: string; baseName: string };

type Status =
  | { kind: "idle" }
  | { kind: "generating" }
  | { kind: "converting" }
  | { kind: "error"; message: string };

function triggerDownload(url: string, fileName: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as Partial<TtsErrorBody>;
    if (typeof body.error === "string" && body.error) return body.error;
  } catch {
    // Not JSON — fall through to the generic message.
  }
  return `Ovoz yaratib boʻlmadi (xato ${response.status}).`;
}

/** Uzbek text-to-speech tool backed by the server route `/api/tts` (Aisha AI). */
export function TtsStudio() {
  const textId = useId();
  const speedId = useId();
  const counterId = useId();

  const [text, setText] = useState("");
  const [mood, setMood] = useState<TtsMood>(TTS_DEFAULT_MOOD);
  const [speed, setSpeed] = useState(TTS_DEFAULT_SPEED);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<Result | null>(null);

  // Release blob URLs when replaced or on unmount.
  useEffect(() => {
    const previous = resultRef.current;
    resultRef.current = result;
    if (previous && previous !== result) URL.revokeObjectURL(previous.url);
  }, [result]);
  useEffect(
    () => () => {
      if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    },
    [],
  );

  const trimmedLength = text.trim().length;
  const busy = status.kind === "generating" || status.kind === "converting";
  const canGenerate = trimmedLength > 0 && text.length <= TTS_MAX_CHARS && !busy;

  async function generate() {
    if (!canGenerate) return;
    setStatus({ kind: "generating" });

    const payload: TtsRequestBody = { text: text.trim(), mood, speed };
    let response: Response;
    try {
      response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      setStatus({ kind: "error", message: "Internet aloqasini tekshirib, qayta urinib koʻring." });
      return;
    }

    if (!response.ok) {
      setStatus({ kind: "error", message: await readError(response) });
      return;
    }

    const blob = await response.blob();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
    setResult({ blob, url: URL.createObjectURL(blob), baseName: `macademy-ovoz-${stamp}` });
    setStatus({ kind: "idle" });
  }

  async function downloadMp3() {
    if (!result) return;
    setStatus({ kind: "converting" });
    try {
      const { wavToMp3 } = await import("@/lib/tts/wav-to-mp3");
      const mp3 = await wavToMp3(result.blob);
      const url = URL.createObjectURL(mp3);
      triggerDownload(url, `${result.baseName}.mp3`);
      // Give the browser a moment to start the download before releasing it.
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus({ kind: "idle" });
    } catch (error) {
      console.error("[tts] mp3 conversion failed", error);
      setStatus({
        kind: "error",
        message: "MP3 ga aylantirib boʻlmadi. WAV formatida yuklab olishingiz mumkin.",
      });
    }
  }

  const statusMessage =
    status.kind === "generating"
      ? "Ovoz yaratilmoqda…"
      : status.kind === "converting"
        ? "MP3 tayyorlanmoqda…"
        : status.kind === "error"
          ? status.message
          : result
            ? "Audio tayyor."
            : "";

  return (
    <form
      className="rounded-2xl border border-border bg-surface-raised/40 p-5 sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        void generate();
      }}
    >
      {/* Text */}
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={textId} className="text-sm font-medium text-foreground">
          Matn
        </label>
        <span
          id={counterId}
          className={cn(
            "text-xs tabular-nums",
            text.length > TTS_MAX_CHARS ? "text-red-300" : "text-subtle",
          )}
        >
          {text.length} / {TTS_MAX_CHARS}
        </span>
      </div>
      <textarea
        id={textId}
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={TTS_MAX_CHARS}
        rows={6}
        required
        aria-describedby={counterId}
        placeholder="Oʻzbekcha matnni shu yerga yozing…"
        className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-surface px-4 py-3 text-base leading-relaxed text-foreground placeholder:text-subtle focus:border-accent"
      />

      {/* Mood */}
      <fieldset className="mt-7">
        <legend className="text-sm font-medium text-foreground">Ovoz kayfiyati</legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TTS_MOODS.map((value) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-full border px-4 py-2.5 text-sm transition-colors duration-200",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gold-400",
                mood === value
                  ? "border-gold-400 bg-gold-400 text-navy-950"
                  : "border-border-strong text-muted hover:border-gold-400/60 hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name="mood"
                value={value}
                checked={mood === value}
                onChange={() => setMood(value)}
                className="sr-only"
              />
              {TTS_MOOD_LABELS[value]}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Speed */}
      <div className="mt-7">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor={speedId} className="text-sm font-medium text-foreground">
            Ovoz tezligi
          </label>
          <span className="text-sm text-accent tabular-nums">{speed.toFixed(1)}×</span>
        </div>
        <input
          id={speedId}
          type="range"
          min={TTS_SPEED_MIN}
          max={TTS_SPEED_MAX}
          step={TTS_SPEED_STEP}
          value={speed}
          onChange={(event) => setSpeed(Number(event.target.value))}
          aria-valuetext={`${speed.toFixed(1)} marta`}
          className="mt-3 w-full accent-gold-400"
        />
        <div className="mt-1 flex justify-between text-xs text-subtle">
          <span>Sekin · {TTS_SPEED_MIN}×</span>
          <button
            type="button"
            onClick={() => setSpeed(TTS_DEFAULT_SPEED)}
            className="hover:text-foreground"
          >
            Oddiy · {TTS_DEFAULT_SPEED.toFixed(1)}×
          </button>
          <span>Tez · {TTS_SPEED_MAX}×</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={!canGenerate}>
          {status.kind === "generating" ? "Yaratilmoqda…" : "Ovozga aylantirish"}
        </Button>
        <p
          role="status"
          aria-live="polite"
          className={cn("text-sm", status.kind === "error" ? "text-red-300" : "text-muted")}
        >
          {statusMessage}
        </p>
      </div>

      {result && (
        <div className="mt-8 border-t border-border pt-8">
          <audio controls src={result.url} className="w-full">
            Brauzeringiz audio pleerni qoʻllab-quvvatlamaydi.
          </audio>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => triggerDownload(result.url, `${result.baseName}.wav`)}
            >
              WAV yuklab olish
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => void downloadMp3()}>
              {status.kind === "converting" ? "MP3 tayyorlanmoqda…" : "MP3 yuklab olish"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
