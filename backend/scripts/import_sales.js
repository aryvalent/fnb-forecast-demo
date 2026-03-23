import 'dotenv/config';
import fs from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { createPool, withClient } from '../src/db.js';
import { initDb } from '../src/initDb.js';

const RowSchema = z.object({
  date: z.string().min(1),
  outlet: z.string().min(1),
  dish: z.string().min(1),
  quantity: z.coerce.number().int().nonnegative(),
  channel: z.string().min(1),
});

async function insertSalesRows(client, rows, { batchSize = 500 } = {}) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let p = 1;
    for (const r of chunk) {
      values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
      params.push(r.date, r.outlet, r.dish, r.quantity, r.channel);
    }

    await client.query(
      `
      insert into sales (sale_date, outlet, dish, quantity, channel)
      values ${values.join(',')}
      on conflict (sale_date, outlet, dish, channel)
      do update set quantity = excluded.quantity
      `,
      params
    );
  }
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error('Usage: node scripts/import_sales.js <path-to-sales.csv>');
  }

  const csv = await fs.readFile(filePath, 'utf8');
  const rawRows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });

  const rows = rawRows.map((r) => RowSchema.parse(r));

  const pool = createPool();
  await initDb(pool);

  await withClient(pool, async (client) => {
    await client.query('begin');
    try {
      await insertSalesRows(client, rows, { batchSize: 500 });
      await client.query('commit');
    } catch (e) {
      await client.query('rollback');
      throw e;
    }
  });

  await pool.end();
  process.stdout.write(`Imported ${rows.length} rows from ${filePath}\n`);
}

main().catch((e) => {
  process.stderr.write(`${e?.stack ?? e}\n`);
  process.exit(1);
});
