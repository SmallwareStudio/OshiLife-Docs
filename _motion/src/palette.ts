// 動画の色。LP とアプリのコードの値と同じにする（設計書 8 節・付録 A）。
// 地の色は LP の動画の枠の地と同じなので、変えると枠との境目が見える。

export const SCREEN = "#FBF6F8";
export const DARK_SCREEN = "#141116";
export const SURFACE = "#FFFFFF";
export const DARK_SURFACE = "#1E1A21";
export const DARK_RAISED = "#28232C";
export const INK = "#2E2534";
export const DARK_INK = "#F4EEF6";
export const LIGHT_BAR = "#DDD3DC";
export const DARK_LIGHT_BAR = "#3A3340";
export const INACTIVE_TAB = "#C9BFD0";
export const BRAND = "#E86B8F";
export const GOODS = "#9B7DE0";
export const ON_ACCENT = "#FFFFFF";
export const READABLE_BRAND_GRADIENT = "linear-gradient(135deg, #B15C73 0%, #BA5673 50%, #7A69C6 100%)";

/** 推しの色の見本8色（アプリの OshiColorSwatches.hexes と同じ順）。 */
export const OSHI_SWATCHES = [
  "#E86B8F",
  "#EE8B6B",
  "#DA5E9C",
  "#C264C0",
  "#9B7DE0",
  "#7B79E0",
  "#5FA8D9",
  "#5BC0A0",
] as const;
