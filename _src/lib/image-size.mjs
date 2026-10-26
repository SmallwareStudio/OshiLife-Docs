// 画像の寸法を、ファイルの先頭のバイトから読む（依存を足さないため）。

const RIFF_TAG_END = 4;
const WEBP_TAG_START = 8;
const WEBP_TAG_END = 12;
const WEBP_CHUNK_TYPE_END = 16;
const VP8_WIDTH_OFFSET = 26;
const VP8_HEIGHT_OFFSET = 28;
const VP8_DIMENSION_MASK = 0x3fff;
const VP8L_BITS_OFFSET = 21;
const VP8L_HEIGHT_SHIFT = 14;
const VP8X_WIDTH_OFFSET = 24;
const VP8X_HEIGHT_OFFSET = 27;
const VP8X_DIMENSION_BYTES = 3;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_WIDTH_OFFSET = 16;
const PNG_HEIGHT_OFFSET = 20;

const JPEG_MARKER_PREFIX = 0xff;
const JPEG_START_OF_FRAME_MARKERS = new Set([0xc0, 0xc1, 0xc2]);
const JPEG_FIRST_SEGMENT_OFFSET = 2;
const JPEG_MARKER_SIZE = 2;
const JPEG_FRAME_HEIGHT_OFFSET = 5;
const JPEG_FRAME_WIDTH_OFFSET = 7;

export function readWebpSize(buffer) {
  if (buffer.toString('ascii', 0, RIFF_TAG_END) !== 'RIFF' || buffer.toString('ascii', WEBP_TAG_START, WEBP_TAG_END) !== 'WEBP') {
    throw new Error('WebP ではありません');
  }
  const chunkType = buffer.toString('ascii', WEBP_TAG_END, WEBP_CHUNK_TYPE_END);
  if (chunkType === 'VP8 ') {
    return {
      width: buffer.readUInt16LE(VP8_WIDTH_OFFSET) & VP8_DIMENSION_MASK,
      height: buffer.readUInt16LE(VP8_HEIGHT_OFFSET) & VP8_DIMENSION_MASK,
    };
  }
  if (chunkType === 'VP8L') {
    const bits = buffer.readUInt32LE(VP8L_BITS_OFFSET);
    return { width: (bits & VP8_DIMENSION_MASK) + 1, height: ((bits >>> VP8L_HEIGHT_SHIFT) & VP8_DIMENSION_MASK) + 1 };
  }
  if (chunkType === 'VP8X') {
    return {
      width: buffer.readUIntLE(VP8X_WIDTH_OFFSET, VP8X_DIMENSION_BYTES) + 1,
      height: buffer.readUIntLE(VP8X_HEIGHT_OFFSET, VP8X_DIMENSION_BYTES) + 1,
    };
  }
  throw new Error(`知らない WebP の形式です: ${chunkType}`);
}

export function readPngSize(buffer) {
  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) throw new Error('PNG ではありません');
  return { width: buffer.readUInt32BE(PNG_WIDTH_OFFSET), height: buffer.readUInt32BE(PNG_HEIGHT_OFFSET) };
}

export function readJpegSize(buffer) {
  let offset = JPEG_FIRST_SEGMENT_OFFSET;
  while (offset + JPEG_FRAME_WIDTH_OFFSET < buffer.length) {
    if (buffer[offset] !== JPEG_MARKER_PREFIX) throw new Error('JPEG の区切りを読めません');
    const marker = buffer[offset + 1];
    if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      return {
        width: buffer.readUInt16BE(offset + JPEG_FRAME_WIDTH_OFFSET),
        height: buffer.readUInt16BE(offset + JPEG_FRAME_HEIGHT_OFFSET),
      };
    }
    offset += JPEG_MARKER_SIZE + buffer.readUInt16BE(offset + JPEG_MARKER_SIZE);
  }
  throw new Error('JPEG の寸法が見つかりません');
}

/** SVG の最初の <svg> の width と height を、四捨五入した整数で読む。 */
export function readSvgSize(svgText) {
  const width = Number(svgText.match(/<svg[^>]*\swidth="([\d.]+)"/)?.[1]);
  const height = Number(svgText.match(/<svg[^>]*\sheight="([\d.]+)"/)?.[1]);
  if (!Number.isFinite(width) || !Number.isFinite(height)) throw new Error('SVG の width と height を読めません');
  return { width: Math.round(width), height: Math.round(height) };
}
