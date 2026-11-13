import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Server-side only. The Azure key is read from the process environment
 * (loaded from .env by `node --env-file`), never sent to the browser, never logged.
 */
export type SpeechEnv = { key: string; region: string };

const REGION_RE = /^[a-z0-9]{2,30}$/;

export const loadSpeechEnv = (): SpeechEnv => {
  const key = process.env.AZURE_SPEECH_KEY?.trim();
  const region = process.env.AZURE_SPEECH_REGION?.trim().toLowerCase();
  if (!key || key === "your-azure-speech-key") {
    throw new Error("AZURE_SPEECH_KEY is not set. See README → “Azure key setup”.");
  }
  if (!region || !REGION_RE.test(region)) {
    throw new Error('AZURE_SPEECH_REGION is missing or invalid (example: "westeurope").');
  }
  return { key, region };
};

/** Human-readable status that never reveals the key. */
export const describeSpeechEnv = (): string[] => {
  const lines: string[] = [];
  const key = process.env.AZURE_SPEECH_KEY?.trim();
  const region = process.env.AZURE_SPEECH_REGION?.trim();
  lines.push(
    `AZURE_SPEECH_KEY:    ${key && key !== "your-azure-speech-key" ? `set (${key.length} characters, hidden)` : "NOT SET"}`,
  );
  lines.push(`AZURE_SPEECH_REGION: ${region ? region : "NOT SET"}`);
  return lines;
};

/** Warn about common ways a key leaks: .env tracked by git, or readable by other users. */
export const checkEnvFileSafety = (root: string): string[] => {
  const warnings: string[] = [];
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return warnings;
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", envPath], { cwd: root, stdio: "ignore" });
    warnings.push(
      ".env is tracked by git! Run: git rm --cached .env  — then rotate the key in Azure.",
    );
  } catch {
    // Not tracked (or not a git repo) — good.
  }
  if (process.platform !== "win32" && (statSync(envPath).mode & 0o077) !== 0) {
    warnings.push(".env is readable by other users. Run: chmod 600 .env");
  }
  return warnings;
};
