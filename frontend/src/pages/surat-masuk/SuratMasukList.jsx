import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Eye, FileText, Download, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { suratMasukAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import Pagination from "../../components/common/Pagination";
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
  const [exporting, setExporting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await suratMasukAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Data_Surat_Masuk_${new Date().getTime()}.xlsx`
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
      await suratMasukAPI.delete(id);
      fetchSurat();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Gagal menghapus surat");
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterMonth]);

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

  // Paginate filtered data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSurat.slice(indexOfFirstItem, indexOfLastItem);

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

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
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
                placeholder="Cari nomor surat, perihal, pengirim..."
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-2">
              {/* Status Filter */}
              <select
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 min-w-[120px]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Semua Status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
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

              {isAdmin(user?.role) && (
                <Link to="/surat-masuk/create" className="flex-1 sm:flex-none">
                  <Button
                    variant="primary"
                    size="small"
                    className="w-full sm:w-auto"
                  >
                    <Plus size={16} />
                    Tambah Surat
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
              <table className="table-modern">
                <thead>
                  <tr>
                    <th className="text-left">No. Surat</th>
                    <th className="text-left">Pengirim</th>
                    <th className="text-left">Perihal</th>
                    <th className="text-left">Tujuan</th>
                    <th className="text-left">Tgl Surat</th>
                    <th className="text-left">Tgl Diterima</th>
                    <th className="text-left">Status</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((surat) => (
                    <tr key={surat.id}>
                      <td className="font-mono font-medium text-green-700">
                        {surat.nomorSurat}
                      </td>
                      <td>{truncateText(surat.pengirim, 25)}</td>
                      <td className="text-gray-600">
                        {truncateText(surat.perihal, 35)}
                      </td>
                      <td className="text-gray-600">{surat.tujuan || "-"}</td>
                      <td className="whitespace-nowrap text-gray-500">
                        {formatDate(surat.tanggalSurat)}
                      </td>
                      <td className="whitespace-nowrap text-gray-500">
                        {formatDate(surat.tanggalDiterima)}
                      </td>
                      <td className="whitespace-nowrap">
                        <StatusBadge status={surat.status} size="small" />
                      </td>
                      <td className="text-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => navigate(`/surat-masuk/${surat.id}`)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </Button>
                        {isAdmin(user?.role) && (
                          <Button
                            variant="ghost"
                            size="small"
                            onClick={() => handleDelete(surat.id)}
                            className="hover:bg-red-50 hover:text-red-600 text-gray-400"
                            title="Hapus Surat"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
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

export default SuratMasukList;
