/*
  Warnings:

  - You are about to drop the column `jenisSurat` on the `SuratKeluar` table. All the data in the column will be lost.
  - Changed the type of `jenisSurat` on the `SuratMasuk` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SifatSurat" AS ENUM ('INTERNAL', 'EKSTERNAL');

-- AlterEnum
ALTER TYPE "StatusSurat" ADD VALUE 'PENGAJUAN';

-- AlterTable
ALTER TABLE "SuratKeluar" DROP COLUMN "jenisSurat",
ADD COLUMN     "jenisSuratId" TEXT;

-- AlterTable
ALTER TABLE "SuratMasuk" DROP COLUMN "jenisSurat",
ADD COLUMN     "jenisSurat" "SifatSurat" NOT NULL;

-- DropEnum
DROP TYPE "JenisSurat";

-- CreateTable
CREATE TABLE "JenisSurat" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "format" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JenisSurat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KodeBagian" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "kodeInternal" TEXT NOT NULL,
    "kodeEksternal" TEXT NOT NULL,
    "namaBagian" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KodeBagian_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JenisSurat_kode_key" ON "JenisSurat"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "KodeBagian_role_key" ON "KodeBagian"("role");

-- AddForeignKey
ALTER TABLE "SuratKeluar" ADD CONSTRAINT "SuratKeluar_jenisSuratId_fkey" FOREIGN KEY ("jenisSuratId") REFERENCES "JenisSurat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
