import { useVideoConfig } from "remotion";

/** Positions and sizes for 9:16 (Reels/Shorts/TikTok) and 16:9 (YouTube). */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const isWide = width > height;
  return isWide
    ? {
        isWide,
        logo: { top: 56, size: 54 },
        keyword: { centerY: 400, size: 150, maxWidth: 1500 },
        title: { centerY: 420, size: 120, maxWidth: 1500 },
        visualizer: { centerY: 620, width: 900, height: 120 },
        subtitles: { bottom: 80, maxWidth: 1500, fontSize: 56 },
        counter: { top: 64, right: 80 },
      }
    : {
        isWide,
        logo: { top: 150, size: 76 },
        keyword: { centerY: 720, size: 140, maxWidth: 960 },
        title: { centerY: 720, size: 110, maxWidth: 940 },
        visualizer: { centerY: 1060, width: 760, height: 150 },
        subtitles: { bottom: 380, maxWidth: 940, fontSize: 64 },
        counter: { top: 160, right: 70 },
      };
};
