import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Filter,
  Download,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { disposisiAPI, suratKeluarAPI, trackingAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import {
  STATUS_DISPOSISI,
  ROLE_SHORT_NAMES,
  STATUS_SURAT,
  isKetua,
  isAdmin,
  canDisposisi,
} from "../../utils/constants";
import { formatDateTime, truncateText } from "../../utils/helpers";
import Pagination from "../../components/common/Pagination";

const DisposisiList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [disposisiList, setDisposisiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Approval Modal State
  const [approvalModal, setApprovalModal] = useState({
    isOpen: false,
    type: null,
    suratId: null,
    step: "CHOICE", // CHOICE | REJECT
  });
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchDisposisi();
  }, []);

  const fetchDisposisi = async () => {
    try {
      const response = await disposisiAPI.getMy();
      setDisposisiList(response.data.disposisi);
    } catch (error) {
      console.error("Fetch disposisi error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url, suratMasukId, suratKeluarId) => {
    try {
      await trackingAPI.create({
        aksi: "Mendownload Surat",
        keterangan: "Download dari Disposisi",
        suratMasukId,
        suratKeluarId,
      });
    } catch (error) {
      console.error("Tracking download error:", error);
    }
    window.open(url, "_blank");
  };

  const openApprovalModal = (type, suratId) => {
    setApprovalModal({ isOpen: true, type, suratId, step: "CHOICE" });
    setRejectReason("");
  };

  const closeApprovalModal = () => {
    setApprovalModal({ ...approvalModal, isOpen: false });
  };

  const handleConfirmApprove = async () => {
    try {
      const { type, suratId } = approvalModal;
      if (type === "DRAFT") {
        await suratKeluarAPI.update(suratId, { status: STATUS_SURAT.DITERIMA });
        await trackingAPI.create({
          aksi: "Menyetujui Draft",
          suratKeluarId: suratId,
        });
      } else if (type === "ACC") {
        await suratKeluarAPI.approve(suratId, { isApproved: true });
        await trackingAPI.create({
          aksi: "Menandatangani Surat",
          suratKeluarId: suratId,
        });
      }
      fetchDisposisi();
      closeApprovalModal();
      alert("Surat berhasil disetujui");
    } catch (error) {
      console.error("Approve error:", error);
      alert(
        "Gagal menyetujui surat: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert("Mohon isi alasan penolakan");
      return;
    }
    try {
      const { suratId } = approvalModal;
      await suratKeluarAPI.update(suratId, {
        status: STATUS_SURAT.DIKEMBALIKAN,
        keterangan: rejectReason,
      });
      await trackingAPI.create({
        aksi: "Menolak Surat",
        keterangan: rejectReason,
        suratKeluarId: suratId,
      });
      fetchDisposisi();
      closeApprovalModal();
      alert("Surat berhasil ditolak");
    } catch (error) {
      console.error("Reject error:", error);
      alert("Gagal menolak surat");
    }
  };

  const handleComplete = async (id) => {
    try {
      await disposisiAPI.complete(id, { catatan: "Disposisi selesai" });
      fetchDisposisi();
    } catch (error) {
      console.error("Complete disposisi error:", error);
    }
  };

  // Determine effective status (visual only)
  // If the parent surat is SELESAI, then this disposisi is effectively SELESAI
  const getEffectiveStatus = (disposisi) => {
    const suratStatus =
      disposisi.suratMasuk?.status || disposisi.suratKeluar?.status;
    if (suratStatus === "SELESAI") {
      return "SELESAI";
    }
    return disposisi.status;
  };

  const filteredDisposisi = disposisiList.filter((d) => {
    const status = getEffectiveStatus(d);
    return !filterStatus || status === filterStatus;
  });

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  // Paginate filtered data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDisposisi.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-100";
      case "DITERUSKAN":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "DITINDAKLANJUTI":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "SELESAI":
        return "bg-green-50 text-green-700 border-green-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Disposisi Saya" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Filter */}
        <div className="flex gap-3">
          <select
            className="form-input max-w-[200px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="PENDING">Pending</option>
            <option value="DITINDAKLANJUTI">Ditindaklanjuti</option>
            <option value="SELESAI">Selesai</option>
          </select>
        </div>

        {/* Disposisi List */}
        {filteredDisposisi.length === 0 ? (
          <Card className="p-12 text-center card-modern border-0">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="text-gray-300" size={40} />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              Tidak ada disposisi
            </h3>
            <p className="text-gray-400 max-w-sm mx-auto">
              Belum ada disposisi yang ditujukan kepada Anda saat ini.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {currentItems.map((disposisi) => {
              const effectiveStatus = getEffectiveStatus(disposisi);
              return (
                <Card
                  key={disposisi.id}
                  className="p-6 card-modern border-0 transition-all hover:shadow-md"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                            effectiveStatus
                          )}`}
                        >
                          {effectiveStatus}
                        </span>
                        {disposisi.isRequestLampiran && (
                          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-50 text-orange-700 border border-orange-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            Request Lampiran
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-gray-800 mb-1">
                        {truncateText(disposisi.instruksi, 100)}
                      </h3>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>
                          Dari: {disposisi.fromUser?.nama} (
                          {ROLE_SHORT_NAMES[disposisi.fromUser?.role]})
                        </span>
                        <span>
                          {formatDateTime(disposisi.tanggalDisposisi)}
                        </span>
                      </div>

                      {/* Surat info */}
                      {(disposisi.suratMasuk || disposisi.suratKeluar) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700">
                            {disposisi.suratMasuk
                              ? `Surat Masuk: ${disposisi.suratMasuk.perihal}`
                              : `Surat Keluar: ${disposisi.suratKeluar.perihal}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {disposisi.suratMasuk?.nomorSurat ||
                              disposisi.suratKeluar?.nomorSurat ||
                              "Draft"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                      {/* Download Action */}
                      {(disposisi.suratMasuk?.fileUrl ||
                        disposisi.suratKeluar?.finalFileUrl ||
                        disposisi.suratKeluar?.fileUrl) && (
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() =>
                            handleDownload(
                              disposisi.suratMasuk?.fileUrl ||
                                disposisi.suratKeluar?.finalFileUrl ||
                                disposisi.suratKeluar?.fileUrl,
                              disposisi.suratMasuk?.id,
                              disposisi.suratKeluar?.id
                            )
                          }
                          title="Download File"
                        >
                          <Download size={16} />
                        </Button>
                      )}

                      {/* View Action */}
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => {
                          navigate(
                            disposisi.suratMasuk
                              ? `/surat-masuk/${disposisi.suratMasuk.id}`
                              : `/surat-keluar/${disposisi.suratKeluar.id}`
                          );
                        }}
                        title="Lihat Detail"
                      >
                        <FileText size={16} />
                      </Button>

                      {/* Approval Actions (Surat Keluar) */}
                      {disposisi.suratKeluar && !isAdmin(user?.role) && (
                        <>
                          {/* Reviewer Setujui Draft */}
                          {canDisposisi(user?.role) &&
                            disposisi.suratKeluar.status ===
                              STATUS_SURAT.MENUNGGU_PERSETUJUAN && (
                              <Button
                                variant="success"
                                size="small"
                                onClick={() =>
                                  openApprovalModal(
                                    "DRAFT",
                                    disposisi.suratKeluar.id
                                  )
                                }
                                title="Setujui / Tolak"
                              >
                                <CheckCircle size={16} />
                                <span className="ml-1 hidden sm:inline">
                                  Tinjau
                                </span>
                              </Button>
                            )}
                          {/* Ketua ACC */}
                          {isKetua(user?.role) &&
                            disposisi.suratKeluar.status ===
                              STATUS_SURAT.MENUNGGU_TTD && (
                              <Button
                                variant="success"
                                size="small"
                                onClick={() =>
                                  openApprovalModal(
                                    "ACC",
                                    disposisi.suratKeluar.id
                                  )
                                }
                                title="ACC / Tolak"
                              >
                                <CheckCircle size={16} />
                                <span className="ml-1 hidden sm:inline">
                                  Tinjau
                                </span>
                              </Button>
                            )}
                        </>
                      )}

                      {/* Complete Disposisi Action */}
                      {effectiveStatus !== "SELESAI" &&
                        !disposisi.isForwarded && (
                          <Button
                            variant="primary"
                            size="small"
                            onClick={() => handleComplete(disposisi.id)}
                            title="Tandai Selesai"
                          >
                            <CheckCircle size={16} />
                            <span className="ml-1 hidden sm:inline">Done</span>
                          </Button>
                        )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredDisposisi.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Approval/Reject Modal */}
      <Modal
        isOpen={approvalModal.isOpen}
        onClose={closeApprovalModal}
        title={
          approvalModal.step === "REJECT"
            ? "Tolak Surat"
            : "Konfirmasi Persetujuan"
        }
      >
        {approvalModal.step === "CHOICE" ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Silakan pilih tindakan untuk surat ini.
              {approvalModal.type === "DRAFT"
                ? " Anda dapat menyetujui draft atau menolaknya untuk revisi."
                : " Anda dapat menandatangani surat atau menolaknya."}
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <Button
                variant="danger"
                className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                onClick={() =>
                  setApprovalModal({ ...approvalModal, step: "REJECT" })
                }
              >
                <XCircle size={18} className="mr-2" />
                Tolak
              </Button>
              <Button variant="success" onClick={handleConfirmApprove}>
                <CheckCircle size={18} className="mr-2" />
                Setujui / ACC
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="form-label">Alasan Penolakan</label>
              <textarea
                className="form-input"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Masukkan alasan kenapa surat ditolak/dikembalikan..."
                required
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="secondary"
                onClick={() =>
                  setApprovalModal({ ...approvalModal, step: "CHOICE" })
                }
              >
                Kembali
              </Button>
              <Button
                variant="danger"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleConfirmReject}
              >
                Kirim Penolakan
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DisposisiList;
