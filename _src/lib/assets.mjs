// LP が使う画像の決まり（場所・寸法・重さの上限）。生成・素材の準備・検査が同じ値を使う。

/** 各言語のアプリの画面。元は 1320×2868 で、表示の2倍の密度に足りる幅に縮める。 */
export const SCREEN_IMAGE = Object.freeze({ width: 640, height: 1391 });

/** 各言語で用意する画面の名前（assets/img/<言語>/<名前>.webp）。 */
export const SCREENS = Object.freeze(['home-light', 'home-dark', 'home-mint', 'schedule', 'money', 'oshi', 'record']);

/** アプリのアイコン（favicon と最後の CTA）。 */
export const APP_ICON = Object.freeze({ size: 192, file: 'assets/img/common/app-icon.png' });

/** 共有用の画像（OG）。 */
export const OG_IMAGE = Object.freeze({ width: 1200, height: 630 });

const KILOBYTE = 1024;

/** ファイルの重さの上限（バイト）。表示の速さのため。 */
export const BYTE_BUDGETS = Object.freeze({
  screen: 150 * KILOBYTE,
  appIcon: 60 * KILOBYTE,
  ogImage: 300 * KILOBYTE,
  video: 1536 * KILOBYTE,
  videoPoster: 80 * KILOBYTE,
});

export function screenPath(localeCode, screen) {
  return `assets/img/${localeCode}/${screen}.webp`;
}

export function badgePath(localeCode) {
  return `assets/badges/${localeCode}.svg`;
}

export function ogImagePath(localeCode) {
  return `assets/og/${localeCode}.jpg`;
}
