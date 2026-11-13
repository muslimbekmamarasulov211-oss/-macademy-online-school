/** npm run check-env — shows whether the Azure settings are present, never their values. */
import { checkEnvFileSafety, describeSpeechEnv } from "./lib/env";

for (const line of describeSpeechEnv()) console.log(line);
const warnings = checkEnvFileSafety(process.cwd());
for (const w of warnings) console.warn(`⚠️  ${w}`);
if (warnings.length === 0)
  console.log(
    "✅ .env safety checks passed (or no .env file — variables come from the environment).",
  );
