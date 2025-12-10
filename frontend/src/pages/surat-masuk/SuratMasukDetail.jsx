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
  Plus,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  suratMasukAPI,
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
  isKabag,
  ROLES,
  ROLE_SHORT_NAMES,
  KATEGORI_NAMES,
} from "../../utils/constants";
import { formatDate, formatDateTime } from "../../utils/helpers";

const SuratMasukDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [surat, setSurat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDisposisiModal, setShowDisposisiModal] = useState(false);
  const [showLampiranModal, setShowLampiranModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [disposisiForm, setDisposisiForm] = useState({
    toUserId: "",
    instruksi: "",
    catatan: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSurat();
    fetchUsers();
  }, [id]);

  const fetchSurat = async () => {
    try {
      const response = await suratMasukAPI.getById(id);
      setSurat(response.data.suratMasuk);
    } catch (error) {
      console.error("Fetch surat error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      console.log(response.data.users);
      setUsers(response.data.users?.filter((u) => u.id !== user.id) || []);
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

  const handleDisposisi = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await disposisiAPI.create({
        ...disposisiForm,
        suratMasukId: id,
      });
      setShowDisposisiModal(false);
      setDisposisiForm({ toUserId: "", instruksi: "", catatan: "" });
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
    formData.append("suratMasukId", id);

    try {
      await lampiranAPI.upload(formData);
      fetchSurat();
      setShowLampiranModal(false);
    } catch (error) {
      console.error("Upload lampiran error:", error);
    }
  };

  // Check if user can create disposisi
  const canCreateDisposisi = () => {
    if (isAdmin(user?.role)) return true;
    // Check if user has received disposisi for this surat
    return surat?.disposisi?.some((d) => d.toUserId === user?.id);
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

  return (
    <div className="min-h-screen">
      <Header title="Detail Surat Masuk" />

      <div className="p-6 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate("/surat-masuk")}>
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
                      {surat.nomorSurat}
                    </p>
                    <h2 className="text-xl font-bold text-gray-800">
                      {surat.perihal}
                    </h2>
                  </div>
                  <StatusBadge status={surat.status} />
                </div>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Pengirim</p>
                    <p className="font-medium">{surat.pengirim}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Surat</p>
                    <p className="font-medium">
                      {formatDate(surat.tanggalSurat)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Diterima</p>
                    <p className="font-medium">
                      {formatDate(surat.tanggalDiterima)}
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
                    <p className="text-sm text-gray-500">Diterima Oleh</p>
                    <p className="font-medium">{surat.createdBy?.nama}</p>
                  </div>
                </div>

                {surat.keterangan && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Keterangan</p>
                    <p className="text-gray-700">{surat.keterangan}</p>
                  </div>
                )}

                {/* File Preview */}
                {surat.fileUrl && (
                  <div className="pt-4 border-t">
                    <a
                      href={surat.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link inline-flex items-center gap-2"
                    >
                      <Download size={18} />
                      Lihat/Download File Surat
                    </a>
                  </div>
                )}
              </Card.Body>
              <Card.Footer className="flex gap-3">
                {canCreateDisposisi() && (
                  <Button
                    variant="primary"
                    onClick={() => setShowDisposisiModal(true)}
                  >
                    <Send size={18} />
                    Buat Disposisi
                  </Button>
                )}
                {(isAdmin(user?.role) || isKabag(user?.role)) && (
                  <Button
                    variant="secondary"
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
            {/* Disposisi List */}
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
                        {d.catatan && (
                          <p className="text-xs text-gray-500 mt-1">
                            {d.catatan}
                          </p>
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
                      >
                        <FileText size={20} className="text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {l.namaFile}
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

      {/* Disposisi Modal */}
      <Modal
        isOpen={showDisposisiModal}
        onClose={() => setShowDisposisiModal(false)}
        title="Buat Disposisi"
      >
        <form onSubmit={handleDisposisi} className="space-y-4">
          <div>
            <label className="form-label">Tujuan Disposisi</label>
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
          <div>
            <label className="form-label">Catatan (Opsional)</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Catatan tambahan..."
              value={disposisiForm.catatan}
              onChange={(e) =>
                setDisposisiForm({ ...disposisiForm, catatan: e.target.value })
              }
            />
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
              Kirim Disposisi
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

export default SuratMasukDetail;
