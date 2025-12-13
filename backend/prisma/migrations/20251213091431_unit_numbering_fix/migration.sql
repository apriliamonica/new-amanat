/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Lampiran` table. All the data in the column will be lost.
  - You are about to drop the column `keterangan` on the `Lampiran` table. All the data in the column will be lost.
  - You are about to drop the column `namaFile` on the `Lampiran` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tahun,kodeBagian]` on the table `NomorSuratCounter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileName` to the `Lampiran` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileType` to the `Lampiran` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "NomorSuratCounter_tahun_key";

-- AlterTable
ALTER TABLE "Lampiran" DROP COLUMN "createdAt",
DROP COLUMN "keterangan",
DROP COLUMN "namaFile",
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "fileType" TEXT NOT NULL,
ADD COLUMN     "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "NomorSuratCounter" ADD COLUMN     "kodeBagian" TEXT NOT NULL DEFAULT 'SEK';

-- AlterTable
ALTER TABLE "SuratKeluar" ADD COLUMN     "kodeArea" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "NomorSuratCounter_tahun_kodeBagian_key" ON "NomorSuratCounter"("tahun", "kodeBagian");
