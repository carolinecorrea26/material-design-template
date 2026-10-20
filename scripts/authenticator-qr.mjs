/**
 * Local QR Model 2 encoder for short enrollment URIs. Fixed version 8, level L,
 * byte mode, mask 0; capacity 192 UTF-8 bytes. No network or runtime dependencies.
 */
export function enrollmentQrMatrix(text) {
  const bytes = Buffer.from(text, 'utf8');
  if (bytes.length > 192) throw new Error('Authenticator URI exceeds QR capacity');
  const bits = [];
  const append = (value, length) => { for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  append(4, 4); append(bytes.length, 8);
  for (const byte of bytes) append(byte, 8);
  append(0, Math.min(4, 194 * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((n, bit) => (n << 1) | bit, 0));
  for (let pad = 0; data.length < 194; pad++) data.push(pad % 2 ? 0x11 : 0xec);
  const multiply = (a, b) => {
    let result = 0;
    for (let i = 7; i >= 0; i--) { result = (result << 1) ^ ((result >>> 7) * 0x11d); result ^= ((b >>> i) & 1) * a; }
    return result;
  };
  const divisor = Array(24).fill(0); divisor[23] = 1;
  let root = 1;
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 24; j++) { divisor[j] = multiply(divisor[j], root); if (j + 1 < 24) divisor[j] ^= divisor[j + 1]; }
    root = multiply(root, 2);
  }
  const blocks = [data.slice(0, 97), data.slice(97)];
  const corrections = blocks.map(block => {
    const remainder = Array(24).fill(0);
    for (const byte of block) {
      const factor = byte ^ remainder.shift(); remainder.push(0);
      for (let i = 0; i < 24; i++) remainder[i] ^= multiply(divisor[i], factor);
    }
    return remainder;
  });
  const codewords = [];
  for (let i = 0; i < 97; i++) for (const block of blocks) codewords.push(block[i]);
  for (let i = 0; i < 24; i++) for (const block of corrections) codewords.push(block[i]);
  const size = 49, modules = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));
  const set = (x, y, dark) => { modules[y][x] = !!dark; reserved[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3,3], [size - 4,3], [3,size - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy, distance = Math.max(Math.abs(dx), Math.abs(dy));
      if (x >= 0 && y >= 0 && x < size && y < size) set(x, y, distance !== 2 && distance !== 4);
    }
  }
  for (const x of [6,24,42]) for (const y of [6,24,42]) {
    if ((x === 6 && y === 6) || (x === 6 && y === 42) || (x === 42 && y === 6)) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  // Format: error correction L (01), mask 000, BCH(15,5), then QR XOR mask.
  let formatRemainder = 8;
  for (let i = 0; i < 10; i++) formatRemainder = (formatRemainder << 1) ^ ((formatRemainder >>> 9) * 0x537);
  const format = ((8 << 10) | formatRemainder) ^ 0x5412;
  const bit = (value, i) => ((value >>> i) & 1) !== 0;
  for (let i = 0; i <= 5; i++) set(8, i, bit(format, i));
  set(8, 7, bit(format, 6)); set(8, 8, bit(format, 7)); set(7, 8, bit(format, 8));
  for (let i = 9; i < 15; i++) set(14 - i, 8, bit(format, i));
  for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(format, i));
  for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(format, i));
  set(8, size - 8, true);
  let versionRemainder = 8;
  for (let i = 0; i < 12; i++) versionRemainder = (versionRemainder << 1) ^ ((versionRemainder >>> 11) * 0x1f25);
  const version = (8 << 12) | versionRemainder;
  for (let i = 0; i < 18; i++) {
    const a = size - 11 + i % 3, b = Math.floor(i / 3);
    set(a, b, bit(version, i)); set(b, a, bit(version, i));
  }
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < size; vertical++) {
      const y = ((right + 1) & 2) === 0 ? size - 1 - vertical : vertical;
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        if (reserved[y][x]) continue;
        const dark = index < codewords.length * 8 && bit(codewords[index >>> 3], 7 - (index & 7));
        modules[y][x] = dark !== ((x + y) % 2 === 0); index++;
      }
    }
  }
  if (index !== codewords.length * 8) throw new Error('Invalid QR layout');
  return modules;
}

export function enrollmentQrDataUrl(uri) {
  const modules = enrollmentQrMatrix(uri), border = 4, size = modules.length + border * 2;
  const path = [];
  modules.forEach((row, y) => row.forEach((dark, x) => { if (dark) path.push(`M${x + border},${y + border}h1v1h-1z`); }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="342" height="342" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${path.join('')}" fill="#000"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
