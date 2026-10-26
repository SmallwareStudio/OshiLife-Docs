// verify のフェーズ4。生成したページから App Store とお問い合わせのリンクを集め、生きているかを確かめる（ネットワークが要る）。
// hreflang などの公開の URL は、公開する前は旧 LP のままなので見ない。
// 429（問い合わせが多すぎる）は、待って問い合わせ直す。それでも 429 なら、リンク切れとは決めずに「確かめられない」と出す。
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { LOCALES } from '../../_src/lib/locales.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const CHECKED_LINK_PATTERN = /\shref="(https:\/\/(?:apps\.apple\.com|forms\.gle)\/[^"]*)"/g;
const LAST_SUCCESS_STATUS = 399;
const TOO_MANY_REQUESTS_STATUS = 429;
const MAXIMUM_ATTEMPTS = 3;
const MILLISECONDS_PER_SECOND = 1000;
const DEFAULT_RETRY_SECONDS = 10;
const MAXIMUM_RETRY_SECONDS = 30;

function readRetrySeconds(response) {
  const seconds = Number(response.headers.get('retry-after'));
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, MAXIMUM_RETRY_SECONDS) : DEFAULT_RETRY_SECONDS;
}

async function fetchStatus(url) {
  let response;
  for (let attempt = 1; attempt <= MAXIMUM_ATTEMPTS; attempt += 1) {
    response = await fetch(url, { redirect: 'follow' });
    if (response.status !== TOO_MANY_REQUESTS_STATUS || attempt === MAXIMUM_ATTEMPTS) break;
    await wait(readRetrySeconds(response) * MILLISECONDS_PER_SECOND);
  }
  return response.status;
}

const urls = new Set();
for (const locale of LOCALES) {
  const pageFile = path.join(REPOSITORY_ROOT, locale.directory, 'index.html');
  if (!existsSync(pageFile)) continue;
  for (const match of readFileSync(pageFile, 'utf8').matchAll(CHECKED_LINK_PATTERN)) urls.add(match[1]);
}

let hasFailure = false;
for (const url of urls) {
  const status = await fetchStatus(url);
  if (status === TOO_MANY_REQUESTS_STATUS) {
    console.log(`確かめられない ${status} ${url}（問い合わせが多すぎると断られた。時間をおいて流し直す）`);
    continue;
  }
  const isAlive = status <= LAST_SUCCESS_STATUS;
  console.log(`${isAlive ? 'OK' : 'NG'} ${status} ${url}`);
  if (!isAlive) hasFailure = true;
}
if (hasFailure) process.exitCode = 1;
