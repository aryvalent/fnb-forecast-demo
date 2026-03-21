import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatISO, subDays } from 'date-fns'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function roundInt(n) {
  return Math.max(0, Math.round(n))
}

const outlets = ['Downtown', 'Marina', 'Uptown', 'Airport']
const dishes = [
  'Chicken Rice Bowl',
  'Beef Burger',
  'Veggie Salad',
  'Spaghetti Bolognese',
  'Fish Tacos',
  'Fried Rice',
  'Ramen',
  'Grilled Chicken Plate',
  'Caesar Wrap',
  'Margherita Pizza',
  'Pad Thai',
  'Beef Rice Bowl',
  'Mushroom Pizza'
]

const dishBase = Object.fromEntries(
  dishes.map((d, idx) => {
    const base = 18 + (idx % 7) * 5
    return [d, base]
  })
)

const outletMultiplier = {
  Downtown: 1.15,
  Marina: 1.0,
  Uptown: 0.9,
  Airport: 1.25
}

const channels = [
  { channel: 'POS', share: 0.72 },
  { channel: 'Delivery', share: 0.28 }
]

async function main() {
  const rand = mulberry32(42)

  const daysRaw = process.env.MOCK_DAYS ?? process.argv[2] ?? 730
  const days = Math.max(14, Number(daysRaw))
  const endDate = new Date()
  const startDate = subDays(endDate, days - 1)

  const lines = ['date,outlet,dish,quantity,channel']

  for (let i = 0; i < days; i++) {
    const d = subDays(endDate, days - 1 - i)
    const isoDate = formatISO(d, { representation: 'date' })
    const dow = d.getDay()
    const isWeekend = dow === 5 || dow === 6 || dow === 0
    const weekendBoost = isWeekend ? 1.25 : 1.0
    const mildTrend = 1.0 + i * 0.0001
    const yearlySeason = 1.0 + Math.sin((i / 365) * Math.PI * 2) * 0.08

    for (const outlet of outlets) {
      const outletBoost = outletMultiplier[outlet] ?? 1.0
      const localNoise = 0.92 + rand() * 0.22

      for (const dish of dishes) {
        const base = dishBase[dish] ?? 20
        const dishNoise = 0.85 + rand() * 0.3
        const seasonal = 1.0 + Math.sin((i / 7) * Math.PI * 2) * 0.06

        const totalQty = roundInt(base * outletBoost * weekendBoost * mildTrend * yearlySeason * seasonal * localNoise * dishNoise)
        const zeroChance = dish === 'Mushroom Pizza' || dish === 'Veggie Salad' ? 0.06 : 0.03
        const adjustedTotal = rand() < zeroChance ? 0 : totalQty

        for (const c of channels) {
          const channelNoise = clamp(0.9 + rand() * 0.2, 0.85, 1.15)
          const qty = roundInt(adjustedTotal * c.share * channelNoise)
          if (qty === 0) continue
          lines.push([isoDate, outlet, dish, String(qty), c.channel].join(','))
        }
      }
    }
  }

  const outDir = path.join(__dirname, '..', 'sample_data')
  await fs.mkdir(outDir, { recursive: true })
  const outPath = path.join(outDir, 'sales.csv')
  await fs.writeFile(outPath, `${lines.join('\n')}\n`, 'utf8')

  process.stdout.write(`Generated ${lines.length - 1} rows: ${outPath}\n`)
  process.stdout.write(`Date range: ${formatISO(startDate, { representation: 'date' })}..${formatISO(endDate, { representation: 'date' })}\n`)
}

main().catch((e) => {
  process.stderr.write(`${e?.stack ?? e}\n`)
  process.exit(1)
})
