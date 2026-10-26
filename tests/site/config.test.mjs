import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';

/** GitHub Pages で公開する、直下の名前。ほかの名前は _config.yml の exclude に入っていなければならない。 */
const PUBLISHED_ENTRIES = new Set(['index.html', 'assets', 'ja', 'en', 'ko', 'zh-Hans', 'zh-Hant', 'legal.css', 'privacy.html', 'terms.html']);

/** _config.yml の exclude の一覧を読む（このリポジトリの設定ファイルの単純な形だけを読む）。 */
function readExcludedEntries(configText) {
  const lines = configText.split('\n');
  const start = lines.findIndex((line) => line.trim() === 'exclude:');
  if (start === -1) return [];
  const entries = [];
  for (const line of lines.slice(start + 1)) {
    const match = line.match(/^\s+-\s+(.+?)\s*$/);
    if (!match) break;
    entries.push(match[1]);
  }
  return entries;
}

test('公開しないファイルは、すべて _config.yml の exclude に入っている', () => {
  const excluded = readExcludedEntries(readFileSync(path.join(REPOSITORY_ROOT, '_config.yml'), 'utf8'));
  // Jekyll は _ と . で始まる名前を初めから公開しない。
  const entries = readdirSync(REPOSITORY_ROOT).filter((name) => !name.startsWith('_') && !name.startsWith('.'));
  const leaked = entries.filter((name) => !PUBLISHED_ENTRIES.has(name) && !excluded.includes(name));
  assert.deepEqual(leaked, []);
});
