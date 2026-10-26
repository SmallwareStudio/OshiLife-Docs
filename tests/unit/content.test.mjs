import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOCALES } from '../../_src/lib/locales.mjs';
import { fillFacts } from '../../_src/lib/facts.mjs';
import { collectStrings, readContent } from '../helpers/content.mjs';

const PLACEHOLDER_PATTERN = /\{[A-Za-z][\w.]*\}/g;
/** 文に直接書いてよい数字は 0 と 1 だけ（ほかは facts.mjs から参照する）。 */
const FORBIDDEN_NUMBER_PATTERN = /[2-9]|\d{2,}/;
/** 設計書 5 節・6 節で、誤り・言い過ぎと分かった言い回し（日本語の文）。 */
const FORBIDDEN_JAPANESE_PHRASES = Object.freeze([
  'この範囲で全機能', '全機能を使え', '無料で全機能', '数回のタップ', '手で打ち直すところがありません',
  '入力は、それで終わりです', '送られません', '当日の流れ', '多段', '色分けしたカレンダー', 'アイコンが推しの色に変わ',
]);
/** 自分の記録は「思い出」。「レポート」は共有のタイムライン「みんなのレポート」だけに使う。 */
const STRAY_REPORT_PATTERN = /(?<!みんなの)レポート/;

for (const locale of LOCALES) {
  const content = readContent(locale.code);
  if (content === null) continue;
  const strings = collectStrings(content);

  test(`${locale.code}: 文の中の参照がすべて facts にある`, () => {
    for (const { dottedPath, text } of strings) assert.doesNotThrow(() => fillFacts(text), dottedPath);
  });

  test(`${locale.code}: 数値を文に直接書いていない`, () => {
    for (const { dottedPath, text } of strings) {
      assert.doesNotMatch(text.replace(PLACEHOLDER_PATTERN, ''), FORBIDDEN_NUMBER_PATTERN, `${dottedPath}: ${text}`);
    }
  });
}

test('ja: 持ち込まない言い回しと、思い出を「レポート」と呼ぶ文が無い', () => {
  const content = readContent('ja');
  assert.ok(content, '_src/content/ja.json がありません');
  for (const { dottedPath, text } of collectStrings(content)) {
    for (const phrase of FORBIDDEN_JAPANESE_PHRASES) assert.ok(!text.includes(phrase), `${dottedPath}: 「${phrase}」`);
    assert.doesNotMatch(text, STRAY_REPORT_PATTERN, dottedPath);
  }
});
