// 5言語のページの設定と、ページどうしのリンクの作り方。

export const SITE_URL = 'https://smallwarestudio.github.io/OshiLife-Docs/';
export const CONTACT_FORM_URL = 'https://forms.gle/GTZoGiHJLudqfbcp8';
export const DEFAULT_LOCALE_CODE = 'ja';

const APP_STORE_URL_JAPAN = 'https://apps.apple.com/jp/app/oshi-life/id6780718555';
/** 国を指定しないリンク。開いた人の国のストアに移る。 */
const APP_STORE_URL_ANY_REGION = 'https://apps.apple.com/app/id6780718555';
const BADGE_ENDPOINT = 'https://toolbox.marketingtools.apple.com/api/badges/download-on-the-app-store/black/';
const BADGE_QUERY = '?size=250x83';

/**
 * directory: このページの置き場（直下は ''）。legalDirectory: 規約とプライバシーポリシーの置き場。
 * badgeLocale: Apple のバッジの言語。screenshotFolder: 画面の画像の元のフォルダの名前。
 * phraseSeparator: 見出しの折り返しの単位どうしのつなぎ（語を空白で区切る言語は空白、日本語と中国語は無し）。
 */
export const LOCALES = Object.freeze([
  { code: 'ja', label: '日本語', directory: '', legalDirectory: 'ja/', ogLocale: 'ja_JP', appStoreUrl: APP_STORE_URL_JAPAN, badgeLocale: 'ja-jp', screenshotFolder: 'ja', phraseSeparator: '' },
  { code: 'en', label: 'English', directory: 'en/', legalDirectory: 'en/', ogLocale: 'en_US', appStoreUrl: APP_STORE_URL_ANY_REGION, badgeLocale: 'en-us', screenshotFolder: 'en-US', phraseSeparator: ' ' },
  { code: 'ko', label: '한국어', directory: 'ko/', legalDirectory: 'ko/', ogLocale: 'ko_KR', appStoreUrl: APP_STORE_URL_ANY_REGION, badgeLocale: 'ko-kr', screenshotFolder: 'ko', phraseSeparator: ' ' },
  { code: 'zh-Hans', label: '简体中文', directory: 'zh-Hans/', legalDirectory: 'zh-Hans/', ogLocale: 'zh_CN', appStoreUrl: APP_STORE_URL_ANY_REGION, badgeLocale: 'zh-cn', screenshotFolder: 'zh-Hans', phraseSeparator: '' },
  { code: 'zh-Hant', label: '繁體中文', directory: 'zh-Hant/', legalDirectory: 'zh-Hant/', ogLocale: 'zh_TW', appStoreUrl: APP_STORE_URL_ANY_REGION, badgeLocale: 'zh-tw', screenshotFolder: 'zh-Hant', phraseSeparator: '' },
].map((locale) => Object.freeze(locale)));

export function findLocale(code) {
  const locale = LOCALES.find((candidate) => candidate.code === code);
  if (!locale) throw new Error(`知らない言語です: ${code}`);
  return locale;
}

/** ページから見た、サイトの直下への相対パス（直下のページは ''、言語のフォルダのページは '../'）。 */
export function rootPrefix(locale) {
  return locale.directory === '' ? '' : '../';
}

/** from のページから to のページへの相対リンク。 */
export function pageHref(from, to) {
  const href = rootPrefix(from) + to.directory;
  return href === '' ? './' : href;
}

export function absolutePageUrl(locale) {
  return SITE_URL + locale.directory;
}

export function badgeDownloadUrl(locale) {
  return `${BADGE_ENDPOINT}${locale.badgeLocale}${BADGE_QUERY}`;
}
