import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Download,
  Send,
  Clock,
  CheckCircle,
  Paperclip,
  PenTool,
  XCircle,
  User,
  Truck,
  Edit,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  suratKeluarAPI,
  disposisiAPI,
  userAPI,
  lampiranAPI,
  jenisSuratAPI,
  kodeAreaAPI,
} from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import StatusBadge from "../../components/common/StatusBadge";
import {
  isAdmin,
  isKetua,
  isKabag,
  canValidate,
  canDisposisi,
  ROLE_SHORT_NAMES,
  ROLE_NAMES,
  KATEGORI_NAMES,
  STATUS_SURAT,
  ROLES,
} from "../../utils/constants";
import { formatDate, formatDateTime } from "../../utils/helpers";

const SuratKeluarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [surat, setSurat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showValidasiModal, setShowValidasiModal] = useState(false);
  const [showTTDModal, setShowTTDModal] = useState(false);
  const [showKirimModal, setShowKirimModal] = useState(false);
  const [showDisposisiModal, setShowDisposisiModal] = useState(false);
  const [showLampiranModal, setShowLampiranModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [catatan, setCatatan] = useState("");
  const [ekspedisi, setEkspedisi] = useState("");
  const [disposisiForm, setDisposisiForm] = useState({
    toUserId: "",
    instruksi: "",
    catatan: "",
    isRequestLampiran: false,
  });
  const [showProsesModal, setShowProsesModal] = useState(false);
  const [jenisSuratOptions, setJenisSuratOptions] = useState([]);
  const [selectedJenisSuratId, setSelectedJenisSuratId] = useState("");
  const [kodeAreaOptions, setKodeAreaOptions] = useState([]);
  const [selectedKodeArea, setSelectedKodeArea] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openedFiles, setOpenedFiles] = useState([]);

  useEffect(() => {
    fetchSurat();
    fetchUsers();
    if (isAdmin(user?.role)) {
      fetchJenisSurat();
      fetchKodeArea();
    }
    // Load opened files from localStorage
    const stored = localStorage.getItem("openedFiles");
    if (stored) {
      setOpenedFiles(JSON.parse(stored));
    }
  }, [id, user?.role]);

  const fetchJenisSurat = async () => {
    try {
      const response = await jenisSuratAPI.getAll();
      if (response.data.success) {
        setJenisSuratOptions(response.data.data);
      }
    } catch (error) {
      console.error("Fetch jenis surat error:", error);
    }
  };

  const fetchKodeArea = async () => {
    try {
      const response = await kodeAreaAPI.getAll();
      if (response.data.success) {
        setKodeAreaOptions(response.data.data);
      }
    } catch (error) {
      console.error("Fetch kode area error:", error);
    }
  };

  const fetchSurat = async () => {
    try {
      const response = await suratKeluarAPI.getById(id);
      setSurat(response.data.suratKeluar);
    } catch (error) {
      console.error("Fetch surat error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data.users?.filter((u) => u.id !== user.id) || []);
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

  const handleValidasi = async (isApproved) => {
    setSubmitting(true);
    try {
      await suratKeluarAPI.validate(id, { isApproved, catatan });
      setShowValidasiModal(false);
      setCatatan("");
      fetchSurat();
    } catch (error) {
      console.error("Validasi error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTTD = async (isApproved) => {
    setSubmitting(true);
    try {
      await suratKeluarAPI.sign(id, { isApproved, catatan });
      setShowTTDModal(false);
      setCatatan("");
      fetchSurat();
    } catch (error) {
      console.error("TTD error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKirim = async () => {
    setSubmitting(true);
    try {
      await suratKeluarAPI.send(id, { ekspedisi, catatan });
      setShowKirimModal(false);
      setCatatan("");
      setEkspedisi("");
      fetchSurat();
    } catch (error) {
      console.error("Kirim error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisposisi = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await disposisiAPI.create({
        ...disposisiForm,
        suratKeluarId: id,
      });
      setShowDisposisiModal(false);
      setDisposisiForm({
        toUserId: "",
        instruksi: "",
        catatan: "",
        isRequestLampiran: false,
      });
      fetchSurat();
    } catch (error) {
      console.error("Create disposisi error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadLampiran = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("suratKeluarId", id);

    try {
      await lampiranAPI.upload(formData);
      fetchSurat();
      setShowLampiranModal(false);
    } catch (error) {
      console.error("Upload lampiran error:", error);
    }
  };

  const handleProses = () => {
    setShowProsesModal(true);
  };

  const [selectedVariant, setSelectedVariant] = useState("INTERNAL"); // INTERNAL or EKSTERNAL

  const confirmProses = async () => {
    setSubmitting(true);
    try {
      await suratKeluarAPI.update(id, {
        status: STATUS_SURAT.DIPROSES,
        jenisSuratId: selectedJenisSuratId || undefined,
        variant: selectedVariant, // Pass variant to backend
        kodeArea: selectedKodeArea || surat?.kodeArea || "A", // Pass kode area
      });
      fetchSurat();
      setShowProsesModal(false);
    } catch (error) {
      console.error("Proses surat error:", error);
      alert("Gagal memproses surat");
    } finally {
      setSubmitting(false);
    }
  };

  // Track file opened
  const handleFileOpen = (fileUrl) => {
    if (!openedFiles.includes(fileUrl)) {
      const newOpenedFiles = [...openedFiles, fileUrl];
      setOpenedFiles(newOpenedFiles);
      localStorage.setItem("openedFiles", JSON.stringify(newOpenedFiles));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!surat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Surat tidak ditemukan</p>
      </div>
    );
  }

  // Determine available actions
  const canShowValidasi =
    canValidate(user?.role) && surat.status === "MENUNGGU_VALIDASI";
  const canShowTTD = isKetua(user?.role) && surat.status === "MENUNGGU_TTD";
  const canShowKirim =
    isAdmin(user?.role) && surat.isSigned && surat.status !== "SELESAI";
  const canShowProses =
    isAdmin(user?.role) && surat.status === STATUS_SURAT.PENGAJUAN;

  return (
    <div className="min-h-screen">
      <Header title="Detail Surat Keluar" />

      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate("/surat-keluar")}>
          <ArrowLeft size={20} />
          Kembali
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <Card.Header>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {surat.nomorSurat || "Draft - Belum ada nomor"}
                    </p>
                    <h2 className="text-xl font-bold text-gray-800">
                      {surat.perihal}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={surat.status} />
                    {surat.isSigned && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <PenTool size={12} />
                        Signed
                      </span>
                    )}
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="space-y-4">
                {/* Info Alert for Request */}
                {surat.status === STATUS_SURAT.PENGAJUAN && (
                  <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-800">
                        Permintaan Surat Keluar
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Surat ini diajukan oleh{" "}
                        <strong>{surat.createdBy?.nama}</strong> (
                        {ROLE_NAMES[surat.createdBy?.role]}). Silakan periksa
                        draft/lampiran di bawah ini sebelum memproses.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 col-span-2">
                  <div>
                    <p className="text-sm text-gray-500">Tujuan</p>
                    <p className="font-medium">{surat.tujuan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Perihal</p>
                    <p className="font-medium">{surat.perihal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Surat</p>
                    <p className="font-medium">
                      {surat.tanggalSurat
                        ? formatDate(surat.tanggalSurat)
                        : "-"}
                    </p>
                  </div>

                  {/* Kategori removed */}
                  <div>
                    <p className="text-sm text-gray-500">
                      {surat.status === STATUS_SURAT.PENGAJUAN
                        ? "Diajukan oleh"
                        : "Diajukan oleh"}
                    </p>
                    <p className="font-medium">{surat.createdBy?.nama}</p>
                  </div>
                  {surat.signedAt && (
                    <div>
                      <p className="text-sm text-gray-500">Ditandatangani</p>
                      <p className="font-medium">
                        {formatDate(surat.signedAt)}
                      </p>
                    </div>
                  )}
                </div>

                {surat.isiSurat && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Isi Surat</p>
                    <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                      {surat.isiSurat}
                    </div>
                  </div>
                )}

                {surat.fileUrl && (
                  <div className="pt-4 border-t">
                    <a
                      href={surat.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link inline-flex items-center gap-2"
                      onClick={() => handleFileOpen(surat.fileUrl)}
                    >
                      <Download size={18} />
                      Lihat/Download File Surat
                    </a>
                    {openedFiles.includes(surat.fileUrl) && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        ✓ Sudah dibuka
                      </span>
                    )}
                  </div>
                )}
              </Card.Body>
              <Card.Footer className="flex flex-wrap gap-3">
                {canShowProses && (
                  <Button
                    variant="primary"
                    onClick={handleProses}
                    loading={submitting}
                  >
                    <CheckCircle size={18} />
                    Proses Permintaan
                  </Button>
                )}
                {(isAdmin(user?.role) ||
                  (![
                    ROLES.KETUA_PENGURUS,
                    ROLES.SEKRETARIS_PENGURUS,
                    ROLES.BENDAHARA,
                  ].includes(user?.role) &&
                    surat.createdById === user?.id &&
                    [
                      STATUS_SURAT.PENGAJUAN,
                      STATUS_SURAT.DITOLAK,
                      STATUS_SURAT.DIKEMBALIKAN,
                    ].includes(surat.status))) && (
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/surat-keluar/edit/${surat.id}`)}
                  >
                    <Edit size={18} />
                    Edit Surat
                  </Button>
                )}
                {canShowValidasi && (
                  <Button
                    variant="success"
                    onClick={() => setShowValidasiModal(true)}
                  >
                    <CheckCircle size={18} />
                    Validasi Surat
                  </Button>
                )}
                {canShowTTD && (
                  <Button
                    variant="warning"
                    onClick={() => setShowTTDModal(true)}
                  >
                    <PenTool size={18} />
                    Tanda Tangan
                  </Button>
                )}
                {canShowKirim && (
                  <Button
                    variant="primary"
                    onClick={() => setShowKirimModal(true)}
                  >
                    <Truck size={18} />
                    Kirim Surat
                  </Button>
                )}
                {canDisposisi(user?.role) && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowDisposisiModal(true)}
                  >
                    <Send size={18} />
                    Buat Disposisi
                  </Button>
                )}
                {(isAdmin(user?.role) || isKabag(user?.role)) && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowLampiranModal(true)}
                  >
                    <Paperclip size={18} />
                    Upload Lampiran
                  </Button>
                )}
              </Card.Footer>
            </Card>

            {/* Tracking Timeline */}
            <Card>
              <Card.Header>
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock size={20} />
                  Riwayat Surat
                </h3>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="divide-y">
                  {surat.tracking?.map((track, index) => (
                    <div key={track.id} className="p-4 flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <CheckCircle size={16} />
                        </div>
                        {index < surat.tracking.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 my-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium text-gray-800">
                          {track.aksi}
                        </p>
                        <p className="text-sm text-gray-500">
                          {track.keterangan}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {track.user?.nama} • {formatDateTime(track.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Disposisi */}
            <Card>
              <Card.Header>
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText size={20} />
                  Disposisi ({surat.disposisi?.length || 0})
                </h3>
              </Card.Header>
              <Card.Body className="p-0">
                {surat.disposisi?.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Belum ada disposisi
                  </div>
                ) : (
                  <div className="divide-y">
                    {surat.disposisi?.map((d) => (
                      <div key={d.id} className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={12} className="text-blue-600" />
                          </div>
                          <span className="text-sm font-medium">
                            {d.fromUser?.nama}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-sm font-medium text-blue-600">
                            {d.toUser?.nama}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{d.instruksi}</p>
                        {d.isRequestLampiran && (
                          <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            Request Lampiran
                          </span>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDateTime(d.tanggalDisposisi)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Lampiran */}
            <Card>
              <Card.Header>
                <h3 className="font-semibold flex items-center gap-2">
                  <Paperclip size={20} />
                  Lampiran ({surat.lampiran?.length || 0})
                </h3>
              </Card.Header>
              <Card.Body className="p-0">
                {surat.lampiran?.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Belum ada lampiran
                  </div>
                ) : (
                  <div className="divide-y">
                    {surat.lampiran?.map((l) => (
                      <a
                        key={l.id}
                        href={l.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-link flex items-center gap-3 p-4 hover:bg-gray-50"
                        onClick={() => handleFileOpen(l.fileUrl)}
                      >
                        <FileText size={20} className="text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {l.namaFile}
                            {openedFiles.includes(l.fileUrl) && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                ✓ Sudah dibuka
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {l.uploadedBy?.nama}
                          </p>
                        </div>
                        <Download size={16} />
                      </a>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* Validasi Modal */}
      <Modal
        isOpen={showValidasiModal}
        onClose={() => setShowValidasiModal(false)}
        title="Validasi Surat Keluar"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Apakah Anda yakin ingin memvalidasi surat ini?
          </p>
          <div>
            <label className="form-label">Catatan (Opsional)</label>
            <textarea
              className="form-input"
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan catatan..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="danger"
              onClick={() => handleValidasi(false)}
              loading={submitting}
            >
              <XCircle size={18} />
              Tolak
            </Button>
            <Button
              variant="success"
              onClick={() => handleValidasi(true)}
              loading={submitting}
            >
              <CheckCircle size={18} />
              Setujui
            </Button>
          </div>
        </div>
      </Modal>

      {/* TTD Modal */}
      <Modal
        isOpen={showTTDModal}
        onClose={() => setShowTTDModal(false)}
        title="Tanda Tangan Surat"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tanda tangani surat ini? Nomor surat akan digenerate otomatis.
          </p>
          <div>
            <label className="form-label">Catatan (Opsional)</label>
            <textarea
              className="form-input"
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan catatan..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="danger"
              onClick={() => handleTTD(false)}
              loading={submitting}
            >
              <XCircle size={18} />
              Tolak
            </Button>
            <Button
              variant="warning"
              onClick={() => handleTTD(true)}
              loading={submitting}
            >
              <PenTool size={18} />
              Tanda Tangani
            </Button>
          </div>
        </div>
      </Modal>

      {/* Kirim Modal */}
      <Modal
        isOpen={showKirimModal}
        onClose={() => setShowKirimModal(false)}
        title="Kirim Surat"
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">Metode Pengiriman *</label>
            <select
              className="form-input"
              value={ekspedisi}
              onChange={(e) => setEkspedisi(e.target.value)}
              required
            >
              <option value="">Pilih metode...</option>
              <option value="Email">Email</option>
              <option value="Kurir">Kurir</option>
              <option value="Pos">Pos</option>
              <option value="Langsung">Antar Langsung</option>
            </select>
          </div>
          <div>
            <label className="form-label">Catatan (Opsional)</label>
            <textarea
              className="form-input"
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan pengiriman..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowKirimModal(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleKirim}
              loading={submitting}
              disabled={!ekspedisi}
            >
              <Truck size={18} />
              Kirim
            </Button>
          </div>
        </div>
      </Modal>

      {/* Disposisi Modal */}
      <Modal
        isOpen={showDisposisiModal}
        onClose={() => setShowDisposisiModal(false)}
        title="Buat Disposisi"
      >
        <form onSubmit={handleDisposisi} className="space-y-4">
          <div>
            <label className="form-label">Kepada</label>
            <select
              className="form-input"
              value={disposisiForm.toUserId}
              onChange={(e) =>
                setDisposisiForm({ ...disposisiForm, toUserId: e.target.value })
              }
              required
            >
              <option value="">Pilih penerima...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama} ({ROLE_SHORT_NAMES[u.role]})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Instruksi</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Masukkan instruksi disposisi..."
              value={disposisiForm.instruksi}
              onChange={(e) =>
                setDisposisiForm({
                  ...disposisiForm,
                  instruksi: e.target.value,
                })
              }
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRequestLampiran"
              checked={disposisiForm.isRequestLampiran}
              onChange={(e) =>
                setDisposisiForm({
                  ...disposisiForm,
                  isRequestLampiran: e.target.checked,
                })
              }
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <label
              htmlFor="isRequestLampiran"
              className="text-sm text-gray-700"
            >
              Tandai sebagai permintaan lampiran
            </label>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowDisposisiModal(false)}
              type="button"
            >
              Batal
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Kirim
            </Button>
          </div>
        </form>
      </Modal>

      {/* Proses Request Modal */}
      <Modal
        isOpen={showProsesModal}
        onClose={() => setShowProsesModal(false)}
        title="Proses Surat Keluar"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Anda akan memproses permintaan ini menjadi Surat Keluar resmi.
            Silakan pilih jenis surat untuk menentukan format nomor surat.
          </p>
          <div>
            <label className="form-label">Jenis Surat</label>
            <select
              className="form-input"
              value={selectedJenisSuratId}
              onChange={(e) => setSelectedJenisSuratId(e.target.value)}
            >
              <option value="">-- Pilih Jenis Surat (Default: SK) --</option>
              {jenisSuratOptions.map((jenis) => (
                <option key={jenis.id} value={jenis.id}>
                  {jenis.nama} ({jenis.kode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Kode Area / Tujuan</label>
            <select
              className="form-input"
              value={selectedKodeArea || surat?.kodeArea || "A"}
              onChange={(e) => setSelectedKodeArea(e.target.value)}
            >
              {kodeAreaOptions.map((area) => (
                <option key={area.id} value={area.kode}>
                  {area.kode} - {area.nama}
                </option>
              ))}
            </select>
            {surat?.kodeArea && (
              <p className="text-xs text-gray-500 mt-1">
                Kode area dari pengaju: {surat.kodeArea}
              </p>
            )}
          </div>

          <div>
            <label className="form-label">Format Lingkup Bagian</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="variant"
                  value="INTERNAL"
                  checked={selectedVariant === "INTERNAL"}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Internal (PERS, KEU, dll)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="variant"
                  value="EKSTERNAL"
                  checked={selectedVariant === "EKSTERNAL"}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Eksternal (HRD, FINC, dll)</span>
              </label>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
            Preview Nomor: .../
            {jenisSuratOptions.find((j) => j.id === selectedJenisSuratId)
              ?.kode || "SK"}
            /...
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowProsesModal(false)}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={confirmProses}
              loading={submitting}
            >
              Proses & Generate Nomor
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lampiran Modal */}
      <Modal
        isOpen={showLampiranModal}
        onClose={() => setShowLampiranModal(false)}
        title="Upload Lampiran"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Pilih file untuk diupload sebagai lampiran.
          </p>
          <input
            type="file"
            onChange={handleUploadLampiran}
            className="form-input"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowLampiranModal(false)}
            >
              Batal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuratKeluarDetail;
