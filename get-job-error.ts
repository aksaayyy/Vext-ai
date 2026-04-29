import { PrismaClient } from './src/lib/db/generated';
const prisma = new PrismaClient({ log: ['error'] });
async function main() {
  const job = await prisma.processingJob.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(job, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
