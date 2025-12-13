const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkCounters() {
  const counters = await prisma.nomorSuratCounter.findMany();
  console.log("Current Counters:", counters);
}

checkCounters()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
