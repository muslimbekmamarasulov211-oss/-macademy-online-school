import { Config } from "@remotion/cli/config";

// Vertical H.264 MP4 that plays everywhere (iPad, Instagram, TikTok, Telegram).
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
// BT.709 limited range: correct colours on iPhone/iPad, Photos, Instagram and YouTube.
Config.setColorSpace("bt709");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
