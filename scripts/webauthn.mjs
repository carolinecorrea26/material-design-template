import { createHash, createPublicKey, verify } from 'node:crypto';
const reject = () => { throw Object.assign(new Error('Passkey verification failed. Try again.'), { status: 401 }); };
const hash = bytes => createHash('sha256').update(bytes).digest();
const bytes = value => {
  if (typeof value !== 'string' || !/^[\w-]+$/.test(value) || value.length > 22000) reject();
  const result = Buffer.from(value, 'base64url');
  if (result.toString('base64url') !== value) reject();
  return result;
};
// Definite-length CBOR subset used by none attestation and ES256 COSE keys.
// Bounds and duplicate keys are checked before accepting authenticator input.
export function decodeCbor(buffer, start = 0) {
  let offset = start;
  const read = (depth = 0) => {
    if (depth > 8 || offset >= buffer.length) reject();
    const head = buffer[offset++], major = head >> 5, extra = head & 31;
    let length = extra;
    if (extra >= 24) {
      const size = { 24: 1, 25: 2, 26: 4 }[extra];
      if (!size || offset + size > buffer.length) reject();
      length = buffer.readUIntBE(offset, size); offset += size;
    }
    if (major === 0) return length;
    if (major === 1) return -1 - length;
    if (length > 16384) reject();
    if (major === 2 || major === 3) {
      if (offset + length > buffer.length) reject();
      const value = buffer.subarray(offset, offset + length); offset += length;
      return major === 2 ? value : value.toString('utf8');
    }
    if (major === 5) {
      if (length > 32) reject();
      const map = new Map();
      for (let i = 0; i < length; i++) {
        const key = read(depth + 1);
        if (!['number', 'string'].includes(typeof key) || map.has(key)) reject();
        map.set(key, read(depth + 1));
      }
      return map;
    }
    reject();
  };
  const value = read(); return { value, offset };
}
function clientData(response, ceremony, type) {
  if (!response || typeof response !== 'object') reject();
  const raw = bytes(response.clientDataJSON);
  let data; try { data = JSON.parse(raw.toString('utf8')); } catch { reject(); }
  if (data.type !== type || data.challenge !== ceremony.challenge || data.origin !== ceremony.origin || data.crossOrigin === true || data.topOrigin !== undefined) reject();
  return raw;
}
function authenticatorData(raw, rpID) {
  if (!Buffer.isBuffer(raw) || raw.length < 37 || !raw.subarray(0, 32).equals(hash(rpID))) reject();
  const flags = raw[32];
  if ((flags & 5) !== 5 || ((flags & 16) && !(flags & 8))) reject(); // presence, verification, valid backup flags
  return { flags, counter: raw.readUInt32BE(33), backupEligible: !!(flags & 8) };
}
export function verifyRegistration(credential, ceremony) {
  if (credential?.type !== 'public-key' || credential.id !== credential.rawId) reject();
  clientData(credential.response, ceremony, 'webauthn.create');
  const attestation = bytes(credential.response.attestationObject);
  const decoded = decodeCbor(attestation), object = decoded.value;
  if (decoded.offset !== attestation.length || !(object instanceof Map) || object.get('fmt') !== 'none' || !(object.get('attStmt') instanceof Map) || object.get('attStmt').size !== 0) reject();
  const raw = object.get('authData'), info = authenticatorData(raw, ceremony.rpID);
  if (!(info.flags & 64) || raw.length < 55) reject();
  const length = raw.readUInt16BE(53);
  if (!length || length > 1023 || raw.length < 55 + length) reject();
  if (raw.subarray(55, 55 + length).toString('base64url') !== credential.id) reject();
  const keyData = decodeCbor(raw, 55 + length), key = keyData.value;
  if (!(key instanceof Map) || key.get(1) !== 2 || key.get(3) !== -7 || key.get(-1) !== 1 || !Buffer.isBuffer(key.get(-2)) || key.get(-2).length !== 32 || !Buffer.isBuffer(key.get(-3)) || key.get(-3).length !== 32) reject();
  let end = keyData.offset;
  if (info.flags & 128) { const extensions = decodeCbor(raw, end); if (!(extensions.value instanceof Map)) reject(); end = extensions.offset; }
  if (end !== raw.length) reject();
  const jwk = { kty: 'EC', crv: 'P-256', x: key.get(-2).toString('base64url'), y: key.get(-3).toString('base64url') };
  try { createPublicKey({ key: jwk, format: 'jwk' }); } catch { reject(); }
  return { id: credential.id, publicKey: jwk, counter: info.counter, backupEligible: info.backupEligible };
}
export function verifyAuthentication(credential, ceremony, stored, userID) {
  if (credential?.type !== 'public-key' || credential.id !== stored.id || credential.rawId !== stored.id) reject();
  const client = clientData(credential.response, ceremony, 'webauthn.get');
  if (credential.response.userHandle != null && credential.response.userHandle !== userID) reject();
  const raw = bytes(credential.response.authenticatorData), info = authenticatorData(raw, ceremony.rpID);
  if (info.flags & 64 || info.backupEligible !== stored.backupEligible) reject();
  let end = 37;
  if (info.flags & 128) { const extensions = decodeCbor(raw, end); if (!(extensions.value instanceof Map)) reject(); end = extensions.offset; }
  if (end !== raw.length || (stored.counter !== 0 || info.counter !== 0) && info.counter <= stored.counter) reject();
  if (!verify('sha256', Buffer.concat([raw, hash(client)]), createPublicKey({ key: stored.publicKey, format: 'jwk' }), bytes(credential.response.signature))) reject();
  return info.counter;
}
