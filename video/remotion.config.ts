import { Config } from "@remotion/cli/config";

// Vertical H.264 MP4 that plays everywhere (iPad, Instagram, TikTok, Telegram).
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
