import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from './repository.mjs';

/** その言語の文（_src/content/<code>.json）。無ければ null。 */
export function readContent(code) {
  const file = path.join(REPOSITORY_ROOT, '_src', 'content', `${code}.json`);
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

/** 文を道筋つきで平らに集める（道筋は 'snap.points.0.title' の形）。 */
export function collectStrings(value, dottedPath = '') {
  if (typeof value === 'string') return [{ dottedPath, text: value }];
  if (Array.isArray(value)) return value.flatMap((item, index) => collectStrings(item, `${dottedPath}.${index}`));
  return Object.entries(value).flatMap(([key, child]) => collectStrings(child, dottedPath ? `${dottedPath}.${key}` : key));
}
