-- AlterEnum
ALTER TYPE "StatusSurat" ADD VALUE 'DISETUJUI';

-- AlterTable
ALTER TABLE "SuratKeluar" ADD COLUMN     "finalFilePublicId" TEXT,
ADD COLUMN     "finalFileUrl" TEXT,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;
