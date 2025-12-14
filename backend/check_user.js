const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = "sekretaris@amanat.id";
  const user = await prisma.user.findUnique({
    where: { email },
  });
  console.log("User found:", user);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
