/*
  Warnings:

  - You are about to drop the column `kategori` on the `SuratKeluar` table. All the data in the column will be lost.
  - You are about to drop the column `kategori` on the `SuratMasuk` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SuratKeluar" DROP COLUMN "kategori";

-- AlterTable
ALTER TABLE "SuratMasuk" DROP COLUMN "kategori";

-- DropEnum
DROP TYPE "KategoriSurat";
