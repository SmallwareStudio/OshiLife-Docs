import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LOCALES, SITE_URL, findLocale } from '../../_src/lib/locales.mjs';
import { FACTS } from '../../_src/lib/facts.mjs';
import { createPageContext } from '../../_src/lib/context.mjs';
import { renderPage } from '../../_src/lib/page.mjs';
import { SECTION_IDS } from '../../_src/lib/sections.mjs';
import { renderMediaSlot } from '../../_src/lib/components.mjs';

const content = JSON.parse(readFileSync(new URL('../../_src/content/ja.json', import.meta.url), 'utf8'));
const BADGE = Object.freeze({ width: 109, height: 40 });
const VIDEO = Object.freeze({ src: 'assets/video/hero.mp4', poster: 'assets/video/hero-poster.webp', width: 1080, height: 1080 });

function createContext(code, locales = LOCALES) {
  return createPageContext({ locale: findLocale(code), locales, content, badge: BADGE });
}

function render(code, locales = LOCALES) {
  return renderPage(createContext(code, locales));
}

test('節を決めた順と id で並べる', () => {
  const ids = [...render('ja').matchAll(/<section id="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(ids, SECTION_IDS);
});

test('html の lang はその言語のコード', () => {
  assert.match(render('en'), /<html lang="en">/);
});

test('hreflang は作る言語すべてと x-default を、絶対 URL で指す', () => {
  const alternates = [...render('ko').matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((match) => [match[1], match[2]]);
  assert.deepEqual(alternates, [...LOCALES.map((locale) => [locale.code, SITE_URL + locale.directory]), ['x-default', SITE_URL]]);
});

test('作らない言語は、hreflang にも言語の切り替えにも出さない', () => {
  const html = render('ja', [findLocale('ja')]);
  assert.doesNotMatch(html, /hreflang="en"/);
  assert.doesNotMatch(html, />English</);
});

test('直下のページと言語のフォルダのページで、素材への相対パスが変わる', () => {
  assert.match(render('ja'), /href="assets\/site\.css"/);
  assert.match(render('en'), /href="\.\.\/assets\/site\.css"/);
  assert.match(render('zh-Hant'), /src="\.\.\/assets\/img\/zh-Hant\/home-light\.webp"/);
});

test('App Store へのリンクは、日本語のページだけ日本のストア', () => {
  assert.match(render('ja'), /href="https:\/\/apps\.apple\.com\/jp\/app\/oshi-life\/id6780718555"/);
  assert.doesNotMatch(render('en'), /apps\.apple\.com\/jp\//);
});

test('App Store のバッジは1ページに1つだけ', () => {
  assert.equal(render('ja').match(/class="app-store-badge"/g).length, 1);
});

test('規約とプライバシーポリシーは、その言語のページを指す', () => {
  assert.match(render('ja'), /href="ja\/terms\.html"/);
  assert.match(render('ko'), /href="\.\.\/ko\/privacy\.html"/);
});

test('数値を埋め、参照の記号を残さない', () => {
  const html = render('ja');
  assert.doesNotMatch(html, /\{[A-Za-z][\w.]*\}/);
  assert.match(html, new RegExp(`月${FACTS.free.scansPerMonth}回`));
});

test('動画が無いあいだは、動画の枠に各言語の画面を置く', () => {
  const html = render('ja');
  assert.doesNotMatch(html, /<video/);
  assert.match(html, /<figure class="media-slot media-slot--light">/);
});

test('動画があるときは、動画・静止画・一時停止のボタンを置き、最初の画面の動画だけ自動で再生する', () => {
  const context = createContext('ja');
  const eager = renderMediaSlot(context, 'hero', { theme: 'light', loading: 'eager', screens: ['home-light'], video: VIDEO });
  assert.match(eager, /<figure class="media-slot media-slot--light" data-media="autoplay">/);
  assert.match(eager, /<video [^>]*muted loop playsinline autoplay preload="auto"/);
  assert.match(eager, /<img class="media-slot__still" src="assets\/video\/hero-poster\.webp" alt=""/);
  assert.match(eager, /<button class="media-slot__toggle" type="button" hidden/);
  const lazy = renderMediaSlot(context, 'color', { theme: 'dark', loading: 'lazy', screens: ['home-mint', 'home-dark'], video: VIDEO });
  assert.match(lazy, /data-media="lazy"/);
  assert.match(lazy, /preload="none"/);
  assert.doesNotMatch(lazy, /autoplay/);
});

test('よくある質問は1問目だけ開いておく', () => {
  assert.equal(render('ja').match(/<details class="faq__item" open>/g).length, 1);
});
