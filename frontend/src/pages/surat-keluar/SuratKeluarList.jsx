import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  FileText,
  CheckCircle,
  PenTool,
  Clock,
  Download,
  Trash2,
  Send,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { suratKeluarAPI, userAPI, jenisSuratAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import {
  isAdmin,
  isKetua,
  canValidate,
  isKabag,
  canCreateSurat,
  canDisposisi,
  STATUS_SURAT,
} from "../../utils/constants";
import { formatDate, truncateText } from "../../utils/helpers";
import Pagination from "../../components/common/Pagination";

const SuratKeluarList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("surat"); // 'surat' | 'request'
  const [exporting, setExporting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSurat();
    fetchJenisSurat();
  }, []);

  const fetchJenisSurat = async () => {
    try {
      const response = await jenisSuratAPI.getAll();
      if (response.data.success) {
        setJenisSuratList(response.data.data);
      }
    } catch (error) {
      console.error("Fetch jenis surat error:", error);
    }
  };

  const fetchSurat = async () => {
    try {
      const response = await suratKeluarAPI.getAll();
      setSuratList(response.data.suratKeluar);
    } catch (error) {
      console.error("Fetch surat error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await suratKeluarAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Data_Surat_Keluar_${new Date().getTime()}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus surat ini?")) return;

    try {
      await suratKeluarAPI.delete(id);
      fetchSurat();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Gagal menghapus surat");
    }
  };

  const handleProcess = async (id) => {
    if (!window.confirm("Proses pengajuan surat ini?")) return;

    try {
      await suratKeluarAPI.update(id, { status: STATUS_SURAT.DIPROSES });
      fetchSurat();
    } catch (error) {
      console.error("Process error:", error);
      alert("Gagal memproses surat");
    }
  };

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterJenisSurat, setFilterJenisSurat] = useState("");
  const [userList, setUserList] = useState([]);
  const [jenisSuratList, setJenisSuratList] = useState([]);

  const MONTHS = [
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  useEffect(() => {
    // Fetch Users for filter options (Admin only)
    if (isAdmin(user?.role)) {
      userAPI
        .getAll()
        .then((res) => setUserList(res.data.users || []))
        .catch(console.error);
    }
  }, [user?.role]);

  const filteredSurat = suratList.filter((surat) => {
    // 1. Tab Filtering (Admin Only)
    if (isAdmin(user?.role)) {
      // Tab "Surat Keluar" -> Show letters created by Admin OR (Requests that have Final File)
      // Tab "Surat Keluar" -> Show letters that are Approved, Verified, Completed, or Returned (after approval)
      if (activeTab === "surat") {
        const validStatuses = [
          STATUS_SURAT.DISETUJUI,
          STATUS_SURAT.MENUNGGU_VERIFIKASI,
          STATUS_SURAT.MENUNGGU_TTD,
          STATUS_SURAT.SELESAI,
          // If DIKEMBALIKAN has a number (nomorSuratAdmin), it belongs here (failed verification),
          // otherwise it belongs to Request (failed approval)
        ];

        // Custom logic: If purely admin created (not request based), it's always here?
        // Or strictly based on status?
        // Let's stick to status based split for Admin cleanliness.

        if (validStatuses.includes(surat.status)) return true;
        // Also include DIKEMBALIKAN if it was a final rejection?
        // Or if it has nomorSuratAdmin (meaning it reached final stage)
        if (surat.status === STATUS_SURAT.DIKEMBALIKAN && surat.nomorSuratAdmin)
          return true;

        // Fallback: If Admin created it and it's NOT PENGAJUAN/DIPROSES/MENUNGGU_PERSETUJUAN?
        // Actually, Admin creations start at DIPROSES (old logic) or PENGAJUAN (new logic?)
        // Let's assume Admin creations also go through the flow if they need approval.

        return false;
      }

      // Tab "Permintaan Surat" -> Pre-approval stages
      if (activeTab === "request") {
        const requestStatuses = [
          STATUS_SURAT.PENGAJUAN,
          STATUS_SURAT.DIPROSES,
          STATUS_SURAT.MENUNGGU_PERSETUJUAN,
        ];
        if (requestStatuses.includes(surat.status)) return true;
        // Include DIKEMBALIKAN if NO nomorSuratAdmin (rejected at approval stage)
        if (
          surat.status === STATUS_SURAT.DIKEMBALIKAN &&
          !surat.nomorSuratAdmin
        )
          return true;

        return false;
      }
    }

    // 2. Search Filtering
    const matchSearch =
      (surat.nomorSurat || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      surat.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.tujuan.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    // 3. Status Filtering
    if (filterStatus && surat.status !== filterStatus) {
      return false;
    }

    // 4. User Filtering (for request tab)
    if (filterUser && surat.createdBy?.id !== filterUser) {
      return false;
    }

    // 5. Month Filtering
    if (filterMonth) {
      const suratDate = new Date(surat.tanggalSurat || surat.createdAt);
      if (suratDate.getMonth() + 1 !== parseInt(filterMonth)) {
        return false;
      }
    }

    // 6. Jenis Surat Filter
    if (filterJenisSurat && surat.jenisSuratId !== filterJenisSurat) {
      return false;
    }

    return true;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterStatus,
    filterUser,
    filterMonth,
    activeTab,
    filterJenisSurat,
  ]);

  // Paginate filtered data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSurat.slice(indexOfFirstItem, indexOfLastItem);

  // Get action label based on status and role
  const getActionLabel = (surat) => {
    if (isAdmin(user?.role) && surat.status === STATUS_SURAT.PENGAJUAN) {
      return { label: "Proses", icon: PenTool, color: "text-blue-600" };
    }
    if (isAdmin(user?.role) && surat.status === STATUS_SURAT.DISETUJUI) {
      return {
        label: "Upload & Proses",
        icon: PenTool,
        color: "text-blue-600",
      };
    }
    if (
      isKetua(user?.role) &&
      surat.status === STATUS_SURAT.MENUNGGU_PERSETUJUAN
    ) {
      // Ketua specifically needs to Approve
      return { label: "Setujui", icon: CheckCircle, color: "text-green-600" };
    }
    if (
      canValidate(user?.role) &&
      surat.status === STATUS_SURAT.MENUNGGU_VERIFIKASI
    ) {
      return {
        label: "Verifikasi",
        icon: CheckCircle,
        color: "text-green-600",
      };
    }
    // For others in approval chain (Sek/Ben), they use Disposisi, so "Lihat" is fine, detail page has action.
    if (
      canDisposisi(user?.role) &&
      surat.status === STATUS_SURAT.MENUNGGU_PERSETUJUAN
    ) {
      return { label: "Disposisi", icon: Send, color: "text-blue-600" };
    }
    return { label: "Lihat", icon: Eye, color: "text-gray-600" };
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
      <Header title="Surat Keluar" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Helper function to check for "Pending" count could be nice, currently just UI */}

        {/* Tabs for Admin */}
        {isAdmin(user?.role) && (
          <div className="flex gap-1 lg:gap-2 border-b pb-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("surat")}
              className={`py-2 px-3 lg:px-5 text-sm lg:text-base font-medium rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === "surat"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                  : "text-gray-600 hover:bg-green-50/80 hover:text-green-600"
              }`}
            >
              Surat Keluar
            </button>
            <button
              onClick={() => setActiveTab("request")}
              className={`py-2 px-3 lg:px-5 text-sm lg:text-base font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                activeTab === "request"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                  : "text-gray-600 hover:bg-green-50/80 hover:text-green-600"
              }`}
            >
              Pengajuan Surat
              {suratList.filter((s) =>
                [
                  STATUS_SURAT.PENGAJUAN,
                  STATUS_SURAT.DIPROSES,
                  STATUS_SURAT.MENUNGGU_PERSETUJUAN,
                ].includes(s.status)
              ).length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {
                    suratList.filter((s) =>
                      [
                        STATUS_SURAT.PENGAJUAN,
                        STATUS_SURAT.DIPROSES,
                        STATUS_SURAT.MENUNGGU_PERSETUJUAN,
                      ].includes(s.status)
                    ).length
                  }
                </span>
              )}
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <Card className="p-4">
          <div className="space-y-3">
            {/* Search Row */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Cari nomor, perihal, atau tujuan..."
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2">
              {/* Jenis Surat Filter */}
              <select
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 min-w-[120px]"
                value={filterJenisSurat}
                onChange={(e) => setFilterJenisSurat(e.target.value)}
              >
                <option value="">Semua Jenis Surat</option>
                {jenisSuratList.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.kode} - {j.nama}
                  </option>
                ))}
              </select>

              {/* Month Filter */}
              <select
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 min-w-[120px]"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="">Semua Bulan</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              {/* User Filter (Admin request tab only) */}
              {isAdmin(user?.role) && activeTab === "request" && (
                <select
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 min-w-[140px]"
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                >
                  <option value="">Semua Pengaju</option>
                  {userList
                    .filter((u) => u.role !== "SEKRETARIS_KANTOR")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nama}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="success"
                size="small"
                onClick={handleExport}
                loading={exporting}
              >
                <Download size={16} />
                Ekspor
              </Button>

              {canCreateSurat(user?.role) && (
                <Link to="/surat-keluar/create" className="flex-1 sm:flex-none">
                  <Button
                    variant="primary"
                    size="small"
                    className="w-full sm:w-auto"
                  >
                    <Plus size={16} />
                    {isAdmin(user?.role) ? "Buat Surat" : "Ajukan Surat"}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>

        {/* Surat Table */}
        {filteredSurat.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-gray-300" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">Kosong</h3>
            <p className="text-gray-400">
              {searchTerm
                ? "Coba ubah filter pencarian Anda"
                : "Belum ada pengajuan surat"}
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th className="text-left">No. Surat</th>
                    {activeTab === "request" && (
                      <th className="text-left">Permintaan Dari</th>
                    )}
                    <th className="text-left">Tujuan</th>
                    <th className="text-left">Perihal</th>
                    <th className="text-left">Tanggal</th>
                    <th className="text-left">Status</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((surat) => {
                    const action = getActionLabel(surat);
                    return (
                      <tr key={surat.id}>
                        <td className="font-mono font-medium text-green-700">
                          {/* 
                            Display Logic:
                            - Admin sees nomorSuratAdmin if exists (approved letter), otherwise nomorSurat
                            - Others (Kabag/Ketua) always see their original nomorSurat 
                          */}
                          {isAdmin(user?.role) && surat.nomorSuratAdmin
                            ? surat.nomorSuratAdmin
                            : surat.nomorSurat || "-"}
                        </td>
                        {activeTab === "request" && (
                          <td className="text-gray-700 font-medium">
                            {surat.createdBy?.nama || "-"}
                            <br />
                            <span className="text-xs text-gray-500 font-normal">
                              {surat.createdBy?.role
                                ? surat.createdBy.role.replace(/_/g, " ")
                                : ""}
                            </span>
                          </td>
                        )}
                        <td>{surat.tujuan}</td>
                        <td className="text-gray-600">
                          {truncateText(surat.perihal, 35)}
                        </td>
                        <td className="whitespace-nowrap text-gray-500">
                          {surat.tanggalSurat
                            ? formatDate(surat.tanggalSurat)
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap">
                          <StatusBadge status={surat.status} size="small" />
                          {/* {surat.isRead && (
                            <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1">
                              <Eye size={10} />
                              Dibaca
                            </span>
                          )}
                          {surat.isSigned && (
                            <span className="ml-2 text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-200 inline-flex items-center gap-1">
                              <PenTool size={8} />
                              Signed
                            </span>
                          )} */}
                        </td>
                        <td className="text-center whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => {
                              if (action.label === "Proses") {
                                handleProcess(surat.id);
                              } else {
                                navigate(`/surat-keluar/${surat.id}`);
                              }
                            }}
                            className="hover:bg-blue-50 hover:text-blue-600"
                            title={action.label}
                          >
                            <action.icon size={16} className={action.color} />
                            <span className="ml-1 text-xs">{action.label}</span>
                          </Button>
                          {isAdmin(user?.role) && (
                            <Button
                              variant="ghost"
                              size="small"
                              onClick={() => handleDelete(surat.id)}
                              className="ml-1 hover:bg-red-50 hover:text-red-600 text-gray-400"
                              title="Hapus Surat"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredSurat.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SuratKeluarList;
