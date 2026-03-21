import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required')
}

const u = new URL(connectionString)
const dbName = (u.pathname || '').replace(/^\//, '')
if (!dbName) {
  throw new Error('DATABASE_URL must include a database name')
}

const adminUrl = new URL(connectionString)
adminUrl.pathname = '/postgres'

const admin = new Client({ connectionString: adminUrl.toString() })
await admin.connect()
try {
  const exists = await admin.query('select 1 from pg_database where datname = $1', [dbName])
  if (exists.rowCount === 0) {
    await admin.query(`create database "${dbName.replace(/"/g, '""')}"`)
    process.stdout.write(`created database ${dbName}\n`)
  } else {
    process.stdout.write(`database ${dbName} exists\n`)
  }
} finally {
  await admin.end()
}

