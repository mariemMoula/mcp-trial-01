import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { timestamp: 'desc' },
    take: 10,
  });
  
  console.log('\n📋 Recent Audit Logs:\n');
  
  for (const log of logs) {
    console.log(`[${log.timestamp.toLocaleString()}] ${log.user.email}`);
    console.log(`  Action: ${log.action}`);
    console.log(`  Success: ${log.success ? '✅' : '❌'}`);
    if (log.metadata) {
      console.log(`  Metadata:`, log.metadata);
    }
    console.log('');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());