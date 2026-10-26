// 差し込んだ本物の動画（H.264）が再生されるかを、端末の Google Chrome で確かめる
// （Playwright の Chromium は H.264 を再生できない）。動画が無いあいだは飛ばす。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';

const videos = JSON.parse(readFileSync(path.join(REPOSITORY_ROOT, '_src', 'lib', 'videos.json'), 'utf8'));
const PLAYBACK_TIMEOUT_MILLISECONDS = 8000;

test('差し込んだ最初の画面の動画が Chrome で再生される', { skip: !videos.hero && '動画がまだ無い' }, async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path.join(REPOSITORY_ROOT, 'index.html')).href);
    await page.waitForFunction(() => {
      const video = document.querySelector('[data-media="autoplay"] video');
      return Boolean(video) && !video.paused && video.currentTime > 0;
    }, undefined, { timeout: PLAYBACK_TIMEOUT_MILLISECONDS });
    assert.equal(await page.locator('[data-media="autoplay"] .media-slot__toggle').isVisible(), true);
  } finally {
    await browser.close();
  }
});
