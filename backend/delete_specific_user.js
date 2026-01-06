const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = "sekpeng@amanat.com";

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      return;
    }

    console.log(`Found user: ${user.nama} (${user.id})`);

    // 1. Identify Surats created by this user
    const suratMasuk = await prisma.suratMasuk.findMany({
      where: { createdById: user.id },
      select: { id: true },
    });
    const suratMasukIds = suratMasuk.map((s) => s.id);

    const suratKeluar = await prisma.suratKeluar.findMany({
      where: { createdById: user.id },
      select: { id: true },
    });
    const suratKeluarIds = suratKeluar.map((s) => s.id);

    console.log(
      `User created ${suratMasukIds.length} Surat Masuk and ${suratKeluarIds.length} Surat Keluar.`
    );

    await prisma.$transaction(async (tx) => {
      // 2. Delete Disposisi
      // - Involving user (from/to)
      // - Linked to user's created Surats
      await tx.disposisi.deleteMany({
        where: {
          OR: [
            { fromUserId: user.id },
            { toUserId: user.id },
            { suratMasukId: { in: suratMasukIds } },
            { suratKeluarId: { in: suratKeluarIds } },
          ],
        },
      });
      console.log("Deleted related Disposisi");

      // 3. Delete Tracking
      await tx.trackingSurat.deleteMany({
        where: {
          OR: [
            { userId: user.id },
            { suratMasukId: { in: suratMasukIds } },
            { suratKeluarId: { in: suratKeluarIds } },
          ],
        },
      });
      console.log("Deleted related Tracking");

      // 4. Delete Lampiran
      await tx.lampiran.deleteMany({
        where: {
          OR: [
            { uploadedById: user.id },
            { suratMasukId: { in: suratMasukIds } },
            { suratKeluarId: { in: suratKeluarIds } },
          ],
        },
      });
      console.log("Deleted related Lampiran");

      // 5. Handle SuratBalasan Relation
      // First, disconnect SuratKeluar from SuratMasuk to avoid circular dependency issues during deletion
      await tx.suratKeluar.updateMany({
        where: { suratMasukId: { in: suratMasukIds } },
        data: { suratMasukId: null },
      });

      // 6. Delete Surats
      await tx.suratKeluar.deleteMany({
        where: { id: { in: suratKeluarIds } },
      });
      console.log("Deleted user's Surat Keluar");

      await tx.suratMasuk.deleteMany({
        where: { id: { in: suratMasukIds } },
      });
      console.log("Deleted user's Surat Masuk");

      // 7. Finally Delete User
      await tx.user.delete({
        where: { id: user.id },
      });
      console.log("Deleted User");
    });

    console.log("SUCCESS: User and all related data deleted.");
  } catch (error) {
    console.error("Error deleting user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
