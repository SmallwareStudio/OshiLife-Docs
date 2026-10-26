// 5言語のページを _src から生成する。--check のときは書き込まず、コミットされた HTML と同じかだけを確かめる（verify のフェーズ1）。
// 文の無い言語はまだ作らない（hreflang と言語の切り替えにも出さない）。日本語の文は必ず要る。
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_LOCALE_CODE, LOCALES } from './lib/locales.mjs';
import { findShapeDifferences } from './lib/content.mjs';
import { createPageContext } from './lib/context.mjs';
import { renderPage } from './lib/page.mjs';
import { readSvgSize } from './lib/image-size.mjs';
import { badgePath } from './lib/assets.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../', import.meta.url));
const CONTENT_DIRECTORY = path.join(REPOSITORY_ROOT, '_src', 'content');

async function loadContents() {
  const contents = new Map();
  for (const locale of LOCALES) {
    const file = path.join(CONTENT_DIRECTORY, `${locale.code}.json`);
    if (existsSync(file)) contents.set(locale.code, JSON.parse(await readFile(file, 'utf8')));
  }
  if (!contents.has(DEFAULT_LOCALE_CODE)) throw new Error(`日本語の文（_src/content/${DEFAULT_LOCALE_CODE}.json）がありません`);
  return contents;
}

function assertSameShape(contents) {
  const reference = contents.get(DEFAULT_LOCALE_CODE);
  for (const [code, content] of contents) {
    const { missing, extra } = findShapeDifferences(reference, content);
    if (missing.length > 0 || extra.length > 0) {
      throw new Error(`${code}.json の形が ${DEFAULT_LOCALE_CODE}.json と違います。足りない: ${missing.join(', ') || 'なし'}／余分: ${extra.join(', ') || 'なし'}`);
    }
  }
}

export async function renderAllPages() {
  const contents = await loadContents();
  assertSameShape(contents);
  const locales = LOCALES.filter((locale) => contents.has(locale.code));
  const pages = [];
  for (const locale of locales) {
    const badge = readSvgSize(await readFile(path.join(REPOSITORY_ROOT, badgePath(locale.code)), 'utf8'));
    const context = createPageContext({ locale, locales, content: contents.get(locale.code), badge });
    pages.push({ file: path.join(REPOSITORY_ROOT, locale.directory, 'index.html'), html: renderPage(context) });
  }
  return pages;
}

async function findStalePages(pages) {
  const stale = [];
  for (const page of pages) {
    const current = existsSync(page.file) ? await readFile(page.file, 'utf8') : null;
    if (current !== page.html) stale.push(path.relative(REPOSITORY_ROOT, page.file));
  }
  return stale;
}

async function main() {
  const isCheckOnly = process.argv.includes('--check');
  const pages = await renderAllPages();
  if (isCheckOnly) {
    const stale = await findStalePages(pages);
    if (stale.length > 0) {
      console.error(`生成し直しが要るページ: ${stale.join(', ')}（npm run build を実行する）`);
      process.exitCode = 1;
      return;
    }
    console.log(`生成済みのページは最新です（${pages.length} ページ）`);
    return;
  }
  for (const page of pages) {
    await mkdir(path.dirname(page.file), { recursive: true });
    await writeFile(page.file, page.html);
  }
  console.log(`${pages.length} ページを生成しました`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
