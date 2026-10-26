// 2本の動画に共通の決まり。
export const VIDEO_SIZE = 1080;
export const FRAMES_PER_SECOND = 30;
export const LOOP_SECONDS = 8;
export const LOOP_FRAMES = LOOP_SECONDS * FRAMES_PER_SECOND;

/** interpolate の範囲の外では端の値で止める。 */
export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
