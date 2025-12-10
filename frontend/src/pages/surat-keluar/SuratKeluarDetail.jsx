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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  suratKeluarAPI,
  disposisiAPI,
  userAPI,
  lampiranAPI,
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
  ROLE_SHORT_NAMES,
  KATEGORI_NAMES,
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
  const [submitting, setSubmitting] = useState(false);
  const [openedFiles, setOpenedFiles] = useState([]);

  useEffect(() => {
    fetchSurat();
    fetchUsers();
    // Load opened files from localStorage
    const stored = localStorage.getItem("openedFiles");
    if (stored) {
      setOpenedFiles(JSON.parse(stored));
    }
  }, [id]);

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

  const handleProses = async () => {
    if (
      !window.confirm(
        "Proses permintaan ini menjadi Surat Keluar resmi? Nomor surat akan digenerate otomatis."
      )
    )
      return;

    setSubmitting(true);
    try {
      await suratKeluarAPI.update(id, { status: STATUS_SURAT.DIPROSES });
      fetchSurat();
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Tujuan</p>
                    <p className="font-medium">{surat.tujuan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Surat</p>
                    <p className="font-medium">
                      {surat.tanggalSurat
                        ? formatDate(surat.tanggalSurat)
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Jenis Surat</p>
                    <p className="font-medium">{surat.jenisSurat}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kategori</p>
                    <p className="font-medium">
                      {KATEGORI_NAMES[surat.kategori]}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dibuat Oleh</p>
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
                {isAdmin(user?.role) && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowDisposisiModal(true)}
                  >
                    <Send size={18} />
                    Minta Lampiran
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
        title="Minta Lampiran"
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
