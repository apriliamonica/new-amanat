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
    const matchSearch =
      surat.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.pengirim.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
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
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Cari nomor surat, perihal, pengirim..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add Button (Admin only) */}
          {isAdmin(user?.role) && (
            <Link to="/surat-masuk/create">
              <Button variant="primary">
                <Plus size={20} />
                Tambah Surat
              </Button>
            </Link>
          )}
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
                      Jenis
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
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {truncateText(surat.perihal, 35)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            surat.jenisSurat === "INTERNAL"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {surat.jenisSurat}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(surat.tanggalSurat)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(surat.tanggalDiterima)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={surat.status} size="small" />
                      </td>
                      <td className="px-4 py-3 text-center">
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
