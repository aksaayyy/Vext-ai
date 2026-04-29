import { prisma } from './src/lib/db/client';

async function main() {
  const job = await prisma.processingJob.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(job, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
