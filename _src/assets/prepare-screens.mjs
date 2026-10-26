// 各言語のアプリの素の画面（1320×2868 の PNG）を、Web 向けの WebP にして assets/img/<言語>/ に置く。
// 元の画像はリポジトリの外にある（product-page の場所を引数で渡す）。cwebp（Homebrew の webp）を使う。
// 使い方: node _src/assets/prepare-screens.mjs ~/Desktop/OshiLife-2.0.0-scan-assets/product-page
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES } from '../lib/locales.mjs';
import { SCREEN_IMAGE, screenPath } from '../lib/assets.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const WEBP_QUALITY = 80;
const FOLDER_PLACEHOLDER = '<folder>';

/** 画面の名前と、product-page の中の元の画像。02 の合成画像（App Store の宣伝用）は使わない。 */
const SCREEN_SOURCES = Object.freeze({
  'home-light': `asc-backup-2026-10-25/${FOLDER_PLACEHOLDER}/01_01-home-light.png`,
  'home-dark': `asc-backup-2026-10-25/${FOLDER_PLACEHOLDER}/02_02-home-dark.png`,
  'home-mint': `asc-backup-2026-10-25/${FOLDER_PLACEHOLDER}/03_03-home-mint-light.png`,
  schedule: `asc-backup-2026-10-25/${FOLDER_PLACEHOLDER}/04_04-schedule-light.png`,
  money: `asc-backup-2026-10-25/${FOLDER_PLACEHOLDER}/05_05-money-light.png`,
  oshi: `asc-backup-2026-10-25/${FOLDER_PLACEHOLDER}/07_07-oshi-light.png`,
  record: `08-record-${FOLDER_PLACEHOLDER}.png`,
});

const [sourceRoot] = process.argv.slice(2);
if (!sourceRoot) {
  console.error('使い方: node _src/assets/prepare-screens.mjs <product-page の場所>');
  process.exit(1);
}

for (const locale of LOCALES) {
  for (const [screen, sourcePattern] of Object.entries(SCREEN_SOURCES)) {
    const source = path.join(sourceRoot, sourcePattern.replaceAll(FOLDER_PLACEHOLDER, locale.screenshotFolder));
    if (!existsSync(source)) throw new Error(`元の画像がありません: ${source}`);
    const output = path.join(REPOSITORY_ROOT, screenPath(locale.code, screen));
    mkdirSync(path.dirname(output), { recursive: true });
    execFileSync('cwebp', ['-quiet', '-q', String(WEBP_QUALITY), '-resize', String(SCREEN_IMAGE.width), String(SCREEN_IMAGE.height), source, '-o', output]);
    console.log(path.relative(REPOSITORY_ROOT, output));
  }
}
