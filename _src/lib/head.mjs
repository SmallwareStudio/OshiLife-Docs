// <head>: 題・説明・canonical・hreflang・OG・アイコン・CSS と JS。
import { DEFAULT_LOCALE_CODE, SITE_URL, absolutePageUrl, findLocale } from './locales.mjs';
import { APP_ICON, OG_IMAGE, ogImagePath } from './assets.mjs';

/** ブラウザの枠の色（アプリの画面の地の色 NeutralPalette.screen と同じ）。 */
const THEME_COLOR = '#FBF6F8';

export function renderHead(context) {
  const { t, locale, locales, assetPrefix } = context;
  const alternates = locales.map((target) => `<link rel="alternate" hreflang="${target.code}" href="${absolutePageUrl(target)}">`);
  if (locales.some((target) => target.code === DEFAULT_LOCALE_CODE)) {
    alternates.push(`<link rel="alternate" hreflang="x-default" href="${absolutePageUrl(findLocale(DEFAULT_LOCALE_CODE))}">`);
  }
  const ogLocaleAlternates = locales
    .filter((target) => target.code !== locale.code)
    .map((target) => `<meta property="og:locale:alternate" content="${target.ogLocale}">`);
  return [
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${t('meta.title')}</title>`,
    `<meta name="description" content="${t('meta.description')}">`,
    `<link rel="canonical" href="${absolutePageUrl(locale)}">`,
    ...alternates,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Oshi Life">',
    `<meta property="og:title" content="${t('meta.ogTitle')}">`,
    `<meta property="og:description" content="${t('meta.description')}">`,
    `<meta property="og:url" content="${absolutePageUrl(locale)}">`,
    `<meta property="og:image" content="${SITE_URL}${ogImagePath(locale.code)}">`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}">`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}">`,
    `<meta property="og:image:alt" content="${t('meta.ogImageAlt')}">`,
    `<meta property="og:locale" content="${locale.ogLocale}">`,
    ...ogLocaleAlternates,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="theme-color" content="${THEME_COLOR}">`,
    `<link rel="icon" type="image/png" href="${assetPrefix}${APP_ICON.file}">`,
    `<link rel="apple-touch-icon" href="${assetPrefix}${APP_ICON.file}">`,
    `<link rel="stylesheet" href="${assetPrefix}assets/site.css">`,
    `<script src="${assetPrefix}assets/site.js" defer></script>`,
    '</head>',
  ].join('\n');
}
