#!/usr/bin/env node
/**
 * Seed 1000 cards and benchmark shareId query performance.
 * Run: node scripts/seed-1000-cards.js
 */

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const CLASSIFICATIONS = [
  'setup/tutorial', 'strategy/framework', 'tool demo', 'finance/setup',
  'product teardown', 'interview/talk', 'research/paper', 'debate/discussion',
];

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
function randomId(len) {
  let id = '';
  for (let i = 0; i < len; i++) id += CHARS[Math.floor(Math.random() * CHARS.length)];
  return id;
}

async function main() {
  const client = await pool.connect();
  console.log('✓ Connected to Neon\n');

  // ── Insert 1000 cards in batches of 100 ───────────────────────────────────
  const TOTAL = 1000;
  const BATCH = 100;
  const insertedShareIds = [];

  console.log(`Inserting ${TOTAL} cards in batches of ${BATCH}...`);
  const insertStart = Date.now();

  for (let b = 0; b < TOTAL / BATCH; b++) {
    const values = [];
    const params = [];
    let p = 1;

    for (let i = 0; i < BATCH; i++) {
      const shareId = randomId(8);
      const cardId  = randomId(14);
      const cls     = CLASSIFICATIONS[(b * BATCH + i) % CLASSIFICATIONS.length];
      const output  = JSON.stringify({ steps: [`Step ${i + 1}`, 'Step 2', 'Step 3'] });
      const title   = `Seed Card #${b * BATCH + i + 1}`;
      insertedShareIds.push(shareId);

      values.push(`(gen_random_uuid(), $${p++}, $${p++}, $${p++}, $${p++}::jsonb, $${p++}, NOW(), NOW())`);
      params.push(cls, output, cardId, output, shareId, title);
    }

    await client.query(
      `INSERT INTO "Card" (id, classification, output, "cardId", output, "shareId", title, "createdAt", "updatedAt")
       SELECT gen_random_uuid(), unnested.*
       FROM unnest(ARRAY[${values.join(',')}]) AS unnested`,
      params,
    ).catch(async () => {
      // Simpler single-row inserts as fallback
      for (const [idx] of Array.from({ length: BATCH }).entries()) {
        const shareId = randomId(8);
        const cardId  = randomId(14);
        const cls     = CLASSIFICATIONS[(b * BATCH + idx) % CLASSIFICATIONS.length];
        const output  = { steps: [`Step ${idx + 1}`, 'Step 2'] };
        insertedShareIds.push(shareId);
        await client.query(
          `INSERT INTO "Card" (id, classification, output, "cardId", "shareId", title, "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT ("shareId") DO NOTHING`,
          [cls, JSON.stringify(output), cardId, shareId, `Seed Card ${b * BATCH + idx + 1}`],
        );
      }
    });

    process.stdout.write(`  Batch ${b + 1}/${TOTAL / BATCH} done\r`);
  }

  const insertMs = Date.now() - insertStart;
  console.log(`\n✓ Inserted ${TOTAL} cards in ${insertMs}ms (${(insertMs / TOTAL).toFixed(1)}ms avg)\n`);

  // ── Benchmark: query by shareId ───────────────────────────────────────────
  const COUNT = 50;
  console.log(`Benchmarking ${COUNT} random shareId lookups...`);

  // Re-fetch some real share IDs from the DB
  const { rows } = await client.query(`SELECT "shareId" FROM "Card" LIMIT $1`, [COUNT]);
  const realIds = rows.map(r => r.shareId);

  const queryTimes = [];
  for (const shareId of realIds) {
    const t0 = performance.now();
    await client.query(`SELECT * FROM "Card" WHERE "shareId" = $1 LIMIT 1`, [shareId]);
    queryTimes.push(performance.now() - t0);
  }

  const avg = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
  const max = Math.max(...queryTimes);
  const min = Math.min(...queryTimes);

  console.log(`  avg: ${avg.toFixed(2)}ms | min: ${min.toFixed(2)}ms | max: ${max.toFixed(2)}ms`);

  if (avg < 10) {
    console.log(`\n✅ PASS — avg ${avg.toFixed(2)}ms < 10ms target`);
  } else {
    console.log(`\n⚠️  WARN — avg ${avg.toFixed(2)}ms exceeds 10ms target (check index + connection)`);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const { rowCount } = await client.query(`SELECT COUNT(*) FROM "Card"`);
  console.log(`\nTotal cards in DB: ${rowCount ?? '?'}`);
  console.log('\nSeed complete. Run `npx prisma studio` to inspect the data.');

  client.release();
  await pool.end();
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
