import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { DEFAULT_LOCALE_CODE, LOCALES, absolutePageUrl, rootPrefix } from '../../_src/lib/locales.mjs';
import { SECTION_IDS } from '../../_src/lib/sections.mjs';
import { extractUserFacingText } from './html-text.mjs';

const EXTERNAL_REFERENCE_PATTERN = /^(?:https?:|mailto:)/;
const KANA_PATTERN = /[぀-ヿ]+/g;
const generatedLocales = LOCALES.filter((locale) => existsSync(path.join(REPOSITORY_ROOT, locale.directory, 'index.html')));

test('日本語のページが生成されている', () => {
  assert.ok(generatedLocales.some((locale) => locale.code === DEFAULT_LOCALE_CODE));
});

for (const locale of generatedLocales) {
  const pageFile = path.join(REPOSITORY_ROOT, locale.directory, 'index.html');
  const html = readFileSync(pageFile, 'utf8');

  test(`${locale.code}: lang・canonical・節の並び`, () => {
    assert.match(html, new RegExp(`<html lang="${locale.code}">`));
    assert.ok(html.includes(`<link rel="canonical" href="${absolutePageUrl(locale)}">`));
    assert.deepEqual([...html.matchAll(/<section id="([^"]+)"/g)].map((match) => match[1]), SECTION_IDS);
  });

  test(`${locale.code}: hreflang は生成したすべての言語と x-default を指す`, () => {
    const hreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(hreflangs, [...generatedLocales.map((target) => target.code), 'x-default']);
  });

  test(`${locale.code}: ページの中の参照先がすべてある`, () => {
    const references = [...html.matchAll(/\s(?:src|href|poster)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((reference) => !EXTERNAL_REFERENCE_PATTERN.test(reference));
    for (const reference of references) {
      if (reference.startsWith('#')) {
        assert.ok(html.includes(` id="${reference.slice(1)}"`), reference);
        continue;
      }
      const target = path.resolve(path.dirname(pageFile), reference);
      const file = reference.endsWith('/') ? path.join(target, 'index.html') : target;
      assert.ok(existsSync(file), `${reference} が見つからない`);
    }
  });

  test(`${locale.code}: 画像にはすべて alt がある`, () => {
    for (const tag of html.match(/<img\b[^>]*>/g) ?? []) assert.match(tag, /\salt="/, tag);
  });

  test(`${locale.code}: 外から読み込むものが無い`, () => {
    assert.doesNotMatch(html, /<(?:script|img|video|source|iframe)\b[^>]*\ssrc="https?:/);
    assert.doesNotMatch(html, /<link\b[^>]*\srel="(?:stylesheet|icon|apple-touch-icon|preload)"[^>]*\shref="https?:/);
  });

  test(`${locale.code}: App Store のバッジは1つで、App Store へのリンクはその言語の URL だけ`, () => {
    assert.equal(html.match(/class="app-store-badge"/g)?.length, 1);
    const storeLinks = [...html.matchAll(/href="(https:\/\/apps\.apple\.com\/[^"]+)"/g)].map((match) => match[1]);
    assert.ok(storeLinks.length > 0);
    assert.deepEqual([...new Set(storeLinks)], [locale.appStoreUrl]);
  });

  test(`${locale.code}: 規約とプライバシーポリシーは、その言語のページを指す`, () => {
    const legalBase = rootPrefix(locale) + locale.legalDirectory;
    assert.ok(html.includes(`href="${legalBase}terms.html"`));
    assert.ok(html.includes(`href="${legalBase}privacy.html"`));
  });

  test(`${locale.code}: 参照の記号が残っていない`, () => {
    assert.doesNotMatch(html, /\{[A-Za-z][\w.]*\}/);
  });

  if (locale.code !== DEFAULT_LOCALE_CODE) {
    test(`${locale.code}: 読み手に見える文に、かなが残っていない`, () => {
      assert.deepEqual(extractUserFacingText(html).match(KANA_PATTERN) ?? [], []);
    });
  }
}
