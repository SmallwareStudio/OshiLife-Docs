// ページの中で動かす検査（page.evaluate に渡す）。inspectPage はモジュールの外の名前を使わないこと
// （関数の本体だけがブラウザに送られる）。

/** WCAG 2.2 の文字のコントラストの基準。 */
export const CONTRAST_THRESHOLDS = Object.freeze({
  normalTextRatio: 4.5,
  largeTextRatio: 3,
  largeTextSize: 24,
  largeBoldTextSize: 18.66,
  boldWeight: 700,
});

export function inspectPage(thresholds) {
  const RED_WEIGHT = 0.2126;
  const GREEN_WEIGHT = 0.7152;
  const BLUE_WEIGHT = 0.0722;
  const CHANNEL_MAXIMUM = 255;
  const LINEAR_THRESHOLD = 0.03928;
  const LINEAR_DIVISOR = 12.92;
  const GAMMA_OFFSET = 0.055;
  const GAMMA_DIVISOR = 1.055;
  const GAMMA_EXPONENT = 2.4;
  const LUMINANCE_OFFSET = 0.05;
  const DESCRIPTION_LENGTH = 24;
  const OPAQUE = 1;
  const WHITE = { red: CHANNEL_MAXIMUM, green: CHANNEL_MAXIMUM, blue: CHANNEL_MAXIMUM, alpha: OPAQUE };

  const parseColor = (value) => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const [red, green, blue, alpha = OPAQUE] = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { red, green, blue, alpha };
  };
  const toLinear = (channel) => {
    const value = channel / CHANNEL_MAXIMUM;
    return value <= LINEAR_THRESHOLD ? value / LINEAR_DIVISOR : ((value + GAMMA_OFFSET) / GAMMA_DIVISOR) ** GAMMA_EXPONENT;
  };
  const luminance = (color) => RED_WEIGHT * toLinear(color.red) + GREEN_WEIGHT * toLinear(color.green) + BLUE_WEIGHT * toLinear(color.blue);
  const composite = (top, bottom) => ({
    red: top.red * top.alpha + bottom.red * (OPAQUE - top.alpha),
    green: top.green * top.alpha + bottom.green * (OPAQUE - top.alpha),
    blue: top.blue * top.alpha + bottom.blue * (OPAQUE - top.alpha),
    alpha: OPAQUE,
  });
  const contrastRatio = (first, second) => {
    const [lighter, darker] = [luminance(first), luminance(second)].sort((left, right) => right - left);
    return (lighter + LUMINANCE_OFFSET) / (darker + LUMINANCE_OFFSET);
  };
  const describe = (element) => `<${element.tagName.toLowerCase()} class="${element.className}">「${element.textContent.trim().slice(0, DESCRIPTION_LENGTH)}」`;

  /** 文字の後ろの色を、親をたどって重ねて求める。画像やグラデーションに当たったら null（自動では決めない）。 */
  const resolveBackground = (element) => {
    const layers = [];
    for (let node = element; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.backgroundImage !== 'none') return null;
      const color = parseColor(style.backgroundColor);
      if (color && color.alpha > 0) {
        layers.push(color);
        if (color.alpha >= OPAQUE) break;
      }
    }
    return layers.reverse().reduce((bottom, top) => composite(top, bottom), WHITE);
  };

  const lowContrastTexts = [];
  const manualChecks = [];
  const checkedElements = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!node.textContent.trim() || checkedElements.has(element)) continue;
    checkedElements.add(element);
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    if (style.visibility === 'hidden' || box.width === 0 || box.height === 0 || element.closest('.visually-hidden')) continue;
    if (style.backgroundClip === 'text' || style.webkitBackgroundClip === 'text') {
      manualChecks.push(describe(element));
      continue;
    }
    const foreground = parseColor(style.color);
    const background = resolveBackground(element);
    if (!foreground || !background) {
      manualChecks.push(describe(element));
      continue;
    }
    const fontSize = parseFloat(style.fontSize);
    const isBold = Number(style.fontWeight) >= thresholds.boldWeight;
    const isLargeText = fontSize >= thresholds.largeTextSize || (isBold && fontSize >= thresholds.largeBoldTextSize);
    const minimumRatio = isLargeText ? thresholds.largeTextRatio : thresholds.normalTextRatio;
    const ratio = contrastRatio(composite(foreground, background), background);
    if (ratio < minimumRatio) lowContrastTexts.push(`${describe(element)} ${ratio.toFixed(2)}:1（${minimumRatio}:1 以上が要る）`);
  }
  const brokenImages = [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.currentSrc || image.src);
  return {
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    brokenImages,
    lowContrastTexts,
    manualChecks,
  };
}
