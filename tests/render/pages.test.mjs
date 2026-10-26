// verify のフェーズ3。生成したページを Chromium と WebKit（iPhone の Safari と同じ描画）の 390px と 1280px で描き、
// はみ出し・読み込みの失敗・文字のコントラストを確かめる。
// 撮った画像は _tmp/shots/ に残す（目で見て確かめるため）。当落の流れはスクロールで現れるので、撮影は「動きを減らす」設定で行う
// （動画の枠の動きは media.test.mjs が見る）。
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, webkit } from 'playwright';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { LOCALES } from '../../_src/lib/locales.mjs';
import { CONTRAST_THRESHOLDS, inspectPage } from './contrast.mjs';

const SHOTS_DIRECTORY = path.join(REPOSITORY_ROOT, '_tmp', 'shots');
const VIEWPORTS = Object.freeze([
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2 },
  { name: 'desktop', width: 1280, height: 800, deviceScaleFactor: 1 },
]);
const BROWSER_TYPES = Object.freeze([{ name: 'chromium', type: chromium }, { name: 'webkit', type: webkit }]);
const generatedLocales = LOCALES.filter((locale) => existsSync(path.join(REPOSITORY_ROOT, locale.directory, 'index.html')));

const browsers = new Map();
before(async () => {
  for (const browserType of BROWSER_TYPES) browsers.set(browserType.name, await browserType.type.launch());
  await mkdir(SHOTS_DIRECTORY, { recursive: true });
});
after(async () => {
  for (const browser of browsers.values()) await browser.close();
});

for (const browserType of BROWSER_TYPES) {
  for (const locale of generatedLocales) {
    for (const viewport of VIEWPORTS) {
      test(`${browserType.name} ${locale.code} @ ${viewport.width}px: はみ出し・読み込み・コントラスト`, async (context) => {
        const browser = browsers.get(browserType.name);
        const page = await browser.newPage({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: viewport.deviceScaleFactor,
          reducedMotion: 'reduce',
        });
        const problems = [];
        page.on('pageerror', (error) => problems.push(`スクリプトの例外: ${error.message}`));
        page.on('console', (message) => {
          if (message.type() === 'error') problems.push(`console.error: ${message.text()}`);
        });
        page.on('requestfailed', (request) => problems.push(`読み込みの失敗: ${request.url()}`));
        try {
          await page.goto(pathToFileURL(path.join(REPOSITORY_ROOT, locale.directory, 'index.html')).href);
          await page.evaluate(() => {
            for (const image of document.querySelectorAll('img[loading="lazy"]')) image.loading = 'eager';
          });
          await page.waitForLoadState('networkidle');
          await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode().catch(() => undefined))));
          const result = await page.evaluate(inspectPage, CONTRAST_THRESHOLDS);
          const shotPrefix = path.join(SHOTS_DIRECTORY, `${browserType.name}-${locale.code}-${viewport.name}`);
          await page.screenshot({ path: `${shotPrefix}-fold.png` });
          await page.screenshot({ path: `${shotPrefix}-full.png`, fullPage: true });
          for (const item of result.manualChecks) context.diagnostic(`目で確かめる: ${item}`);
          assert.equal(result.horizontalOverflow, 0, `横に ${result.horizontalOverflow}px はみ出している`);
          assert.deepEqual(result.brokenImages, [], '表示できない画像');
          assert.deepEqual(result.lowContrastTexts, [], 'コントラストの足りない文字');
          assert.deepEqual(problems, []);
        } finally {
          await page.close();
        }
      });
    }
  }
}
