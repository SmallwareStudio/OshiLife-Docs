import { createTextLookup } from './text.mjs';
import { rootPrefix } from './locales.mjs';

/**
 * 1ページを描くための材料。
 * locale: その言語。locales: このビルドで作る言語（hreflang と言語の切り替えに使う）。badge: その言語のバッジの寸法。
 */
export function createPageContext({ locale, locales, content, badge }) {
  return Object.freeze({ locale, locales, badge, t: createTextLookup(content), assetPrefix: rootPrefix(locale) });
}
