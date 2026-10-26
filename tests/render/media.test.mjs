// 動画の枠の動き（site.js）を、テスト用の動画（VP9 の WebM。Playwright の Chromium で再生できる）で確かめる。
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { findLocale } from '../../_src/lib/locales.mjs';
import { createPageContext } from '../../_src/lib/context.mjs';
import { renderMediaSlot } from '../../_src/lib/components.mjs';

const FIXTURE_DIRECTORY = path.join(REPOSITORY_ROOT, '_tmp', 'fixtures');
const FIXTURE_PAGE = path.join(FIXTURE_DIRECTORY, 'media.html');
const VIDEO_SIZE = 320;
const VIDEO_SECONDS = 2;
const PLAYBACK_TIMEOUT_MILLISECONDS = 5000;
const SPACER_HEIGHT = 3000;
const VIDEO = Object.freeze({ src: 'slot.webm', poster: 'slot-poster.png', width: VIDEO_SIZE, height: VIDEO_SIZE });

function writeFixture() {
  mkdirSync(FIXTURE_DIRECTORY, { recursive: true });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `testsrc=size=${VIDEO_SIZE}x${VIDEO_SIZE}:duration=${VIDEO_SECONDS}`, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', path.join(FIXTURE_DIRECTORY, VIDEO.src)]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(FIXTURE_DIRECTORY, VIDEO.src), '-frames:v', '1', path.join(FIXTURE_DIRECTORY, VIDEO.poster)]);
  const content = JSON.parse(readFileSync(path.join(REPOSITORY_ROOT, '_src', 'content', 'ja.json'), 'utf8'));
  const context = createPageContext({ locale: findLocale('ja'), locales: [findLocale('ja')], content, badge: { width: 1, height: 1 } });
  const eager = renderMediaSlot(context, 'hero', { theme: 'light', loading: 'eager', screens: ['home-light'], video: VIDEO });
  const lazy = renderMediaSlot(context, 'color', { theme: 'dark', loading: 'lazy', screens: ['home-mint', 'home-dark'], video: VIDEO });
  writeFileSync(FIXTURE_PAGE, `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<link rel="stylesheet" href="../../assets/site.css"><script src="../../assets/site.js" defer></script></head>
<body><div id="eager">${eager}</div><div style="height: ${SPACER_HEIGHT}px"></div><div id="lazy">${lazy}</div></body></html>`);
}

const isPlaying = (selector) => {
  const video = document.querySelector(`${selector} video`);
  return Boolean(video) && !video.paused;
};

/** ボタンの表示が切り替わるのを待つ（play と pause のイベントは少し遅れて届くので、すぐには読まない）。 */
function waitForToggleState(page, selector, state) {
  return page.waitForFunction(
    ([slotSelector, expectedState]) => document.querySelector(`${slotSelector} .media-slot__toggle`)?.dataset.state === expectedState,
    [selector, state],
    { timeout: PLAYBACK_TIMEOUT_MILLISECONDS },
  );
}

let browser;
before(async () => {
  writeFixture();
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

test('最初の画面の動画は自動で再生し、ボタンで止めて再開できる', async () => {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(FIXTURE_PAGE).href);
  await page.waitForFunction(isPlaying, '#eager', { timeout: PLAYBACK_TIMEOUT_MILLISECONDS });
  const toggle = page.locator('#eager .media-slot__toggle');
  await assert.doesNotReject(toggle.waitFor({ state: 'visible', timeout: PLAYBACK_TIMEOUT_MILLISECONDS }));
  await waitForToggleState(page, '#eager', 'playing');
  await toggle.click();
  await waitForToggleState(page, '#eager', 'paused');
  assert.equal(await page.evaluate(() => document.querySelector('#eager video').paused), true);
  assert.equal(await toggle.getAttribute('aria-label'), await toggle.getAttribute('data-label-play'));
  await toggle.click();
  await waitForToggleState(page, '#eager', 'playing');
  assert.equal(await toggle.getAttribute('aria-label'), await toggle.getAttribute('data-label-pause'));
  await page.close();
});

test('画面の外の動画は、画面に入るまで再生しない', async () => {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(FIXTURE_PAGE).href);
  await page.waitForFunction(isPlaying, '#eager', { timeout: PLAYBACK_TIMEOUT_MILLISECONDS });
  assert.equal(await page.evaluate(() => document.querySelector('#lazy video').paused), true);
  await page.locator('#lazy .media-slot').scrollIntoViewIfNeeded();
  await page.waitForFunction(isPlaying, '#lazy', { timeout: PLAYBACK_TIMEOUT_MILLISECONDS });
  await page.close();
});

test('動きを減らす設定では、動画を隠して静止画を出し、ボタンも出さない', async () => {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto(pathToFileURL(FIXTURE_PAGE).href);
  await page.waitForLoadState('load');
  const state = await page.evaluate(() => {
    const slot = document.querySelector('#eager .media-slot');
    return {
      videoDisplay: getComputedStyle(slot.querySelector('video')).display,
      stillDisplay: getComputedStyle(slot.querySelector('.media-slot__still')).display,
      isToggleHidden: slot.querySelector('.media-slot__toggle').hidden,
      isVideoPaused: slot.querySelector('video').paused,
    };
  });
  assert.deepEqual(state, { videoDisplay: 'none', stillDisplay: 'block', isToggleHidden: true, isVideoPaused: true });
  await page.close();
});
