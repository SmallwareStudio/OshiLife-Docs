// 文字を入れない動画の部品。品名や金額は棒で、カテゴリは色とアイコンの札で表す（5言語で同じ動画を使うため）。
import type React from "react";

type BarProps = {
  readonly width: number;
  readonly height: number;
  readonly color: string;
  readonly style?: React.CSSProperties;
};

/** 文字の代わりの、角の丸い棒。 */
export const Bar: React.FC<BarProps> = ({ width, height, color, style }) => (
  <div style={{ width, height, borderRadius: height / 2, backgroundColor: color, flexShrink: 0, ...style }} />
);

type IconProps = {
  readonly size: number;
  readonly color: string;
};

/** 手さげ袋の形（グッズ）。 */
export const BagIcon: React.FC<IconProps> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 8.5h14l-1.3 11.5H6.3L5 8.5z" fill={color} />
    <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </svg>
);

/** 硬貨の形（支出）。 */
export const CoinIcon: React.FC<IconProps> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={2.4} />
    <path d="M12 7.6v8.8M9.6 10h4.8" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </svg>
);

/** チェックの印。 */
export const CheckIcon: React.FC<IconProps> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type ChipProps = {
  readonly size: number;
  readonly background: string;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/** 丸い札。中にアイコンを置く。 */
export const Chip: React.FC<ChipProps> = ({ size, background, children, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      ...style,
    }}
  >
    {children}
  </div>
);
