-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SEKRETARIS_KANTOR', 'KETUA_PENGURUS', 'SEKRETARIS_PENGURUS', 'BENDAHARA', 'KEPALA_BAGIAN_PSDM', 'KEPALA_BAGIAN_KEUANGAN', 'KEPALA_BAGIAN_UMUM');

-- CreateEnum
CREATE TYPE "StatusSurat" AS ENUM ('DITERIMA', 'DIPROSES', 'DISPOSISI', 'DITINDAKLANJUTI', 'MENUNGGU_VALIDASI', 'MENUNGGU_TTD', 'DITANDATANGANI', 'SELESAI', 'DITOLAK', 'DIKEMBALIKAN');

-- CreateEnum
CREATE TYPE "StatusDisposisi" AS ENUM ('PENDING', 'DITERUSKAN', 'DITINDAKLANJUTI', 'SELESAI');

-- CreateEnum
CREATE TYPE "JenisSurat" AS ENUM ('INTERNAL', 'EKSTERNAL');

-- CreateEnum
CREATE TYPE "KategoriSurat" AS ENUM ('ADMINISTRATIF', 'KEUANGAN', 'FASILITAS', 'UMUM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratMasuk" (
    "id" TEXT NOT NULL,
    "nomorSurat" TEXT NOT NULL,
    "tanggalSurat" TIMESTAMP(3) NOT NULL,
    "tanggalDiterima" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pengirim" TEXT NOT NULL,
    "perihal" TEXT NOT NULL,
    "jenisSurat" "JenisSurat" NOT NULL,
    "kategori" "KategoriSurat" NOT NULL,
    "status" "StatusSurat" NOT NULL DEFAULT 'DITERIMA',
    "fileUrl" TEXT,
    "filePublicId" TEXT,
    "keterangan" TEXT,
    "isLengkap" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "SuratMasuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratKeluar" (
    "id" TEXT NOT NULL,
    "nomorSurat" TEXT,
    "tanggalSurat" TIMESTAMP(3),
    "tujuan" TEXT NOT NULL,
    "perihal" TEXT NOT NULL,
    "jenisSurat" "JenisSurat" NOT NULL,
    "kategori" "KategoriSurat" NOT NULL,
    "status" "StatusSurat" NOT NULL DEFAULT 'DIPROSES',
    "isiSurat" TEXT,
    "fileUrl" TEXT,
    "filePublicId" TEXT,
    "isSigned" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "keterangan" TEXT,
    "ekspedisi" TEXT,
    "tanggalKirim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "suratMasukId" TEXT,

    CONSTRAINT "SuratKeluar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disposisi" (
    "id" TEXT NOT NULL,
    "instruksi" TEXT NOT NULL,
    "catatan" TEXT,
    "status" "StatusDisposisi" NOT NULL DEFAULT 'PENDING',
    "tanggalDisposisi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalSelesai" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "suratMasukId" TEXT,
    "suratKeluarId" TEXT,
    "isRequestLampiran" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Disposisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lampiran" (
    "id" TEXT NOT NULL,
    "namaFile" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "filePublicId" TEXT NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT NOT NULL,
    "suratMasukId" TEXT,
    "suratKeluarId" TEXT,

    CONSTRAINT "Lampiran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingSurat" (
    "id" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "keterangan" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "suratMasukId" TEXT,
    "suratKeluarId" TEXT,

    CONSTRAINT "TrackingSurat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NomorSuratCounter" (
    "id" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NomorSuratCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SuratKeluar_suratMasukId_key" ON "SuratKeluar"("suratMasukId");

-- CreateIndex
CREATE UNIQUE INDEX "NomorSuratCounter_tahun_key" ON "NomorSuratCounter"("tahun");

-- AddForeignKey
ALTER TABLE "SuratMasuk" ADD CONSTRAINT "SuratMasuk_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratKeluar" ADD CONSTRAINT "SuratKeluar_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratKeluar" ADD CONSTRAINT "SuratKeluar_suratMasukId_fkey" FOREIGN KEY ("suratMasukId") REFERENCES "SuratMasuk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposisi" ADD CONSTRAINT "Disposisi_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposisi" ADD CONSTRAINT "Disposisi_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposisi" ADD CONSTRAINT "Disposisi_suratMasukId_fkey" FOREIGN KEY ("suratMasukId") REFERENCES "SuratMasuk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposisi" ADD CONSTRAINT "Disposisi_suratKeluarId_fkey" FOREIGN KEY ("suratKeluarId") REFERENCES "SuratKeluar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lampiran" ADD CONSTRAINT "Lampiran_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lampiran" ADD CONSTRAINT "Lampiran_suratMasukId_fkey" FOREIGN KEY ("suratMasukId") REFERENCES "SuratMasuk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lampiran" ADD CONSTRAINT "Lampiran_suratKeluarId_fkey" FOREIGN KEY ("suratKeluarId") REFERENCES "SuratKeluar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingSurat" ADD CONSTRAINT "TrackingSurat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingSurat" ADD CONSTRAINT "TrackingSurat_suratMasukId_fkey" FOREIGN KEY ("suratMasukId") REFERENCES "SuratMasuk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingSurat" ADD CONSTRAINT "TrackingSurat_suratKeluarId_fkey" FOREIGN KEY ("suratKeluarId") REFERENCES "SuratKeluar"("id") ON DELETE SET NULL ON UPDATE CASCADE;
