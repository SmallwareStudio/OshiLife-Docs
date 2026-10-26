import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY_ROOT } from '../helpers/repository.mjs';
import { BYTE_BUDGETS } from '../../_src/lib/assets.mjs';
import { MEDIA_SLOTS } from '../../_src/lib/media.mjs';
import { readWebpSize } from '../../_src/lib/image-size.mjs';

const videos = JSON.parse(readFileSync(path.join(REPOSITORY_ROOT, '_src', 'lib', 'videos.json'), 'utf8'));

test('動画の情報は、動画の枠の名前だけを持つ', () => {
  for (const slotName of Object.keys(videos)) assert.ok(slotName in MEDIA_SLOTS, slotName);
});

for (const [slotName, video] of Object.entries(videos)) {
  test(`${slotName}: 動画と2枚の静止画（再生前の poster・動きを減らす人向けの still）があり、重さが上限の中で、寸法が動画と同じ`, () => {
    const videoBytes = statSync(path.join(REPOSITORY_ROOT, video.src)).size;
    assert.ok(videoBytes <= BYTE_BUDGETS.video, `動画が ${videoBytes} バイト`);
    for (const imagePath of [video.poster, video.still]) {
      const image = readFileSync(path.join(REPOSITORY_ROOT, imagePath));
      assert.ok(image.length <= BYTE_BUDGETS.videoPoster, `${imagePath} が ${image.length} バイト`);
      assert.deepEqual(readWebpSize(image), { width: video.width, height: video.height }, imagePath);
    }
  });
}
