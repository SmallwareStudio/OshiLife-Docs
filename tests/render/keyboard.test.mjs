// キーボードだけで使えるかの最小の検査: 最初の Tab で「本文へ移動」が見え、押すと本文へ移る。言語の切り替えが開ける。
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';

const PAGE_URL = pathToFileURL(path.join(REPOSITORY_ROOT, 'index.html')).href;

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

test('最初の Tab で「本文へ移動」が画面に出て、Enter で本文へ移る', async () => {
  const page = await browser.newPage();
  await page.goto(PAGE_URL);
  await page.keyboard.press('Tab');
  const skipLink = await page.evaluate(() => {
    const element = document.activeElement;
    return { className: element.className, top: element.getBoundingClientRect().top };
  });
  assert.equal(skipLink.className, 'skip-link');
  assert.ok(skipLink.top >= 0, `画面の外にある（top ${skipLink.top}）`);
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => window.location.hash), '#main');
  await page.close();
});

test('言語の切り替えをキーボードで開ける', async () => {
  const page = await browser.newPage();
  await page.goto(PAGE_URL);
  await page.locator('.language-menu summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.language-menu').getAttribute('open'), '');
  await page.close();
});
