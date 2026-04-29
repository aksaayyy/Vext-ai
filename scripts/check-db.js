const { PrismaClient } = require('./src/lib/db/generated');
const prisma = new PrismaClient();

async function checkJobs() {
  const jobs = await prisma.processingJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(jobs, null, 2));
  process.exit(0);
}

checkJobs().catch(e => {
  console.error(e);
  process.exit(1);
});
