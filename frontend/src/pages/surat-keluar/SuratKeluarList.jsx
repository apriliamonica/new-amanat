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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { suratKeluarAPI, userAPI } from "../../api/axios";
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
  }, []);

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

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [userList, setUserList] = useState([]);

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
      if (activeTab === "surat") {
        const isAdminCreated = surat.createdBy?.role === "SEKRETARIS_KANTOR";
        const hasFinalFile = !!surat.finalFileUrl;
        if (!isAdminCreated && !hasFinalFile) return false;
      }
      // Tab "Permintaan Surat" -> Show Requests that do NOT have Final File yet
      if (activeTab === "request") {
        const isAdminCreated = surat.createdBy?.role === "SEKRETARIS_KANTOR";
        const hasFinalFile = !!surat.finalFileUrl;
        if (isAdminCreated || hasFinalFile) return false;
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

    return true;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterUser, filterMonth, activeTab]);

  // Paginate filtered data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSurat.slice(indexOfFirstItem, indexOfLastItem);

  // Get action label based on status and role
  const getActionLabel = (surat) => {
    if (isAdmin(user?.role) && surat.status === STATUS_SURAT.PENGAJUAN) {
      return { label: "Proses", icon: PenTool, color: "text-blue-600" };
    }
    if (isKetua(user?.role) && surat.status === "MENUNGGU_TTD") {
      return { label: "Tanda Tangan", icon: PenTool, color: "text-orange-600" };
    }
    if (canValidate(user?.role) && surat.status === "MENUNGGU_VALIDASI") {
      return { label: "Validasi", icon: CheckCircle, color: "text-green-600" };
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

      <div className="p-6 space-y-6">
        {/* Helper function to check for "Pending" count could be nice, currently just UI */}

        {/* Tabs for Admin */}
        {isAdmin(user?.role) && (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("surat")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "surat"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Surat Keluar
            </button>
            <button
              onClick={() => setActiveTab("request")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                activeTab === "request"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Permintaan Surat
              {suratList.filter((s) => s.status === STATUS_SURAT.PENGAJUAN)
                .length > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {
                    suratList.filter((s) => s.status === STATUS_SURAT.PENGAJUAN)
                      .length
                  }
                </span>
              )}
            </button>
          </div>
        )}

        {/* Search, Filter, Create - All in one row */}
        <div className="flex flex-col md:flex-row gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Cari nomor, perihal, atau tujuan..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter Dropdown (hide in request tab for Admin) */}
          {!(isAdmin(user?.role) && activeTab === "request") && (
            <select
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Status</option>
              {Object.values(STATUS_SURAT).map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          )}

          {/* Month Filter Dropdown */}
          <select
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
          >
            <option value="">Bulan</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* User Filter Dropdown (only in request tab for Admin) */}
          {isAdmin(user?.role) && activeTab === "request" && (
            <select
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
            >
              <option value="">Semua Permintaan</option>
              {userList
                .filter((u) => u.role !== "SEKRETARIS_KANTOR")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama}
                  </option>
                ))}
            </select>
          )}

          {/* Export Button */}
          <Button
            variant="success"
            onClick={handleExport}
            loading={exporting}
            className="w-full sm:w-auto"
          >
            <Download size={20} />
            Export Excel
          </Button>

          {/* Create Button */}
          {canCreateSurat(user?.role) && (
            <Link to="/surat-keluar/create">
              <Button variant="primary" className="whitespace-nowrap">
                <Plus size={20} />
                {isAdmin(user?.role) ? "Buat Surat" : "Ajukan Surat"}
              </Button>
            </Link>
          )}
        </div>

        {/* Surat Table */}
        {filteredSurat.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-gray-300" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Tidak ada surat keluar
            </h3>
            <p className="text-gray-400">
              {searchTerm
                ? "Coba ubah filter pencarian Anda"
                : "Belum ada surat keluar yang tersedia"}
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
                            onClick={() =>
                              navigate(`/surat-keluar/${surat.id}`)
                            }
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <action.icon size={16} className={action.color} />
                            <span className="ml-1 text-xs">{action.label}</span>
                          </Button>
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
