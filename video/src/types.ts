/** One subtitle line. Times are in milliseconds from the start of the video. */
export type Caption = {
  text: string;
  startMs: number;
  endMs: number;
};
