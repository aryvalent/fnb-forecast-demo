import 'dotenv/config'
import { createPool } from '../src/db.js'

const pool = createPool()

try {
  const { rows } = await pool.query('select now() as now')
  process.stdout.write(`ok now=${rows[0]?.now ?? ''}\n`)
  await pool.end()
} catch (e) {
  process.stderr.write(`${e?.message ?? e}\n`)
  if (e?.code) process.stderr.write(`code=${e.code}\n`)
  await pool.end()
  process.exit(1)
}

