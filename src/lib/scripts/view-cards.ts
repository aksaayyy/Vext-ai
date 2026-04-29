import { prisma } from '../db/client';

async function main() {
  const cards = await prisma.card.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      job: true
    }
  });

  console.log('--- RECENT CARDS ---');
  cards.forEach(card => {
    console.log(`\n[CARD ID: ${card.id}]`);
    console.log(`Title: ${card.title}`);
    console.log(`Classification: ${card.classification}`);
    console.log(`Share Link: /card/${card.shareId}`);
    console.log(`Output Metadata:`, JSON.stringify(card.output, null, 2).slice(0, 500) + '...');
    console.log('-------------------');
  });
}

main().catch(console.error);
