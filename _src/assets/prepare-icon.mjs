// アプリのアイコン（1024px の PNG）を、ページで使う大きさにする。macOS の sips を使う。
// 使い方: node _src/assets/prepare-icon.mjs ~/Documents/GitHub/OshiLife/OshiLife/Assets.xcassets/AppIcon.appiconset/Icon-1024.png
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_ICON } from '../lib/assets.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const [source] = process.argv.slice(2);
if (!source) {
  console.error('使い方: node _src/assets/prepare-icon.mjs <Icon-1024.png の場所>');
  process.exit(1);
}

const output = path.join(REPOSITORY_ROOT, APP_ICON.file);
mkdirSync(path.dirname(output), { recursive: true });
execFileSync('sips', ['-z', String(APP_ICON.size), String(APP_ICON.size), source, '--out', output], { stdio: 'ignore' });
console.log(path.relative(REPOSITORY_ROOT, output));
