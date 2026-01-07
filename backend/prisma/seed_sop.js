const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding dummy data for SOP Testing...");

  // Get Users
  const admin = await prisma.user.findFirst({
    where: { role: "SEKRETARIS_KANTOR" },
  });
  const kabagPsdm = await prisma.user.findFirst({
    where: { role: "KEPALA_BAGIAN_PSDM" },
  });
  const sekpeng = await prisma.user.findFirst({
    where: { role: "SEKRETARIS_PENGURUS" },
  });
  const ketua = await prisma.user.findFirst({
    where: { role: "KETUA_PENGURUS" },
  });

  const jenisSurat = await prisma.jenisSurat.findFirst({
    where: { kode: "SK" },
  });

  if (!admin || !kabagPsdm || !sekpeng || !ketua || !jenisSurat) {
    console.error("Users/JenisSurat not found. Please run main seed first.");
    return;
  }

  // 1. Surat PENGAJUAN (Dari Kabag PSDM) - Untuk dites Admin Proses
  const suratPengajuan = await prisma.suratKeluar.create({
    data: {
      tujuan: "Dinas Tenaga Kerja",
      perihal: "Laporan Ketenagakerjaan",
      keterangan: "Mohon diproses untuk pelaporan semester",
      status: "PENGAJUAN",
      createdById: kabagPsdm.id,
      jenisSuratId: jenisSurat.id,
      nomorSurat: "001/PSDM/2026", // Nomor internal kabag
      tanggalSurat: new Date(),
      tracking: {
        create: {
          aksi: "Pengajuan surat keluar",
          keterangan: "Dibuat oleh Kabag PSDM",
          userId: kabagPsdm.id,
        },
      },
    },
  });
  console.log("Created: Surat PENGAJUAN (ID: ...)");

  // 2. Surat DIPROSES (Sudah diproses Admin, belum disposisi) - Untuk dites Admin Disposisi
  const suratDiproses = await prisma.suratKeluar.create({
    data: {
      tujuan: "Bank BNI",
      perihal: "Permohonan Rekening Baru",
      keterangan: "Untuk penggajian karyawan baru",
      status: "DIPROSES",
      createdById: admin.id, // Admin create directly
      jenisSuratId: jenisSurat.id,
      nomorSurat: "005/SEK/A/SK/I/2026", // Nomor resmi admin
      nomorSuratAdmin: "005/SEK/A/SK/I/2026",
      tanggalSurat: new Date(),
      tracking: {
        create: {
          aksi: "Surat diproses",
          keterangan: "Surat siap didisposisikan",
          userId: admin.id,
        },
      },
    },
  });
  console.log("Created: Surat DIPROSES (Siap Disposisi)");

  // 3. Surat DISPOSISI KE SEKPENG (Sudah disposisi ke Sekpeng) - Untuk dites Sekpeng Dispo ke Ketua
  const suratDispoSek = await prisma.suratKeluar.create({
    data: {
      tujuan: "Notaris",
      perihal: "Perubahan Akta Yayasan",
      status: "DIPROSES", // Tetap DIPROSES tapi sudah ada disposisi
      createdById: admin.id,
      jenisSuratId: jenisSurat.id,
      nomorSurat: "006/SEK/A/SK/I/2026",
      nomorSuratAdmin: "006/SEK/A/SK/I/2026",
      tanggalSurat: new Date(),
      disposisi: {
        create: {
          fromUserId: admin.id,
          toUserId: sekpeng.id,
          instruksi: "Mohon diperiksa dan diteruskan ke Ketua",
          status: "PENDING",
        },
      },
      tracking: {
        create: {
          aksi: "Disposisi ke Sekretaris Yayasan",
          keterangan: "Mohon cek",
          userId: admin.id,
        },
      },
    },
  });
  console.log("Created: Surat DISPOSISI ke SEKPENG");

  // 4. Surat DISPOSISI KE KETUA (Sudah disposisi ke Ketua) - Untuk dites Ketua Approve
  const suratDispoKetua = await prisma.suratKeluar.create({
    data: {
      tujuan: "LLDIKTI Wilayah XVI",
      perihal: "Laporan Kinerja Dosen",
      status: "DIPROSES",
      createdById: admin.id,
      jenisSuratId: jenisSurat.id,
      nomorSurat: "007/SEK/A/SK/I/2026",
      nomorSuratAdmin: "007/SEK/A/SK/I/2026",
      tanggalSurat: new Date(),
      disposisi: {
        create: [
          {
            fromUserId: admin.id,
            toUserId: sekpeng.id,
            instruksi: "Teruskan ke Ketua",
            status: "DITERUSKAN",
            tanggalDisposisi: new Date(Date.now() - 86400000), // Kemarin
          },
          {
            fromUserId: sekpeng.id,
            toUserId: ketua.id,
            instruksi: "Mohon persetujuan dan tanda tangan",
            status: "PENDING",
            tanggalDisposisi: new Date(),
          },
        ],
      },
      tracking: {
        create: {
          aksi: "Disposisi ke Ketua Yayasan",
          keterangan: "Siap ACC/TTD",
          userId: sekpeng.id,
        },
      },
    },
  });
  console.log("Created: Surat DISPOSISI ke KETUA (Siap Approve)");

  console.log("Dummy seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
