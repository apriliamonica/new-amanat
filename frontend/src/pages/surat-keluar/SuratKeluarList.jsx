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

const SuratKeluarList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("surat"); // 'surat' | 'request'

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
      if (activeTab === "surat" && surat.status === STATUS_SURAT.PENGAJUAN)
        return false;
      if (activeTab === "request" && surat.status !== STATUS_SURAT.PENGAJUAN)
        return false;
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
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      No. Surat
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Tujuan
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Perihal
                    </th>

                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Tanggal
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSurat.map((surat) => {
                    const action = getActionLabel(surat);
                    return (
                      <tr
                        key={surat.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-mono text-gray-700">
                          {surat.nomorSurat || (
                            <span className="text-gray-400 italic">Draft</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {truncateText(surat.tujuan, 25)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {truncateText(surat.perihal, 35)}
                        </td>

                        <td className="px-4 py-3 text-sm text-gray-600">
                          {surat.tanggalSurat
                            ? formatDate(surat.tanggalSurat)
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={surat.status} size="small" />
                          {surat.isSigned && (
                            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded inline-flex items-center gap-1">
                              <PenTool size={10} />
                              Signed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() =>
                              navigate(`/surat-keluar/${surat.id}`)
                            }
                          >
                            <action.icon size={16} className={action.color} />
                            {action.label}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SuratKeluarList;
