import pg from 'pg';

const { Pool } = pg;

export function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  try {
    const u = new URL(connectionString);
    if (u.protocol === 'postgres:' || u.protocol === 'postgresql:') {
      const database = u.pathname ? u.pathname.replace(/^\//, '') : undefined;
      const port = u.port ? Number(u.port) : undefined;
      const sslMode = u.searchParams.get('sslmode');
      const ssl = sslMode === 'require' ? { rejectUnauthorized: false } : undefined;
      return new Pool({
        host: u.hostname,
        port,
        user: decodeURIComponent(u.username),
        password: u.password ?? '',
        database,
        ssl,
      });
    }
  } catch {}

  return new Pool({ connectionString });
}

export async function withClient(pool, fn) {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
