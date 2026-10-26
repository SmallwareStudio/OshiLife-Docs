// 品目ごとの下書きのカード（グッズと支出の札つき）と、支出が加わるホームのカード。
import type React from "react";
import { BRAND, GOODS, INK, LIGHT_BAR, ON_ACCENT, READABLE_BRAND_GRADIENT, SURFACE } from "./palette";
import { BagIcon, Bar, CheckIcon, Chip, CoinIcon } from "./shapes";

/** 下書きのカードの位置と大きさ。上の位置は2枚ぶん。 */
export const DRAFT_CARD = { left: 200, width: 680, height: 150 } as const;
export const DRAFT_CARD_TOPS = [330, 510] as const;

/** ホームのカードの位置と大きさ。 */
export const HOME_CARD = { left: 200, top: 690, width: 680, height: 240 } as const;

const CARD_RADIUS = 30;
const CARD_SHADOW = "0 18px 40px rgba(46, 37, 52, 0.12)";
const CARD_PADDING = 30;
const CHIP_SIZE = 58;
const CHIP_ICON_SIZE = 32;
const CHECK_SIZE = 50;
const CHECK_ICON_SIZE = 30;
const HOME_BAND_HEIGHT = 86;
const AVATAR_SIZE = 54;
const TRACK_HEIGHT = 24;
const TRACK_WIDTH = HOME_CARD.width - CARD_PADDING * 2;

type DraftCardProps = {
  readonly top: number;
  readonly nameBarWidth: number;
  readonly amountBarWidth: number;
  /** 札（グッズ・支出）の大きさの倍率。0 で見えない。 */
  readonly goodsChipScale: number;
  readonly expenseChipScale: number;
  /** チェックの印の大きさの倍率。0 で見えない。 */
  readonly checkScale: number;
  readonly style?: React.CSSProperties;
};

export const DraftCard: React.FC<DraftCardProps> = ({
  top,
  nameBarWidth,
  amountBarWidth,
  goodsChipScale,
  expenseChipScale,
  checkScale,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: DRAFT_CARD.left,
      top,
      width: DRAFT_CARD.width,
      height: DRAFT_CARD.height,
      borderRadius: CARD_RADIUS,
      backgroundColor: SURFACE,
      boxShadow: CARD_SHADOW,
      display: "flex",
      alignItems: "center",
      gap: 24,
      padding: `0 ${CARD_PADDING}px`,
      ...style,
    }}
  >
    <Chip size={CHECK_SIZE} background={READABLE_BRAND_GRADIENT} style={{ scale: String(checkScale) }}>
      <CheckIcon size={CHECK_ICON_SIZE} color={ON_ACCENT} />
    </Chip>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Bar width={nameBarWidth} height={24} color={INK} />
      <Bar width={nameBarWidth * 0.6} height={16} color={LIGHT_BAR} />
    </div>
    <div style={{ flex: 1 }} />
    <Bar width={amountBarWidth} height={26} color={INK} />
    <div style={{ display: "flex", gap: 12 }}>
      <Chip size={CHIP_SIZE} background={GOODS} style={{ scale: String(goodsChipScale) }}>
        <BagIcon size={CHIP_ICON_SIZE} color={ON_ACCENT} />
      </Chip>
      <Chip size={CHIP_SIZE} background={BRAND} style={{ scale: String(expenseChipScale) }}>
        <CoinIcon size={CHIP_ICON_SIZE} color={ON_ACCENT} />
      </Chip>
    </div>
  </div>
);

type HomeCardProps = {
  /** 今月の支出の棒が、棒の枠のどこまで伸びているか（0〜1）。 */
  readonly spendingRatio: number;
  readonly style?: React.CSSProperties;
};

export const HomeCard: React.FC<HomeCardProps> = ({ spendingRatio, style }) => (
  <div
    style={{
      position: "absolute",
      left: HOME_CARD.left,
      top: HOME_CARD.top,
      width: HOME_CARD.width,
      height: HOME_CARD.height,
      borderRadius: CARD_RADIUS,
      backgroundColor: SURFACE,
      boxShadow: CARD_SHADOW,
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        height: HOME_BAND_HEIGHT,
        backgroundColor: BRAND,
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: `0 ${CARD_PADDING}px`,
      }}
    >
      <div style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: "50%", backgroundColor: SURFACE }} />
      <Bar width={180} height={20} color={ON_ACCENT} />
    </div>
    <div style={{ padding: `28px ${CARD_PADDING}px`, display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Bar width={170} height={18} color={LIGHT_BAR} />
        <Bar width={130} height={26} color={INK} />
      </div>
      <div style={{ position: "relative", width: TRACK_WIDTH, height: TRACK_HEIGHT }}>
        <Bar width={TRACK_WIDTH} height={TRACK_HEIGHT} color={LIGHT_BAR} />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: TRACK_WIDTH * spendingRatio,
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            background: READABLE_BRAND_GRADIENT,
          }}
        />
      </div>
    </div>
  </div>
);
