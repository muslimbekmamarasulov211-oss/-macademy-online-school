/**
 * Browser-side WAV → MP3 conversion.
 *
 * The Aisha TTS API only returns WAV, so MP3 downloads are encoded on the
 * user's device with lamejs. The encoder is loaded lazily, only when the user
 * asks for an MP3, so it never weighs on the initial page load.
 */

const MP3_KBPS = 128;
const FRAME_SAMPLES = 1152;
/** Sample rates the MP3 encoder supports. */
const MP3_SAMPLE_RATES = new Set([8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000]);

type Pcm = { channels: Int16Array[]; sampleRate: number };

function fourCC(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

/** Parses a 16-bit PCM WAV file. Returns null for any other layout. */
function parsePcm16Wav(buffer: ArrayBuffer): Pcm | null {
  const view = new DataView(buffer);
  if (view.byteLength < 12 || fourCC(view, 0) !== "RIFF" || fourCC(view, 8) !== "WAVE") {
    return null;
  }

  let format: { audioFormat: number; channels: number; sampleRate: number; bits: number } | null =
    null;
  let offset = 12;

  while (offset + 8 <= view.byteLength) {
    const id = fourCC(view, offset);
    const size = view.getUint32(offset + 4, true);
    const start = offset + 8;

    if (id === "fmt " && start + 16 <= view.byteLength) {
      format = {
        audioFormat: view.getUint16(start, true),
        channels: view.getUint16(start + 2, true),
        sampleRate: view.getUint32(start + 4, true),
        bits: view.getUint16(start + 14, true),
      };
    } else if (id === "data") {
      if (!format || format.audioFormat !== 1 || format.bits !== 16) return null;
      if (format.channels < 1 || format.channels > 2) return null;
      if (!MP3_SAMPLE_RATES.has(format.sampleRate)) return null;

      const end = Math.min(start + size, view.byteLength);
      const frames = Math.floor((end - start) / (2 * format.channels));
      const channels = Array.from({ length: format.channels }, () => new Int16Array(frames));
      for (let i = 0; i < frames; i++) {
        for (let c = 0; c < format.channels; c++) {
          channels[c][i] = view.getInt16(start + (i * format.channels + c) * 2, true);
        }
      }
      return { channels, sampleRate: format.sampleRate };
    }

    // Chunks are word-aligned.
    offset = start + size + (size % 2);
  }
  return null;
}

/** Fallback for non-PCM16 WAV: let the browser decode it at 44.1 kHz. */
async function decodeWithWebAudio(buffer: ArrayBuffer): Promise<Pcm> {
  const sampleRate = 44100;
  const context = new OfflineAudioContext(1, 1, sampleRate);
  const decoded = await context.decodeAudioData(buffer.slice(0));
  const channelCount = Math.min(decoded.numberOfChannels, 2);
  const channels = Array.from({ length: channelCount }, (_, c) => {
    const floats = decoded.getChannelData(c);
    const ints = new Int16Array(floats.length);
    for (let i = 0; i < floats.length; i++) {
      const s = Math.max(-1, Math.min(1, floats[i]));
      ints[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return ints;
  });
  return { channels, sampleRate: decoded.sampleRate };
}

export async function wavToMp3(wav: Blob): Promise<Blob> {
  const buffer = await wav.arrayBuffer();
  const pcm = parsePcm16Wav(buffer) ?? (await decodeWithWebAudio(buffer));

  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const [left, right] = pcm.channels;
  const encoder = new Mp3Encoder(pcm.channels.length, pcm.sampleRate, MP3_KBPS);

  const parts: Uint8Array[] = [];
  for (let i = 0; i < left.length; i += FRAME_SAMPLES) {
    const chunk = right
      ? encoder.encodeBuffer(
          left.subarray(i, i + FRAME_SAMPLES),
          right.subarray(i, i + FRAME_SAMPLES),
        )
      : encoder.encodeBuffer(left.subarray(i, i + FRAME_SAMPLES));
    if (chunk.length > 0) parts.push(chunk);
  }
  const tail = encoder.flush();
  if (tail.length > 0) parts.push(tail);

  return new Blob(parts as BlobPart[], { type: "audio/mpeg" });
}
