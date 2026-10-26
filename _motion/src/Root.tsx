import type React from "react";
import { Composition } from "remotion";
import { Hero } from "./Hero";
import { OshiColor } from "./OshiColor";
import { FRAMES_PER_SECOND, LOOP_FRAMES, VIDEO_SIZE } from "./video";

/** LP の動画2本。どちらも 1080×1080・8秒で繰り返す（設計書 9 節）。 */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Hero" component={Hero} durationInFrames={LOOP_FRAMES} fps={FRAMES_PER_SECOND} width={VIDEO_SIZE} height={VIDEO_SIZE} />
    <Composition id="OshiColor" component={OshiColor} durationInFrames={LOOP_FRAMES} fps={FRAMES_PER_SECOND} width={VIDEO_SIZE} height={VIDEO_SIZE} />
  </>
);
