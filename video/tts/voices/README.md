# Reference voices for Navoiy TTS

Navoiy TTS copies the *timbre* of a short reference recording (voice cloning).
The built-in default `namuna` is CosyVoice's sample prompt (`.navoiy/CosyVoice/asset/zero_shot_prompt.wav`).

To add your own voice:

1. Record 5–15 seconds of clear speech, no music or noise, one speaker.
2. Save it as WAV here: `tts/voices/<name>.wav` (a–z, 0–9, `-`), e.g. `tts/voices/ustoz-aziz.wav`.
3. It appears in the generator's **Namuna ovoz** list, or use `--ref ustoz-aziz` on the command line.

**Only use a recording of a person who has given permission** to clone their voice.
Recordings are personal data, so `*.wav` files in this folder are git-ignored by default.
