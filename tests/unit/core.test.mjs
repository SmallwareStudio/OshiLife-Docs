import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTS, fillFacts } from '../../_src/lib/facts.mjs';
import { escapeHtml } from '../../_src/lib/escape.mjs';
import { SITE_URL, absolutePageUrl, findLocale, pageHref, rootPrefix } from '../../_src/lib/locales.mjs';
import { describeShape, findShapeDifferences } from '../../_src/lib/content.mjs';
import { createTextLookup, renderPhrases } from '../../_src/lib/text.mjs';

test('文の中の参照を数値に置き換える', () => {
  assert.equal(fillFacts('推し{free.oshi}人・iOS {minimumIOSVersion}'), `推し${FACTS.free.oshi}人・iOS ${FACTS.minimumIOSVersion}`);
});

test('見つからない参照は例外にする', () => {
  assert.throws(() => fillFacts('{free.unknown}'), /free\.unknown/);
});

test('参照の無い文はそのまま返す', () => {
  assert.equal(fillFacts('撮って記録'), '撮って記録');
});

test('HTML の特別な文字をエスケープする', () => {
  assert.equal(escapeHtml(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
});

test('ページどうしの相対リンク', () => {
  const japanese = findLocale('ja');
  const english = findLocale('en');
  const korean = findLocale('ko');
  assert.equal(pageHref(japanese, english), 'en/');
  assert.equal(pageHref(english, japanese), '../');
  assert.equal(pageHref(english, korean), '../ko/');
  assert.equal(pageHref(japanese, japanese), './');
});

test('素材への相対パスの頭は、直下のページだけ空', () => {
  assert.equal(rootPrefix(findLocale('ja')), '');
  assert.equal(rootPrefix(findLocale('zh-Hans')), '../');
});

test('公開の URL', () => {
  assert.equal(absolutePageUrl(findLocale('ja')), SITE_URL);
  assert.equal(absolutePageUrl(findLocale('en')), `${SITE_URL}en/`);
});

test('知らない言語は例外にする', () => {
  assert.throws(() => findLocale('fr'), /fr/);
});

test('同じ形の文なら、違いは無い', () => {
  const content = { hero: { title: 'あ', items: ['い', 'う'] } };
  assert.deepEqual(findShapeDifferences(content, structuredClone(content)), { missing: [], extra: [] });
});

test('足りないキーと余分なキーを挙げる', () => {
  assert.deepEqual(findShapeDifferences({ a: 'x', b: 'y' }, { a: 'x', c: 'z' }), { missing: ['b'], extra: ['c'] });
});

test('配列の長さの違いも挙げる', () => {
  assert.deepEqual(findShapeDifferences({ list: ['x', 'y'] }, { list: ['x'] }), {
    missing: ['list#length=2', 'list[1]'],
    extra: ['list#length=1'],
  });
});

test('文字列でない値は例外にする', () => {
  assert.throws(() => describeShape({ count: 1 }), /count/);
});

test('文を引くと、数値を埋めてエスケープする', () => {
  const t = createTextLookup({ hero: { note: '月{free.scansPerMonth}回 <b>&' } });
  assert.equal(t('hero.note'), `月${FACTS.free.scansPerMonth}回 &lt;b&gt;&amp;`);
});

test('配列の中の文も道筋で引ける', () => {
  const t = createTextLookup({ items: [{ title: 'a' }] });
  assert.equal(t('items.0.title'), 'a');
  assert.equal(t.list('items').length, 1);
  assert.equal(t.has('items.0.tag'), false);
});

test('無い文は例外にする', () => {
  const t = createTextLookup({});
  assert.throws(() => t('hero.title'), /hero\.title/);
  assert.throws(() => t.list('items'), /items/);
});

test('見出しを改行の位置で折り返しの単位に分ける', () => {
  assert.equal(renderPhrases('撮ったら、\n下書き'), '<span class="phrase">撮ったら、</span><span class="phrase">下書き</span>');
});

test('製品名と機能名の中の空白では改行しない', () => {
  const t = createTextLookup({ note: '価格は App Store で。Oshi Life と Face ID' });
  assert.equal(t('note'), '価格は App&nbsp;Store で。Oshi&nbsp;Life と Face&nbsp;ID');
});

test('語を空白で区切る言語では、見出しの単位どうしを空白でつなぐ', () => {
  assert.equal(renderPhrases('Snap a photo,\nand the draft', ' '), '<span class="phrase">Snap a photo,</span> <span class="phrase">and the draft</span>');
  assert.equal(findLocale('en').phraseSeparator, ' ');
  assert.equal(findLocale('ko').phraseSeparator, ' ');
  assert.equal(findLocale('ja').phraseSeparator, '');
  assert.equal(findLocale('zh-Hans').phraseSeparator, '');
});
