# Third-party components (Navoiy TTS)

Nothing below is stored in this repository; `npm run navoiy:setup` downloads it into
`video/.navoiy/` (git-ignored).

| Component | Source | Licence |
| --- | --- | --- |
| Navoiy TTS checkpoint `emotion_600h_joint.pt`, `uztts/normalize.py`, `emotions_40h.json` | https://huggingface.co/aisha-org/navoiy-tts (revision `912e6bb`) | Apache-2.0 |
| CosyVoice2 runtime | https://github.com/FunAudioLLM/CosyVoice (commit `074ca6d`) | Apache-2.0 |
| CosyVoice2-0.5B base model | https://huggingface.co/FunAudioLLM/CosyVoice2-0.5B (revision `eec1ae6`) | Apache-2.0 |

`tts/navoiy_worker.py` follows the inference flow of Navoiy's `inference.py`
(CosyVoice2 + Navoiy LLM weights + `inference_instruct2` with emotion instructions),
adapted to run on CPU, keep the model loaded between jobs and report per-sentence timings.
