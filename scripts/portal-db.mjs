import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import pg from 'pg';

export function connectPortalDatabase() {
  const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DB_URL;
  if (!connectionString) throw new Error('Set NETLIFY_DB_URL or DATABASE_URL for the Portal database.');
  return new pg.Pool({ connectionString, max: 2, connectionTimeoutMillis: 5000 });
}

export async function inTransaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}

export function verifyPassword(password, saved = '0'.repeat(32) + ':' + '0'.repeat(64)) {
  const [salt, hash] = saved.split(':');
  return timingSafeEqual(scryptSync(password, salt, 32), Buffer.from(hash, 'hex'));
}
