# Class Diagram - Sistem AMANAT

## Deskripsi

Class Diagram lengkap untuk Sistem Manajemen Surat AMANAT yang menggambarkan:

- **<<entity>>** - Model database
- **<<enumeration>>** - Enum/tipe data
- **<<control>>** - Controller classes

---

## Class Diagram (Mermaid Format)

```mermaid
classDiagram
    direction TB

    %% ==================== ENUMERATIONS ====================
    class Role {
        <<enumeration>>
        SEKRETARIS_KANTOR
        KETUA_PENGURUS
        SEKRETARIS_PENGURUS
        BENDAHARA
        KEPALA_BAGIAN_PSDM
        KEPALA_BAGIAN_KEUANGAN
        KEPALA_BAGIAN_UMUM
    }

    class StatusSurat {
        <<enumeration>>
        PENGAJUAN
        DITERIMA
        DIPROSES
        DISPOSISI
        MENUNGGU_VALIDASI
        DISETUJUI
        SELESAI
        DIKEMBALIKAN
    }

    class StatusDisposisi {
        <<enumeration>>
        PENDING
        DITERUSKAN
        DITINDAKLANJUTI
        SELESAI
    }

    %% ==================== ENTITY CLASSES ====================
    class User {
        <<entity>>
        +String id
        +String email
        +String password
        +String nama
        +Role role
        +Boolean isActive
        +DateTime createdAt
        +DateTime updatedAt
    }

    class SuratMasuk {
        <<entity>>
        +String id
        +String nomorSurat
        +DateTime tanggalSurat
        +DateTime tanggalDiterima
        +String pengirim
        +String perihal
        +StatusSurat status
        +String tujuan
        +String fileUrl
        +String createdById
    }

    class SuratKeluar {
        <<entity>>
        +String id
        +String nomorSurat
        +DateTime tanggalSurat
        +String tujuan
        +String perihal
        +String kodeArea
        +StatusSurat status
        +String isiSurat
        +Boolean isSigned
        +String createdById
    }

    class Disposisi {
        <<entity>>
        +String id
        +String instruksi
        +String catatan
        +StatusDisposisi status
        +DateTime tanggalDisposisi
        +String fromUserId
        +String toUserId
    }

    class Lampiran {
        <<entity>>
        +String id
        +String fileUrl
        +String fileName
        +String fileType
        +DateTime uploadedAt
    }

    class TrackingSurat {
        <<entity>>
        +String id
        +DateTime timestamp
        +String aksi
        +String keterangan
    }

    class JenisSurat {
        <<entity>>
        +String id
        +String kode
        +String nama
    }

    class NomorSuratCounter {
        <<entity>>
        +String id
        +Integer tahun
        +String kodeBagian
        +Integer counter
    }

    class KodeBagian {
        <<entity>>
        +String id
        +String role
        +String kodeInternal
        +String kodeEksternal
        +String namaBagian
    }

    class KodeArea {
        <<entity>>
        +String id
        +String kode
        +String nama
    }

    %% ==================== CONTROL CLASSES ====================
    class AuthController {
        <<control>>
        +login()
        +logout()
        +getProfile()
    }

    class UserController {
        <<control>>
        +getAllUsers()
        +getUserById()
        +createUser()
        +updateUser()
        +deleteUser()
    }

    class SuratMasukController {
        <<control>>
        +getAllSuratMasuk()
        +getSuratMasukById()
        +createSuratMasuk()
        +updateSuratMasuk()
        +deleteSuratMasuk()
    }

    class SuratKeluarController {
        <<control>>
        +getAllSuratKeluar()
        +getSuratKeluarById()
        +createSuratKeluar()
        +updateSuratKeluar()
        +deleteSuratKeluar()
        +approveSuratKeluar()
    }

    class DisposisiController {
        <<control>>
        +getAllDisposisi()
        +getDisposisiById()
        +createDisposisi()
        +updateDisposisi()
    }

    class DashboardController {
        <<control>>
        +getDashboardStats()
        +getRecentActivities()
    }

    %% ==================== ENTITY RELATIONSHIPS ====================
    %% Association (User creates)
    User "1" --> "*" SuratMasuk : creates
    User "1" --> "*" SuratKeluar : creates
    User "1" --> "*" Disposisi : fromUser
    User "1" --> "*" Disposisi : toUser
    User "1" --> "*" Lampiran : uploads
    User "1" --> "*" TrackingSurat : performs

    %% Composition (Parent-Child)
    SuratMasuk "1" *-- "*" Disposisi : has
    SuratMasuk "1" *-- "*" Lampiran : has
    SuratMasuk "1" *-- "*" TrackingSurat : has
    SuratKeluar "1" *-- "*" Disposisi : has
    SuratKeluar "1" *-- "*" Lampiran : has
    SuratKeluar "1" *-- "*" TrackingSurat : has

    %% Association (Reference)
    SuratKeluar "*" --> "0..1" JenisSurat : uses
    KodeArea "1" --> "*" SuratKeluar : usedBy
    KodeBagian "1" --> "*" NomorSuratCounter : usedBy

    %% Dependency (Enum usage)
    User ..> Role : uses
    SuratMasuk ..> StatusSurat : uses
    SuratKeluar ..> StatusSurat : uses
    Disposisi ..> StatusDisposisi : uses

    %% Controller - Entity Relationships
    AuthController ..> User : manages
    UserController ..> User : manages
    SuratMasukController ..> SuratMasuk : manages
    SuratKeluarController ..> SuratKeluar : manages
    DisposisiController ..> Disposisi : manages
    DashboardController ..> SuratMasuk : reads
    DashboardController ..> SuratKeluar : reads
```

---

## Legend

| Simbol               | Nama            | Keterangan                                             |
| -------------------- | --------------- | ------------------------------------------------------ |
| `◆` (filled diamond) | **Composition** | Strong ownership - child tidak bisa exist tanpa parent |
| `→` (solid arrow)    | **Association** | Relasi umum dengan multiplicity                        |
| `..>` (dashed arrow) | **Dependency**  | Uses/manages relationship                              |

---

## Stereotypes

| Stereotype        | Keterangan             | Contoh                         |
| ----------------- | ---------------------- | ------------------------------ |
| `<<entity>>`      | Model database / tabel | User, SuratMasuk, Disposisi    |
| `<<enumeration>>` | Tipe data enum         | Role, StatusSurat              |
| `<<control>>`     | Controller class       | AuthController, UserController |

---

## Ringkasan Relasi

### 1. Composition (◆)

Child tidak bisa exist tanpa parent.

| Parent      | Child                              |
| ----------- | ---------------------------------- |
| SuratMasuk  | Disposisi, Lampiran, TrackingSurat |
| SuratKeluar | Disposisi, Lampiran, TrackingSurat |

### 2. Association (→)

Relasi umum antar entity.

| Dari        | Ke                | Multiplicity |
| ----------- | ----------------- | ------------ |
| User        | SuratMasuk        | 1 to \*      |
| User        | SuratKeluar       | 1 to \*      |
| User        | Disposisi         | 1 to \*      |
| User        | Lampiran          | 1 to \*      |
| User        | TrackingSurat     | 1 to \*      |
| SuratKeluar | JenisSurat        | \* to 0..1   |
| KodeArea    | SuratKeluar       | 1 to \*      |
| KodeBagian  | NomorSuratCounter | 1 to \*      |

### 3. Dependency (..>)

Penggunaan class lain.

| Dari        | Ke              | Keterangan                       |
| ----------- | --------------- | -------------------------------- |
| User        | Role            | Menggunakan enum Role            |
| SuratMasuk  | StatusSurat     | Menggunakan enum StatusSurat     |
| SuratKeluar | StatusSurat     | Menggunakan enum StatusSurat     |
| Disposisi   | StatusDisposisi | Menggunakan enum StatusDisposisi |
| Controllers | Entities        | Controller mengelola entity      |

---

> **Cara Export ke Draw.io:**
>
> 1. Buka [draw.io](https://app.diagrams.net/)
> 2. Pilih **Insert → Advanced → Mermaid**
> 3. Paste kode Mermaid di atas
