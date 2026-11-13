import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Brand colours, mirrored from the website's design tokens (src/app/globals.css).
export const colors = {
  ink: "#060b16",
  navy950: "#0a1222",
  navy900: "#0f1a30",
  navy800: "#172440",
  gold400: "#d4ab4f",
  gold500: "#c4953a",
  white: "#f5f3ee",
  muted: "#aab3c5",
};

export const fonts = {
  display: "Cormorant Garamond",
  sans: "Montserrat",
};

// Fonts are bundled in public/fonts (OFL licence) so rendering works offline.
// The "latin" subset already contains the Uzbek letters ʻ (U+02BB) and ʼ (U+02BC).
const LATIN =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT =
  "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";

const faces: Array<[family: string, file: string, weights: string[]]> = [
  [fonts.display, "cormorant-garamond", ["600", "700"]],
  [fonts.sans, "montserrat", ["500", "700", "800"]],
];

for (const [family, file, weights] of faces) {
  for (const weight of weights) {
    for (const [subset, unicodeRange] of [
      ["latin", LATIN],
      ["latin-ext", LATIN_EXT],
    ]) {
      loadFont({
        family,
        weight,
        unicodeRange,
        url: staticFile(`fonts/${file}-${subset}-${weight}-normal.woff2`),
      });
    }
  }
}
