// 動画2（推しの色）: 図形で描いたホームが推しの色8色に順に染まり、最後にダークモードに切り替わって、ライトに戻る。
// 変わるのは推しのカード・タブの1つの点・カードの中の小さな丸・まわりの光だけ（設計書 9 節・付録 A）。
import type React from "react";
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import {
  DARK_INK,
  DARK_LIGHT_BAR,
  DARK_RAISED,
  DARK_SCREEN,
  DARK_SURFACE,
  INACTIVE_TAB,
  INK,
  LIGHT_BAR,
  ON_ACCENT,
  OSHI_SWATCHES,
  SCREEN,
  SURFACE,
} from "./palette";
import { Bar } from "./shapes";
import { CLAMP } from "./video";

/** 1色を見せる長さと、次の色へ移る長さ（秒）。 */
const SWATCH_SECONDS = 0.75;
const SWATCH_TRANSITION_SECONDS = 0.25;
/** ダークモードに入る・出る時刻（秒）。 */
const DARK_ENTER_START = 6.0;
const DARK_ENTER_END = 6.5;
const DARK_EXIT_START = 7.5;
const DARK_EXIT_END = 8.0;

const PHONE = { left: 310, top: 80, width: 460, height: 920 } as const;
const PHONE_BORDER = 16;
const PHONE_RADIUS = 72;
const ISLAND = { width: 126, height: 36, top: 18 } as const;
const SCREEN_PADDING = 28;
const CONTENT_TOP = 84;
const CARD_RADIUS = 30;
const OSHI_CARD_HEIGHT = 168;
const AVATAR_SIZE = 64;
const ACCENT_DOT_SIZE = 20;
const TAB_BAR_HEIGHT = 88;
const TAB_DOT_SIZE = 22;
const TAB_COUNT = 5;
const ACTIVE_TAB_INDEX = 0;
const GLOW_SIZE = 860;
const GLOW_OPACITY = 0.75;

/** 推しの色の移り変わりの時刻と色（各色を見せて、最後の SWATCH_TRANSITION_SECONDS で次の色へ）。 */
function createSwatchKeyframes(fps: number) {
  const frames: number[] = [];
  const colors: string[] = [];
  OSHI_SWATCHES.forEach((color, index) => {
    frames.push(index * SWATCH_SECONDS * fps, ((index + 1) * SWATCH_SECONDS - SWATCH_TRANSITION_SECONDS) * fps);
    colors.push(color, color);
  });
  // ダークモードに入るあいだに、最初の色へ戻す。
  frames.push(DARK_ENTER_END * fps);
  colors.push(OSHI_SWATCHES[0]);
  return { frames, colors };
}

export const OshiColor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const swatches = createSwatchKeyframes(fps);
  const oshiColor = interpolateColors(frame, swatches.frames, swatches.colors);
  const darkness = interpolate(
    frame,
    [DARK_ENTER_START * fps, DARK_ENTER_END * fps, DARK_EXIT_START * fps, DARK_EXIT_END * fps],
    [0, 1, 1, 0],
    CLAMP,
  );
  const screenColor = interpolateColors(darkness, [0, 1], [SCREEN, DARK_SCREEN]);
  const cardColor = interpolateColors(darkness, [0, 1], [SURFACE, DARK_SURFACE]);
  const strongBarColor = interpolateColors(darkness, [0, 1], [INK, DARK_INK]);
  const lightBarColor = interpolateColors(darkness, [0, 1], [LIGHT_BAR, DARK_LIGHT_BAR]);

  const card: React.CSSProperties = {
    backgroundColor: cardColor,
    borderRadius: CARD_RADIUS,
    padding: SCREEN_PADDING,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: DARK_SCREEN }}>
      <div
        style={{
          position: "absolute",
          left: PHONE.left + PHONE.width / 2 - GLOW_SIZE / 2,
          top: PHONE.top + PHONE.height / 2 - GLOW_SIZE / 2,
          width: GLOW_SIZE,
          height: GLOW_SIZE,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${oshiColor} 0%, transparent 62%)`,
          opacity: GLOW_OPACITY,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: PHONE.left,
          top: PHONE.top,
          width: PHONE.width,
          height: PHONE.height,
          borderRadius: PHONE_RADIUS,
          border: `${PHONE_BORDER}px solid ${DARK_RAISED}`,
          backgroundColor: screenColor,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: ISLAND.top,
            left: (PHONE.width - PHONE_BORDER * 2 - ISLAND.width) / 2,
            width: ISLAND.width,
            height: ISLAND.height,
            borderRadius: ISLAND.height / 2,
            backgroundColor: DARK_SCREEN,
          }}
        />
        <div style={{ position: "absolute", top: CONTENT_TOP, left: SCREEN_PADDING, right: SCREEN_PADDING, display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              height: OSHI_CARD_HEIGHT,
              borderRadius: CARD_RADIUS,
              backgroundColor: oshiColor,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: `0 ${SCREEN_PADDING}px`,
            }}
          >
            <div style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: "50%", backgroundColor: ON_ACCENT }} />
            <Bar width={150} height={22} color={ON_ACCENT} />
          </div>
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: ACCENT_DOT_SIZE, height: ACCENT_DOT_SIZE, borderRadius: "50%", backgroundColor: oshiColor }} />
              <Bar width={120} height={16} color={lightBarColor} />
            </div>
            <Bar width={240} height={26} color={strongBarColor} />
            <Bar width={190} height={16} color={lightBarColor} />
          </div>
          <div style={card}>
            <Bar width={210} height={20} color={strongBarColor} />
            <Bar width={150} height={16} color={lightBarColor} />
          </div>
          <div style={{ ...card, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Bar width={140} height={20} color={strongBarColor} />
            <Bar width={90} height={22} color={strongBarColor} />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: SCREEN_PADDING,
            right: SCREEN_PADDING,
            bottom: SCREEN_PADDING,
            height: TAB_BAR_HEIGHT,
            borderRadius: TAB_BAR_HEIGHT / 2,
            backgroundColor: cardColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
          }}
        >
          {Array.from({ length: TAB_COUNT }, (_, index) => (
            <div
              key={index}
              style={{
                width: TAB_DOT_SIZE,
                height: TAB_DOT_SIZE,
                borderRadius: "50%",
                backgroundColor: index === ACTIVE_TAB_INDEX ? oshiColor : INACTIVE_TAB,
              }}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
