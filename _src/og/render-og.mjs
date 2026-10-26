// 言語ごとの共有用の画像（1200×630 の JPEG）を、ひな形の HTML から Playwright で描いて assets/og/ に置く。
// ひな形はサイトの CSS（ワードマークと端末の枠）を使う。文のある言語だけ描く。
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { LOCALES } from '../lib/locales.mjs';
import { OG_IMAGE, ogImagePath, screenPath } from '../lib/assets.mjs';
import { createTextLookup, renderPhrases } from '../lib/text.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const WORK_DIRECTORY = path.join(REPOSITORY_ROOT, '_tmp', 'og');
/** _tmp/og/ からサイトの直下へ戻る相対パス。 */
const ROOT_FROM_WORK_DIRECTORY = '../../';
const JPEG_QUALITY = 85;
const PHONE_WIDTH = 300;
const HORIZONTAL_PADDING = 88;
const COLUMN_GAP = 56;
const PHONE_TOP = 64;
const WORDMARK_SIZE = 44;
const TITLE_SIZE = 66;

function renderOgHtml(locale, t) {
  return `<!doctype html>
<html lang="${locale.code}">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="${ROOT_FROM_WORK_DIRECTORY}assets/site.css">
<style>
  body { width: ${OG_IMAGE.width}px; height: ${OG_IMAGE.height}px; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) ${PHONE_WIDTH}px; align-items: center; gap: ${COLUMN_GAP}px; padding: 0 ${HORIZONTAL_PADDING}px; }
  .og__wordmark { display: inline-block; margin-bottom: 28px; font-size: ${WORDMARK_SIZE}px; }
  .og__title { font-size: ${TITLE_SIZE}px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em; }
  .og__phone { align-self: start; width: ${PHONE_WIDTH}px; margin-top: ${PHONE_TOP}px; }
</style>
</head>
<body>
<div>
<span class="wordmark og__wordmark"><span class="wordmark__oshi">Oshi </span><span class="wordmark__life">Life</span></span>
<h1 class="og__title">${renderPhrases(t('hero.headline'))}</h1>
</div>
<div class="phone og__phone"><img src="${ROOT_FROM_WORK_DIRECTORY}${screenPath(locale.code, 'home-light')}" alt=""></div>
</body>
</html>`;
}

await mkdir(WORK_DIRECTORY, { recursive: true });
const browser = await chromium.launch();
try {
  for (const locale of LOCALES) {
    const contentFile = path.join(REPOSITORY_ROOT, '_src', 'content', `${locale.code}.json`);
    if (!existsSync(contentFile)) continue;
    const t = createTextLookup(JSON.parse(await readFile(contentFile, 'utf8')));
    const htmlFile = path.join(WORK_DIRECTORY, `${locale.code}.html`);
    await writeFile(htmlFile, renderOgHtml(locale, t));
    const page = await browser.newPage({ viewport: { width: OG_IMAGE.width, height: OG_IMAGE.height } });
    await page.goto(pathToFileURL(htmlFile).href);
    await page.waitForLoadState('networkidle');
    const output = path.join(REPOSITORY_ROOT, ogImagePath(locale.code));
    await mkdir(path.dirname(output), { recursive: true });
    await page.screenshot({ path: output, type: 'jpeg', quality: JPEG_QUALITY });
    await page.close();
    console.log(path.relative(REPOSITORY_ROOT, output));
  }
} finally {
  await browser.close();
}
