import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { LOCALES, SITE_URL } from '../../_src/lib/locales.mjs';
import { BYTE_BUDGETS, OG_IMAGE, ogImagePath } from '../../_src/lib/assets.mjs';
import { readJpegSize } from '../../_src/lib/image-size.mjs';

const generatedLocales = LOCALES.filter((locale) => existsSync(path.join(REPOSITORY_ROOT, locale.directory, 'index.html')));

for (const locale of generatedLocales) {
  test(`${locale.code}: 共有用の画像があり、寸法と重さが決まりどおりで、ページが指している`, () => {
    const buffer = readFileSync(path.join(REPOSITORY_ROOT, ogImagePath(locale.code)));
    assert.deepEqual(readJpegSize(buffer), { width: OG_IMAGE.width, height: OG_IMAGE.height });
    assert.ok(buffer.length <= BYTE_BUDGETS.ogImage, `${buffer.length} バイト`);
    const html = readFileSync(path.join(REPOSITORY_ROOT, locale.directory, 'index.html'), 'utf8');
    assert.ok(html.includes(`<meta property="og:image" content="${SITE_URL}${ogImagePath(locale.code)}">`));
  });
}
