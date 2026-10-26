import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { collectStrings, readContent } from '../helpers/content.mjs';
import { DEFAULT_LOCALE_CODE, LOCALES } from '../../_src/lib/locales.mjs';

const glossary = JSON.parse(readFileSync(path.join(REPOSITORY_ROOT, '_src', 'i18n', 'glossary.json'), 'utf8'));
const strictTerms = glossary.terms.filter((term) => term.isStrict);
const japaneseStrings = collectStrings(readContent(DEFAULT_LOCALE_CODE));
/** 英語は文頭や文中で大文字と小文字が変わるので、区別せずに探す。 */
const CASE_INSENSITIVE_LOCALE_CODES = new Set(['en']);

for (const locale of LOCALES.filter((candidate) => candidate.code !== DEFAULT_LOCALE_CODE)) {
  const content = readContent(locale.code);
  if (content === null) continue;
  const translatedTexts = new Map(collectStrings(content).map(({ dottedPath, text }) => [dottedPath, text]));
  const isCaseInsensitive = CASE_INSENSITIVE_LOCALE_CODES.has(locale.code);

  test(`${locale.code}: アプリの画面の呼び名を、アプリと同じ訳で書いている`, () => {
    const misses = [];
    for (const term of strictTerms) {
      const expected = term.translations[locale.code];
      for (const { dottedPath, text } of japaneseStrings) {
        if (!text.includes(term.ja)) continue;
        const translated = translatedTexts.get(dottedPath) ?? '';
        const isFound = isCaseInsensitive
          ? translated.toLowerCase().includes(expected.toLowerCase())
          : translated.includes(expected);
        if (!isFound) misses.push(`${dottedPath}: 「${term.ja}」は「${expected}」`);
      }
    }
    assert.deepEqual(misses, []);
  });
}
