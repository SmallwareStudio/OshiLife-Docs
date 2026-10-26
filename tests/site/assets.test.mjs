import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { LOCALES } from '../../_src/lib/locales.mjs';
import { APP_ICON, BYTE_BUDGETS, SCREEN_IMAGE, SCREENS, badgePath, screenPath } from '../../_src/lib/assets.mjs';
import { readPngSize, readSvgSize, readWebpSize } from '../../_src/lib/image-size.mjs';

for (const locale of LOCALES) {
  test(`${locale.code}: Apple の App Store バッジ（SVG）がある`, () => {
    const svg = readFileSync(path.join(REPOSITORY_ROOT, badgePath(locale.code)), 'utf8');
    const size = readSvgSize(svg);
    assert.ok(size.width > 0 && size.height > 0);
    assert.match(svg, /Download_on_the_App_Store_Badge/);
  });

  test(`${locale.code}: 画面の画像がそろい、寸法と重さが決まりどおり`, () => {
    for (const screen of SCREENS) {
      const file = path.join(REPOSITORY_ROOT, screenPath(locale.code, screen));
      const buffer = readFileSync(file);
      assert.deepEqual(readWebpSize(buffer), { width: SCREEN_IMAGE.width, height: SCREEN_IMAGE.height }, file);
      assert.ok(buffer.length <= BYTE_BUDGETS.screen, `${file} が ${buffer.length} バイト`);
    }
  });
}

test('アプリのアイコンがあり、寸法と重さが決まりどおり', () => {
  const buffer = readFileSync(path.join(REPOSITORY_ROOT, APP_ICON.file));
  assert.deepEqual(readPngSize(buffer), { width: APP_ICON.size, height: APP_ICON.size });
  assert.ok(buffer.length <= BYTE_BUDGETS.appIcon, `${buffer.length} バイト`);
});
