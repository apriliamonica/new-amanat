import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Eye, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { suratMasukAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import { isAdmin, JENIS_SURAT } from "../../utils/constants";
import { formatDate, truncateText } from "../../utils/helpers";

const SuratMasukList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

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

  const STATUS_OPTIONS = ["DITERIMA", "DIDISPOSISI", "SELESAI"];

  useEffect(() => {
    fetchSurat();
  }, []);

  const fetchSurat = async () => {
    try {
      const response = await suratMasukAPI.getAll();
      setSuratList(response.data.suratMasuk);
    } catch (error) {
      console.error("Fetch surat error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter surat
  const filteredSurat = suratList.filter((surat) => {
    // Search Filter
    const matchSearch =
      surat.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.pengirim.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    // Status Filter
    if (filterStatus && surat.status !== filterStatus) {
      return false;
    }

    // Month Filter
    if (filterMonth) {
      const suratDate = new Date(surat.tanggalSurat || surat.createdAt);
      if (suratDate.getMonth() + 1 !== parseInt(filterMonth)) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Surat Masuk" />

      <div className="p-6 space-y-6">
        {/* Search, Filters, Create - All in one row */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Cari nomor surat, perihal, pengirim..."
              className="form-input !pl-12 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={20}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="flex gap-3 w-full sm:w-auto">
              {/* Status Filter Dropdown */}
              <select
                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              {/* Month Filter Dropdown */}
              <select
                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
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
            </div>

            {/* Add Button (Admin only) */}
            {isAdmin(user?.role) && (
              <Link to="/surat-masuk/create" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  className="whitespace-nowrap w-full justify-center sm:w-auto"
                >
                  <Plus size={20} />
                  Tambah Surat
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Surat Table */}
        {filteredSurat.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-gray-300" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Tidak ada surat masuk
            </h3>
            <p className="text-gray-400">
              {searchTerm
                ? "Coba ubah filter pencarian Anda"
                : "Belum ada surat masuk yang tersedia"}
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
                      Pengirim
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Perihal
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Tujuan
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Tgl Surat
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                      Tgl Diterima
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
                  {filteredSurat.map((surat) => (
                    <tr
                      key={surat.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">
                        {surat.nomorSurat}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {truncateText(surat.pengirim, 25)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {truncateText(surat.perihal, 35)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {surat.tujuan || "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(surat.tanggalSurat)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(surat.tanggalDiterima)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={surat.status} size="small" />
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => navigate(`/surat-masuk/${surat.id}`)}
                        >
                          <Eye size={16} />
                          Lihat
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SuratMasukList;
