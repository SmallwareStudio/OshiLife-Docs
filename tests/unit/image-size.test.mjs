import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readJpegSize, readPngSize, readSvgSize, readWebpSize } from '../../_src/lib/image-size.mjs';

function createWebpHeader(chunkType, writeDimensions) {
  const buffer = Buffer.alloc(32);
  buffer.write('RIFF', 0, 'ascii');
  buffer.write('WEBP', 8, 'ascii');
  buffer.write(chunkType, 12, 'ascii');
  writeDimensions(buffer);
  return buffer;
}

test('WebP（VP8）の寸法を読む', () => {
  const buffer = createWebpHeader('VP8 ', (header) => {
    header.writeUInt16LE(640, 26);
    header.writeUInt16LE(1391, 28);
  });
  assert.deepEqual(readWebpSize(buffer), { width: 640, height: 1391 });
});

test('WebP（VP8L）の寸法を読む', () => {
  const buffer = createWebpHeader('VP8L', (header) => {
    header.writeUInt32LE(((640 - 1) | ((1391 - 1) << 14)) >>> 0, 21);
  });
  assert.deepEqual(readWebpSize(buffer), { width: 640, height: 1391 });
});

test('WebP（VP8X）の寸法を読む', () => {
  const buffer = createWebpHeader('VP8X', (header) => {
    header.writeUIntLE(640 - 1, 24, 3);
    header.writeUIntLE(1391 - 1, 27, 3);
  });
  assert.deepEqual(readWebpSize(buffer), { width: 640, height: 1391 });
});

test('WebP でないものは例外にする', () => {
  assert.throws(() => readWebpSize(Buffer.alloc(32)), /WebP/);
});

test('PNG の寸法を読む', () => {
  const buffer = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(192, 16);
  buffer.writeUInt32BE(192, 20);
  assert.deepEqual(readPngSize(buffer), { width: 192, height: 192 });
});

test('JPEG の寸法を読む（最初のフレームの区切りから）', () => {
  const buffer = Buffer.from([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x04, 0x00, 0x00,
    0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x76, 0x04, 0xb0, 0x03,
  ]);
  assert.deepEqual(readJpegSize(buffer), { width: 1200, height: 630 });
});

test('SVG の幅と高さを整数で読む', () => {
  const svg = '<svg id="JP" xmlns="http://www.w3.org/2000/svg" width="108.85157" height="40" viewBox="0 0 108.85157 40">';
  assert.deepEqual(readSvgSize(svg), { width: 109, height: 40 });
});
