const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function setAdminCounter() {
  const currentYear = new Date().getFullYear();
  // Set to 11 so next is 12
  const targetCounter = 11;

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

  console.log("Updated Admin (SEK) counter to:", updated.counter);
}

setAdminCounter()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
