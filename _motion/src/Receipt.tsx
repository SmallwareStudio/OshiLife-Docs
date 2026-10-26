// 撮られるレシート（文字の代わりに棒で描く）と、撮るときのカメラの枠。
import type React from "react";
import { BRAND, INK, LIGHT_BAR, SURFACE } from "./palette";
import { Bar } from "./shapes";

/** レシートの位置と大きさ（1080×1080 の中）。 */
export const RECEIPT = { left: 330, top: 210, width: 420, height: 600 } as const;
/** 品目の行の、レシートの上端からの位置。下書きのカードはここから浮き上がる。 */
export const RECEIPT_ITEM_ROW_TOPS = [176, 232] as const;
export const RECEIPT_ROW_HEIGHT = 20;

const SIDE_PADDING = 48;
const ZIGZAG_DEPTH = 18;
const ZIGZAG_TEETH = 14;
const SCAN_LIGHT_HEIGHT = 170;
const SHADOW = "drop-shadow(0 22px 40px rgba(46, 37, 52, 0.14))";

/** 下の縁をギザギザにする clip-path（レシートの切り口）。 */
function createZigzagClipPath(): string {
  const toothWidth = RECEIPT.width / ZIGZAG_TEETH;
  const points = ["0px 0px", `${RECEIPT.width}px 0px`];
  for (let index = ZIGZAG_TEETH; index >= 0; index -= 1) {
    const isDeep = index % 2 === 0;
    const y = isDeep ? RECEIPT.height : RECEIPT.height - ZIGZAG_DEPTH;
    points.push(`${index * toothWidth}px ${y}px`);
  }
  return `polygon(${points.join(", ")})`;
}

const ZIGZAG_CLIP_PATH = createZigzagClipPath();

type RowProps = {
  readonly top: number;
  readonly left: React.ReactNode;
  readonly right: React.ReactNode;
};

const Row: React.FC<RowProps> = ({ top, left, right }) => (
  <div
    style={{
      position: "absolute",
      top,
      left: SIDE_PADDING,
      right: SIDE_PADDING,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    {left}
    {right}
  </div>
);

const DashedLine: React.FC<{ readonly top: number }> = ({ top }) => (
  <div style={{ position: "absolute", top, left: SIDE_PADDING, right: SIDE_PADDING, borderTop: `3px dashed ${LIGHT_BAR}` }} />
);

type ReceiptProps = {
  readonly style?: React.CSSProperties;
  /** 撮った合図の光の帯の、レシートの上端からの位置。 */
  readonly scanLightTop: number;
  readonly scanLightOpacity: number;
};

export const Receipt: React.FC<ReceiptProps> = ({ style, scanLightTop, scanLightOpacity }) => (
  <div style={{ position: "absolute", left: RECEIPT.left, top: RECEIPT.top, width: RECEIPT.width, height: RECEIPT.height, filter: SHADOW, ...style }}>
    <div style={{ position: "absolute", inset: 0, backgroundColor: SURFACE, clipPath: ZIGZAG_CLIP_PATH, overflow: "hidden" }}>
      <Bar width={210} height={26} color={INK} style={{ position: "absolute", top: 56, left: (RECEIPT.width - 210) / 2 }} />
      <Bar width={150} height={16} color={LIGHT_BAR} style={{ position: "absolute", top: 100, left: (RECEIPT.width - 150) / 2 }} />
      <DashedLine top={142} />
      <Row top={RECEIPT_ITEM_ROW_TOPS[0]} left={<Bar width={190} height={RECEIPT_ROW_HEIGHT} color={LIGHT_BAR} />} right={<Bar width={72} height={RECEIPT_ROW_HEIGHT} color={INK} />} />
      <Row top={RECEIPT_ITEM_ROW_TOPS[1]} left={<Bar width={160} height={RECEIPT_ROW_HEIGHT} color={LIGHT_BAR} />} right={<Bar width={84} height={RECEIPT_ROW_HEIGHT} color={INK} />} />
      <DashedLine top={292} />
      <Row top={318} left={<Bar width={120} height={16} color={LIGHT_BAR} />} right={<Bar width={64} height={16} color={LIGHT_BAR} />} />
      <Row top={352} left={<Bar width={96} height={16} color={LIGHT_BAR} />} right={<Bar width={56} height={16} color={LIGHT_BAR} />} />
      <Row top={400} left={<Bar width={96} height={30} color={INK} />} right={<Bar width={124} height={30} color={INK} />} />
      <Row top={472} left={<Bar width={130} height={14} color={LIGHT_BAR} />} right={<Bar width={70} height={14} color={LIGHT_BAR} />} />
      <Row top={502} left={<Bar width={110} height={14} color={LIGHT_BAR} />} right={<Bar width={60} height={14} color={LIGHT_BAR} />} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: scanLightTop,
          height: SCAN_LIGHT_HEIGHT,
          opacity: scanLightOpacity,
          background: "linear-gradient(to bottom, rgba(232, 107, 143, 0), rgba(232, 107, 143, 0.28) 50%, rgba(232, 107, 143, 0))",
        }}
      />
    </div>
  </div>
);

const CORNER_SIZE = 86;
const CORNER_THICKNESS = 12;
const CORNER_RADIUS = 14;

type CornersProps = {
  /** レシートの縁から枠の角までの距離。 */
  readonly gap: number;
  readonly opacity: number;
};

/** レシートの四隅に寄ってくる、カメラの枠の L 字の角。 */
export const ViewfinderCorners: React.FC<CornersProps> = ({ gap, opacity }) => {
  const left = RECEIPT.left - gap;
  const top = RECEIPT.top - gap;
  const right = RECEIPT.left + RECEIPT.width + gap - CORNER_SIZE;
  const bottom = RECEIPT.top + RECEIPT.height + gap - CORNER_SIZE;
  const border = `${CORNER_THICKNESS}px solid ${BRAND}`;
  const base: React.CSSProperties = { position: "absolute", width: CORNER_SIZE, height: CORNER_SIZE, opacity };
  return (
    <>
      <div style={{ ...base, left, top, borderTop: border, borderLeft: border, borderTopLeftRadius: CORNER_RADIUS }} />
      <div style={{ ...base, left: right, top, borderTop: border, borderRight: border, borderTopRightRadius: CORNER_RADIUS }} />
      <div style={{ ...base, left, top: bottom, borderBottom: border, borderLeft: border, borderBottomLeftRadius: CORNER_RADIUS }} />
      <div style={{ ...base, left: right, top: bottom, borderBottom: border, borderRight: border, borderBottomRightRadius: CORNER_RADIUS }} />
    </>
  );
};
