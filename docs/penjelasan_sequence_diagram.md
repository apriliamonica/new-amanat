# Penjelasan Sequence Diagram - Aplikasi AMANAT

---

## Notasi Garis pada Sequence Diagram

Sequence diagram menggunakan beberapa jenis garis untuk menggambarkan interaksi antar komponen:

- **Garis panah penuh (→)**: Menunjukkan pesan sinkron atau pemanggilan method/fungsi dari satu objek ke objek lain. Pengirim akan menunggu hingga proses selesai.

- **Garis panah putus-putus (--→)**: Menunjukkan pesan balasan (return) dari objek yang dipanggil kembali ke objek pemanggil.

- **Garis vertikal (lifeline)**: Garis vertikal dari setiap objek yang menunjukkan waktu hidup objek selama interaksi berlangsung.

- **Kotak ALT**: Menunjukkan kondisi alternatif (percabangan) dimana sistem dapat mengambil jalur yang berbeda berdasarkan kondisi tertentu.

---

## 1. Sequence Diagram: Alur Login

Sequence diagram ini memodelkan proses autentikasi pengguna ke dalam sistem AMANAT. Proses dimulai dengan Pengguna mengirim pesan sinkron berupa input email dan password ke Halaman Login. Halaman Login kemudian mengirim request POST /login ke AuthController untuk memproses autentikasi. AuthController melakukan query SELECT ke database PostgreSQL untuk mencari data user, dan database mengembalikan data user melalui pesan balasan.

Diagram ini memiliki blok ALT yang menunjukkan dua kemungkinan: jika password benar, AuthController akan generate token JWT dan mengembalikan token ke Halaman Login yang kemudian mengarahkan Pengguna ke Dashboard. Jika password salah, AuthController mengembalikan error 401 Unauthorized dan Halaman Login menampilkan pesan error kepada Pengguna.

---

## 2. Sequence Diagram: Alur Surat Masuk

Sequence diagram ini memodelkan proses pengelolaan surat masuk dari penerimaan hingga penyelesaian dalam aplikasi AMANAT. Alur dimulai dengan Admin mengirim pesan sinkron berupa input data surat ke Halaman Surat Masuk. Halaman kemudian memanggil SuratMasukController untuk menyimpan surat dengan melakukan INSERT ke database PostgreSQL. Controller juga membuat disposisi otomatis ke Ketua Yayasan dan mengirimkan notifikasi.

Ketua Yayasan menerima notifikasi dan membuka detail surat melalui Halaman Surat Masuk. Setelah mempelajari surat, Ketua mendisposisikan ke Penerima yang tepat melalui pemanggilan fungsi ke Controller. Penerima yang menerima disposisi akan menindaklanjuti surat, dan setelah selesai mengirim pesan Klik Selesai ke Halaman. Controller kemudian melakukan UPDATE status menjadi SELESAI di database dan mengembalikan pesan balasan berhasil.

---

## 3. Sequence Diagram: Alur Surat Keluar

Sequence diagram ini memodelkan proses pembuatan surat keluar dari pengajuan hingga pengiriman. Alur dimulai dengan Kabag mengirim pesan sinkron berupa pembuatan surat keluar ke Halaman Surat Keluar. Controller menyimpan surat dengan INSERT ke database (status PENGAJUAN) dan mengirim notifikasi ke Admin. Admin kemudian memproses surat dengan memanggil fungsi proses yang akan men-generate nomor surat secara otomatis dan mengupdate status menjadi DIPROSES.

Admin selanjutnya mendisposisikan surat ke Ketua/Sekretaris/Bendahara untuk persetujuan. Diagram ini memiliki blok ALT yang menunjukkan dua kemungkinan: jika Ketua mengklik Setujui, Controller melakukan UPDATE status menjadi DISETUJUI dengan isSigned=true. Jika Ketua mengklik Tolak, Controller melakukan UPDATE status menjadi DIKEMBALIKAN dan surat dikembalikan untuk diperbaiki. Setelah disetujui, Admin dapat mengirim surat dengan mengklik Kirim Surat, dan Controller mengupdate status menjadi SELESAI.
