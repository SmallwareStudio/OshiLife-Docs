// Apple の App Store Marketing Tools から、5言語の App Store バッジ（黒）を取って assets/badges/ に置く。
// バッジは Apple の公式のものだけを使う（自分で訳したり作り直したりしない）。
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCALES, badgeDownloadUrl } from '../lib/locales.mjs';
import { badgePath } from '../lib/assets.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));

for (const locale of LOCALES) {
  const response = await fetch(badgeDownloadUrl(locale));
  if (!response.ok) throw new Error(`${locale.code} のバッジを取れません（${response.status}）`);
  const svg = await response.text();
  if (!svg.trimStart().startsWith('<svg')) throw new Error(`${locale.code} のバッジが SVG ではありません`);
  const file = path.join(REPOSITORY_ROOT, badgePath(locale.code));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, svg);
  console.log(`${path.relative(REPOSITORY_ROOT, file)}（${svg.length} バイト）`);
}
