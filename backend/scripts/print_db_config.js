import 'dotenv/config'

const cs = process.env.DATABASE_URL
const u = new URL(cs)
process.stdout.write(`protocol=${u.protocol}\n`)
process.stdout.write(`user=${u.username}\n`)
process.stdout.write(`password(${typeof u.password})=${JSON.stringify(u.password)}\n`)
process.stdout.write(`host=${u.hostname}\n`)
process.stdout.write(`port=${u.port}\n`)
process.stdout.write(`db=${u.pathname}\n`)

