import { fileURLToPath } from 'node:url';

/** リポジトリの直下の絶対パス（末尾に / が付く）。 */
export const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
