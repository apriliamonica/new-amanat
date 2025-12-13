const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function resetAdminCounter() {
  const currentYear = new Date().getFullYear();
  // Set to 0 so next is 1
  const targetCounter = 0;

  const updated = await prisma.nomorSuratCounter.update({
    where: {
      tahun_kodeBagian: {
        tahun: currentYear,
        kodeBagian: "SEK",
      },
    },
    data: {
      counter: targetCounter,
    },
  });

  console.log("Reset Admin (SEK) counter to:", updated.counter);
}

resetAdminCounter()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
