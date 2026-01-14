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
  Trash2,
  Eye,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  suratKeluarAPI,
  disposisiAPI,
  userAPI,
  lampiranAPI,
  jenisSuratAPI,
  kodeAreaAPI,
  kodeBagianAPI,
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
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showKirimModal, setShowKirimModal] = useState(false);
  const [showDisposisiModal, setShowDisposisiModal] = useState(false);
  const [showLampiranModal, setShowLampiranModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [showDraftModal, setShowDraftModal] = useState(false);
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
  const [selectedVariant, setSelectedVariant] = useState("INTERNAL");
  const [kodeBagianOptions, setKodeBagianOptions] = useState([]);
  const [selectedKodeBagianId, setSelectedKodeBagianId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [trackingPage, setTrackingPage] = useState(1);
  const [disposisiPage, setDisposisiPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [openedFiles, setOpenedFiles] = useState([]);
  const [showUploadFinalModal, setShowUploadFinalModal] = useState(false);
  const [finalFile, setFinalFile] = useState(null);
  const [lampiranFile, setLampiranFile] = useState(null);

  const handleUploadFinal = async (e) => {
    e.preventDefault();
    if (!finalFile) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", finalFile);
      formData.append("isFinalFile", "true");
      if (selectedJenisSuratId)
        formData.append("jenisSuratId", selectedJenisSuratId);
      if (selectedKodeArea) formData.append("kodeArea", selectedKodeArea);
      if (selectedKodeBagianId)
        formData.append("kodeBagianId", selectedKodeBagianId);
      if (selectedVariant) formData.append("variant", selectedVariant);

      await suratKeluarAPI.update(id, formData);
      setShowUploadFinalModal(false);
      setFinalFile(null);
      fetchSurat();
    } catch (error) {
      console.error("Upload final file error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchSurat();
    fetchUsers();
    if (isAdmin(user?.role)) {
      fetchJenisSurat();
      fetchKodeArea();
      fetchKodeBagian();
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

  const fetchKodeBagian = async () => {
    try {
      const response = await kodeBagianAPI.getAll();
      setKodeBagianOptions(response.data.data);
    } catch (error) {
      console.error("Fetch kode bagian error:", error);
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
      setUsers(
        (response.data.data || response.data.users)?.filter(
          (u) => u.id !== user.id
        ) || []
      );
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

  const handleApprove = async (isApproved) => {
    setSubmitting(true);
    try {
      await suratKeluarAPI.approve(id, { isApproved, catatan });
      setShowApproveModal(false);
      setCatatan("");
      fetchSurat();
    } catch (error) {
      console.error("Approve error:", error);
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

  const getPreviewUrl = (url) => {
    if (!url) return "#";
    // Clean URL query params
    const cleanUrl = url.split("?")[0];
    const extension = cleanUrl.split(".").pop().toLowerCase();
    // Only allow images to be previewed natively. PDF and others go to GDocs to avoid "force download" headers
    const browserPreviewable = ["jpg", "jpeg", "png", "webp", "gif"];

    if (browserPreviewable.includes(extension)) {
      return url;
    }

    // Fallback to Google Docs Viewer for office files or unknown types
    return `https://docs.google.com/viewer?url=${encodeURIComponent(
      url
    )}&embedded=true`;
  };

  const getDownloadUrl = (url, prefix = "Surat_Keluar") => {
    if (!url) return "#";
    // Check if it's a Cloudinary URL
    if (url.includes("cloudinary.com")) {
      // Clean filename from URL
      const cleanUrl = url.split("?")[0];
      const extension = cleanUrl.split(".").pop().toLowerCase();

      // Sanitize Perihal/Number for filename
      const safePerihal = (surat?.perihal || "Dokumen")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .substring(0, 30);
      const safeNomor = (
        surat?.nomorSurat ||
        surat?.nomorSuratAdmin ||
        "No_Num"
      ).replace(/[^a-zA-Z0-9]/g, "_");

      const filename = `${prefix}_${safeNomor}_${safePerihal}`;

      // Insert fl_attachment:[filename] before /v[version]/
      // Pattern: .../upload/v... -> .../upload/fl_attachment:[filename]/v...
      return url.replace(/\/upload\//, `/upload/fl_attachment:${filename}/`);
    }
    return url;
  };

  const handleDisposisi = async (e) => {
    e.preventDefault();
    if (!disposisiForm.toUserId) {
      alert("Mohon pilih penerima disposisi!");
      return;
    }
    setSubmitting(true);
    try {
      await disposisiAPI.create({
        ...disposisiForm,
        suratKeluarId: id,
      });
      setShowDisposisiModal(false);
      setDisposisiForm({
        toUserId: "",
        instruksi: "Mohon ditindaklanjuti",
        isRequestLampiran: false,
      });
      fetchSurat();
      alert("Disposisi berhasil dikirim");
    } catch (error) {
      console.error("Disposisi error:", error);
      alert(
        "Gagal mengirim disposisi: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadLampiran = async () => {
    if (!lampiranFile) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("file", lampiranFile);
    formData.append("suratKeluarId", id);

    try {
      await lampiranAPI.upload(formData);
      fetchSurat();
      setShowLampiranModal(false);
      setLampiranFile(null);
    } catch (error) {
      console.error("Upload lampiran error:", error);
      alert("Gagal mengupload lampiran");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessDraft = async (isApproved) => {
    setSubmitting(true);
    try {
      const status = isApproved
        ? STATUS_SURAT.DITERIMA
        : STATUS_SURAT.DIKEMBALIKAN;

      await suratKeluarAPI.update(id, {
        status,
        catatan, // Backend now supports this for tracking log
      });

      setShowDraftModal(false);
      setCatatan("");
      fetchSurat();
    } catch (e) {
      console.error(e);
      alert("Gagal memproses draft.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProses = () => {
    setShowProsesModal(true);
  };

  const confirmProses = async () => {
    // No file required for initial processing
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("status", STATUS_SURAT.DIPROSES);
      // We don't generate number or save variant/jenis here anymore, but we can save them as draft properties if backend supports it.
      // For now, let's keep sending them so they are saved for later use/display.
      if (selectedJenisSuratId)
        formData.append("jenisSuratId", selectedJenisSuratId);
      formData.append("variant", selectedVariant);
      formData.append("kodeArea", selectedKodeArea || surat?.kodeArea || "A");
      if (selectedKodeBagianId)
        formData.append("kodeBagianId", selectedKodeBagianId);

      // Removed file appending

      await suratKeluarAPI.update(id, formData);
      setShowProsesModal(false);
      // setFinalFile(null); // No file to clear
      fetchSurat();
    } catch (error) {
      console.error("Proses error:", error);
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
  const isReadOnly = [STATUS_SURAT.SELESAI].includes(surat.status);
  // Allow editing if DIKEMBALIKAN (to re-submit)

  const canShowValidasi =
    !isReadOnly &&
    canValidate(user?.role) &&
    [STATUS_SURAT.MENUNGGU_VERIFIKASI].includes(surat.status);

  // Ketua can approve FINAL (Status MENUNGGU_PERSETUJUAN)
  const isDisposedToUser = surat.disposisi?.some(
    (d) => d.toUserId === user?.id
  );

  const canShowApprove =
    !isReadOnly &&
    isKetua(user?.role) &&
    surat.status === STATUS_SURAT.MENUNGGU_TTD;

  // Admin can send if status is SELESAI (Finalized)
  const canShowKirim =
    !isReadOnly && isAdmin(user?.role) && surat.status === STATUS_SURAT.SELESAI;

  const canShowProses =
    !isReadOnly &&
    isAdmin(user?.role) &&
    surat.status === STATUS_SURAT.PENGAJUAN;

  // Disposisi button logic:
  // Admin: Allowed if DIPROSES (to Sek/Ben) OR DISETUJUI (to Verifikator).
  // Others: Allowed if MENUNGGU_PERSETUJUAN (passing chain) OR MENUNGGU_VERIFIKASI (passing chain verification).
  const canShowDisposisi =
    isAdmin(user?.role) ||
    (canDisposisi(user?.role) &&
      [
        STATUS_SURAT.MENUNGGU_PERSETUJUAN,
        STATUS_SURAT.MENUNGGU_VERIFIKASI,
        STATUS_SURAT.DITERIMA,
        STATUS_SURAT.DISETUJUI,
        STATUS_SURAT.SELESAI,
      ].includes(surat.status));

  // Show "Setujui" or "Verifikasi" depending on stage?
  // Use canShowValidasi (for Menunggu Verifikasi) and canShowApprove (for Menunggu Persetujuan/Ketua).

  // Edit and Upload Lampiran also disabled when read-only
  const canShowEdit = !isReadOnly;
  const canShowUploadLampiran = !isReadOnly;

  // New Button: Upload Final (Admin Only) when DISETUJUI or DIKEMBALIKAN (if it has number)
  const canShowUploadFinal =
    !isReadOnly &&
    isAdmin(user?.role) &&
    (surat.status === STATUS_SURAT.DITERIMA ||
      (surat.status === STATUS_SURAT.DISETUJUI && surat.nomorSuratAdmin) ||
      (surat.status === STATUS_SURAT.DIKEMBALIKAN && surat.nomorSuratAdmin));

  return (
    <div className="min-h-screen">
      <Header title="Detail Surat Keluar" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
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
                        Ditandatangani
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

                {/* File Section */}
                <div className="pt-4 border-t space-y-4">
                  {/* Draft File */}
                  {surat.fileUrl && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        File Pengajuan (Draft)
                      </p>
                      <div className="flex gap-2">
                        <a
                          href={getPreviewUrl(surat.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-link inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 text-sm no-underline"
                          onClick={() => handleFileOpen(surat.fileUrl)}
                        >
                          <Eye size={16} />
                          Lihat Surat
                        </a>
                        <a
                          href={getDownloadUrl(surat.fileUrl, "Draft")}
                          download
                          className="file-link inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-sm no-underline"
                        >
                          <Download size={16} />
                          Unduh
                        </a>
                      </div>
                      {openedFiles.includes(surat.fileUrl) && (
                        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle size={12} /> Sudah dilihat
                        </p>
                      )}
                    </div>
                  )}

                  {/* Final File */}
                  {(surat.finalFileUrl || isAdmin(user?.role)) && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-500">
                          File Surat Resmi (Final)
                        </p>
                        {isAdmin(user?.role) &&
                          !isReadOnly &&
                          surat.finalFileUrl && (
                            <button
                              onClick={() => setShowUploadFinalModal(true)}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Paperclip size={12} />
                              {"Ubah File"}
                            </button>
                          )}
                      </div>
                      {surat.finalFileUrl ? (
                        <div>
                          <div className="flex gap-2">
                            <a
                              href={getPreviewUrl(surat.finalFileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-link inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-sm no-underline"
                              onClick={() => handleFileOpen(surat.finalFileUrl)}
                            >
                              <Eye size={16} />
                              Lihat Surat
                            </a>
                            <a
                              href={getDownloadUrl(surat.finalFileUrl)}
                              download
                              className="file-link inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-sm no-underline"
                            >
                              <Download size={16} />
                              Unduh
                            </a>
                          </div>
                          {openedFiles.includes(surat.finalFileUrl) && (
                            <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                              <CheckCircle size={12} /> Sudah dilihat
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          Belum ada surat resmi diupload
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card.Body>

              {/* Upload Final File Modal */}
              <Modal
                isOpen={showUploadFinalModal}
                onClose={() => setShowUploadFinalModal(false)}
                title="Upload Surat Resmi"
              >
                <form onSubmit={handleUploadFinal} className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload file surat resmi yang sudah diproses. Pastikan
                      memilih Jenis Surat dan Kode Area untuk generate nomor
                      baru.
                    </p>

                    {/* Selectors for Generation */}
                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="form-label">Jenis Surat</label>
                        <select
                          className="form-input"
                          value={selectedJenisSuratId}
                          onChange={(e) =>
                            setSelectedJenisSuratId(e.target.value)
                          }
                        >
                          <option value="">
                            -- Pilih Jenis Surat (Default: SK) --
                          </option>
                          {jenisSuratOptions.map((jenis) => (
                            <option key={jenis.id} value={jenis.id}>
                              {jenis.nama} ({jenis.kode})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* New Kode Bagian Selector */}
                      <div>
                        <label className="form-label">
                          Atas Nama (Kode Bagian)
                        </label>
                        <select
                          className="form-input"
                          value={selectedKodeBagianId}
                          onChange={(e) =>
                            setSelectedKodeBagianId(e.target.value)
                          }
                        >
                          <option value="">
                            -- Default (Sesuai Pembuat) --
                          </option>
                          {kodeBagianOptions.map((bagian) => (
                            <option key={bagian.id} value={bagian.id}>
                              {bagian.nama} ({bagian.kodeInternal}/
                              {bagian.kodeEksternal})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="form-label">Kode Area</label>
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
                      </div>

                      <div>
                        <label className="form-label">
                          Format Lingkup Bagian
                        </label>
                        <div className="flex gap-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="variantUpload"
                              value="INTERNAL"
                              checked={selectedVariant === "INTERNAL"}
                              onChange={(e) =>
                                setSelectedVariant(e.target.value)
                              }
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">Internal</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="variantUpload"
                              value="EKSTERNAL"
                              checked={selectedVariant === "EKSTERNAL"}
                              onChange={(e) =>
                                setSelectedVariant(e.target.value)
                              }
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">Eksternal</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Surat (PDF/Doc)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setFinalFile(e.target.files[0])}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      accept=".pdf,.doc,.docx"
                      required
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => setShowUploadFinalModal(false)}
                      type="button"
                    >
                      Batal
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      loading={submitting}
                    >
                      Unggah
                    </Button>
                  </div>
                </form>
              </Modal>
              <Card.Footer className="flex flex-wrap gap-3">
                {canShowUploadFinal && (
                  <Button
                    variant="primary"
                    onClick={() => setShowUploadFinalModal(true)}
                  >
                    <Paperclip size={18} />
                    Upload Final & Buat Nomor
                  </Button>
                )}
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
                {
                  /* Edit Button: Hide when rejected or for Admin if status is PENGAJUAN */
                  canShowEdit &&
                    (isAdmin(user?.role)
                      ? surat.status !== STATUS_SURAT.PENGAJUAN // Admin: Hide if Pengajuan
                      : ![
                          ROLES.KETUA_PENGURUS,
                          ROLES.SEKRETARIS_PENGURUS,
                          ROLES.BENDAHARA,
                        ].includes(user?.role) &&
                        surat.createdById === user?.id &&
                        [STATUS_SURAT.PENGAJUAN, STATUS_SURAT.DITOLAK].includes(
                          surat.status
                        )) && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          navigate(`/surat-keluar/edit/${surat.id}`)
                        }
                      >
                        <Edit size={18} />
                        Edit Surat
                      </Button>
                    )
                }
                {!isAdmin(user?.role) &&
                  canDisposisi(user?.role) &&
                  surat.status === STATUS_SURAT.MENUNGGU_PERSETUJUAN && (
                    <Button
                      variant="success"
                      onClick={() => setShowDraftModal(true)}
                      loading={submitting}
                    >
                      <CheckCircle size={18} />
                      Setujui Draft
                    </Button>
                  )}
                {canShowValidasi && (
                  <Button
                    variant="success"
                    onClick={() => setShowValidasiModal(true)}
                  >
                    <CheckCircle size={18} />
                    Verifikasi Surat
                  </Button>
                )}
                {canShowApprove && (
                  <Button
                    variant="success"
                    onClick={() => setShowApproveModal(true)}
                  >
                    <CheckCircle size={18} />
                    Setujui / ACC
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
                {canShowDisposisi && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowDisposisiModal(true)}
                  >
                    <Send size={18} />
                    Disposisi Surat
                  </Button>
                )}
                {
                  /* Upload Lampiran: Hide when rejected or for Admin if status is PENGAJUAN */
                  canShowUploadLampiran &&
                    (isAdmin(user?.role)
                      ? surat.status !== STATUS_SURAT.PENGAJUAN
                      : isKabag(user?.role)) && (
                      <Button
                        variant="ghost"
                        onClick={() => setShowLampiranModal(true)}
                      >
                        <Paperclip size={18} />
                        Upload Lampiran
                      </Button>
                    )
                }
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
                  {(surat.tracking || [])
                    .slice(
                      (trackingPage - 1) * ITEMS_PER_PAGE,
                      trackingPage * ITEMS_PER_PAGE
                    )
                    .map((track, i) => {
                      const absoluteIndex =
                        (trackingPage - 1) * ITEMS_PER_PAGE + i;
                      return (
                        <div key={track.id} className="p-4 flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                absoluteIndex === 0
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              <CheckCircle size={16} />
                            </div>
                            {absoluteIndex < surat.tracking.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-200 my-2"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium text-gray-800">
                              {track.aksi}
                            </p>
                            {track.keterangan &&
                              (track.aksi.toLowerCase().includes("tolak") ||
                              track.aksi
                                .toLowerCase()
                                .includes("dikembalikan") ? (
                                <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-lg text-sm">
                                  <span className="font-medium text-red-700">
                                    Catatan:{" "}
                                  </span>
                                  <span className="text-red-600">
                                    {track.keterangan}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  {track.keterangan}
                                </p>
                              ))}
                            <p className="text-xs text-gray-400 mt-1">
                              {track.user?.nama} •{" "}
                              {formatDateTime(track.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
                {/* Pagination Controls */}
                {surat.tracking?.length > ITEMS_PER_PAGE && (
                  <div className="flex justify-center items-center gap-4 p-4 border-t">
                    <Button
                      variant="ghost"
                      size="small"
                      disabled={trackingPage === 1}
                      onClick={() => setTrackingPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Halaman {trackingPage} dari{" "}
                      {Math.ceil(surat.tracking.length / ITEMS_PER_PAGE)}
                    </span>
                    <Button
                      variant="ghost"
                      size="small"
                      disabled={
                        trackingPage ===
                        Math.ceil(surat.tracking.length / ITEMS_PER_PAGE)
                      }
                      onClick={() => setTrackingPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
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
                  <>
                    <div className="divide-y">
                      {(surat.disposisi || [])
                        .slice(
                          (disposisiPage - 1) * ITEMS_PER_PAGE,
                          disposisiPage * ITEMS_PER_PAGE
                        )
                        .map((d) => (
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
                            <p className="text-sm text-gray-700">
                              {d.instruksi}
                            </p>
                            {d.isRequestLampiran && (
                              <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                                Permintaan Lampiran
                              </span>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDateTime(d.tanggalDisposisi)}
                            </p>
                          </div>
                        ))}
                    </div>
                    {/* Pagination Controls */}
                    {surat.disposisi?.length > ITEMS_PER_PAGE && (
                      <div className="flex justify-center items-center gap-4 p-4 border-t">
                        <Button
                          variant="ghost"
                          size="small"
                          disabled={disposisiPage === 1}
                          onClick={() => setDisposisiPage((p) => p - 1)}
                        >
                          Sebelumnya
                        </Button>
                        <span className="text-sm text-gray-600">
                          Halaman {disposisiPage} dari{" "}
                          {Math.ceil(surat.disposisi.length / ITEMS_PER_PAGE)}
                        </span>
                        <Button
                          variant="ghost"
                          size="small"
                          disabled={
                            disposisiPage ===
                            Math.ceil(surat.disposisi.length / ITEMS_PER_PAGE)
                          }
                          onClick={() => setDisposisiPage((p) => p + 1)}
                        >
                          Selanjutnya
                        </Button>
                      </div>
                    )}
                  </>
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

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Persetujuan Surat Keluar"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Apakah Anda menyetujui surat ini untuk dikeluarkan? Status akan
            berubah menjadi DISETUJUI dan Admin dapat melanjutkan pengiriman.
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
              onClick={() => handleApprove(false)}
              loading={submitting}
            >
              <XCircle size={18} />
              Tolak
            </Button>
            <Button
              variant="success"
              onClick={() => handleApprove(true)}
              loading={submitting}
            >
              <CheckCircle size={18} />
              Setujui
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
        title="Disposisi Surat"
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
            <div className="flex justify-between items-center mb-1">
              <label className="form-label mb-0">Catatan</label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPersetujuan"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setDisposisiForm((prev) => ({
                        ...prev,
                        instruksi:
                          "Mohon diperiksa dan disetujui/ditandatangani.",
                      }));
                    }
                  }}
                />
                <label
                  htmlFor="isPersetujuan"
                  className="text-xs text-gray-600 cursor-pointer select-none"
                >
                  Minta Persetujuan/TTD
                </label>
              </div>
            </div>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Masukkan instruksi..."
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

          <div>
            <label className="form-label">Upload Surat Resmi (Final) *</label>
            <input
              type="file"
              onChange={(e) => setFinalFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mt-2"
              accept=".pdf,.doc,.docx"
              required
            />
          </div>
          <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
            Pratinjau Nomor: .../
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
              disabled={!finalFile}
            >
              Proses & Buat Nomor
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lampiran Modal */}
      <Modal
        isOpen={showLampiranModal}
        onClose={() => {
          setShowLampiranModal(false);
          setLampiranFile(null);
        }}
        title="Upload Lampiran"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Pilih file untuk diupload sebagai lampiran surat ini.
          </p>
          <div>
            <label className="form-label">File Lampiran *</label>
            <input
              type="file"
              onChange={(e) => setLampiranFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mt-2"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>
          {lampiranFile && (
            <div className="bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-sm font-medium text-gray-700">File dipilih:</p>
              <p className="text-sm text-gray-600 truncate">
                {lampiranFile.name}
              </p>
              <p className="text-xs text-gray-400">
                {(lampiranFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowLampiranModal(false);
                setLampiranFile(null);
              }}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleUploadLampiran}
              loading={submitting}
              disabled={!lampiranFile}
            >
              <Paperclip size={18} />
              Unggah
            </Button>
          </div>
        </div>
      </Modal>

      {/* Draft Approval Modal */}
      <Modal
        isOpen={showDraftModal}
        onClose={() => setShowDraftModal(false)}
        title="Konfirmasi Persetujuan Draft"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Apakah Anda ingin menyetujui draft ini?
            <br />
            <span className="font-medium text-green-600">Setujui:</span> Status
            menjadi DITERIMA (Siap diproses admin).
            <br />
            <span className="font-medium text-red-600">Tolak:</span> Status
            menjadi DIKEMBALIKAN (Perlu revisi).
          </p>
          <div>
            <label className="form-label">Catatan (Wajib jika menolak)</label>
            <textarea
              className="form-input"
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Berikan catatan atau alasan..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="danger"
              onClick={() => {
                if (!catatan) {
                  alert("Harap isi catatan jika menolak/mengembalikan draft!");
                  return;
                }
                handleProcessDraft(false);
              }}
              loading={submitting}
            >
              <XCircle size={18} />
              Tolak / Kembalikan
            </Button>
            <Button
              variant="success"
              onClick={() => handleProcessDraft(true)}
              loading={submitting}
            >
              <CheckCircle size={18} />
              Setujui
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuratKeluarDetail;
