// 書き出した MP4（_motion の Remotion で作ったもの）を、Web 向けの H.264（音声なし・faststart・長辺 1080px 以下）と、
// 2枚の静止画（WebP）にして、_src/lib/videos.json に書く。
// - poster: 再生前に映す最初のコマ（再生が始まったときに絵が飛ばないように）
// - still: 動きを減らす設定の人に見せる代表のコマ（ヒーローの動画は最初のコマが何も無い地なので、途中のコマを使う）
// 使い方: node _src/assets/encode-video.mjs <hero|color> <書き出した MP4 の場所>
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BYTE_BUDGETS } from '../lib/assets.mjs';
import { MEDIA_SLOTS } from '../lib/media.mjs';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const VIDEOS_FILE = path.join(REPOSITORY_ROOT, '_src', 'lib', 'videos.json');
const LONGEST_EDGE = 1080;
const CONSTANT_RATE_FACTOR = 26;
const STILL_QUALITY = 80;
/** 動きを減らす人向けの静止画を取る時刻（秒）。ヒーローはカードと札が並んだところ。 */
const STILL_SECONDS = Object.freeze({ hero: 4, color: 0 });

const [slotName, source] = process.argv.slice(2);
if (!(slotName in MEDIA_SLOTS) || !source) {
  console.error('使い方: node _src/assets/encode-video.mjs <hero|color> <MP4 の場所>');
  process.exit(1);
}

const relativePaths = {
  video: `assets/video/${slotName}.mp4`,
  poster: `assets/video/${slotName}-poster.webp`,
  still: `assets/video/${slotName}-still.webp`,
};
const videoFile = path.join(REPOSITORY_ROOT, relativePaths.video);
const workDirectory = path.join(REPOSITORY_ROOT, '_tmp', 'video');
mkdirSync(path.dirname(videoFile), { recursive: true });
mkdirSync(workDirectory, { recursive: true });

// 横長なら幅を、縦長なら高さを LONGEST_EDGE 以下にする（-2 は H.264 のために偶数にそろえる指定）。
const scaleFilter = `scale='if(gte(iw,ih),min(${LONGEST_EDGE},iw),-2)':'if(gte(iw,ih),-2,min(${LONGEST_EDGE},ih))'`;
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', source, '-an', '-c:v', 'libx264', '-preset', 'slow',
  '-crf', String(CONSTANT_RATE_FACTOR), '-pix_fmt', 'yuv420p', '-vf', scaleFilter, '-movflags', '+faststart', videoFile]);

/** 動画の seconds 秒のコマを WebP にする。 */
function writeFrameImage(seconds, relativePath) {
  const pngFile = path.join(workDirectory, `${path.basename(relativePath, '.webp')}.png`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(seconds), '-i', videoFile, '-frames:v', '1', pngFile]);
  execFileSync('cwebp', ['-quiet', '-q', String(STILL_QUALITY), pngFile, '-o', path.join(REPOSITORY_ROOT, relativePath)]);
}

writeFrameImage(0, relativePaths.poster);
writeFrameImage(STILL_SECONDS[slotName], relativePaths.still);

const [width, height] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', videoFile])
  .toString().trim().split(',').map(Number);
const videos = JSON.parse(readFileSync(VIDEOS_FILE, 'utf8'));
videos[slotName] = { src: relativePaths.video, poster: relativePaths.poster, still: relativePaths.still, width, height };
writeFileSync(VIDEOS_FILE, `${JSON.stringify(videos, null, 2)}\n`);

const videoBytes = statSync(videoFile).size;
console.log(`${relativePaths.video}（${width}×${height}、${videoBytes} バイト）と静止画2枚`);
if (videoBytes > BYTE_BUDGETS.video) console.warn(`重さの上限 ${BYTE_BUDGETS.video} バイトを超えています。CONSTANT_RATE_FACTOR を上げて作り直す`);
