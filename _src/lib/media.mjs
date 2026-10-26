// 動画の枠（ヒーローと推しの色の節）に何を置くか。動画が届くまでは各言語のアプリの画面を置く（設計書 9 節）。
import VIDEOS from './videos.json' with { type: 'json' };

/**
 * theme: 枠の地の色（動画の地の色と同じにする）。
 * loading: 'eager' は最初の画面にあって自動で再生する。'lazy' は画面に入ってから再生する。
 * screens: 動画が無いあいだに置く画面。video: videos.json にあれば { src, poster, still, width, height }、無ければ null。
 */
export const MEDIA_SLOTS = Object.freeze({
  hero: Object.freeze({ theme: 'light', loading: 'eager', screens: Object.freeze(['home-light']), video: VIDEOS.hero ?? null }),
  color: Object.freeze({ theme: 'dark', loading: 'lazy', screens: Object.freeze(['home-mint', 'home-dark']), video: VIDEOS.color ?? null }),
});
