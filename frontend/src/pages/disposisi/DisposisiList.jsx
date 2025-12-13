import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle, Clock, Send, Filter } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { disposisiAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { STATUS_DISPOSISI, ROLE_SHORT_NAMES } from "../../utils/constants";
import { formatDateTime, truncateText } from "../../utils/helpers";

const DisposisiList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [disposisiList, setDisposisiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");

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

  const handleComplete = async (id) => {
    try {
      await disposisiAPI.complete(id, { catatan: "Disposisi selesai" });
      fetchDisposisi();
    } catch (error) {
      console.error("Complete disposisi error:", error);
    }
  };

  const filteredDisposisi = disposisiList.filter(
    (d) => !filterStatus || d.status === filterStatus
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "DITERUSKAN":
        return "bg-blue-100 text-blue-700";
      case "DITINDAKLANJUTI":
        return "bg-purple-100 text-purple-700";
      case "SELESAI":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
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

      <div className="p-6 space-y-6">
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
          <Card className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-gray-300" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Tidak ada disposisi
            </h3>
            <p className="text-gray-400">
              Belum ada disposisi yang ditujukan kepada Anda
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDisposisi.map((disposisi) => (
              <Card key={disposisi.id} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          disposisi.status
                        )}`}
                      >
                        {disposisi.status}
                      </span>
                      {disposisi.isRequestLampiran && (
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">
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
                      <span>{formatDateTime(disposisi.tanggalDisposisi)}</span>
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
                    {disposisi.suratMasuk && (
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() =>
                          navigate(`/surat-masuk/${disposisi.suratMasuk.id}`)
                        }
                      >
                        <FileText size={16} />
                        Lihat Surat
                      </Button>
                    )}
                    {disposisi.suratKeluar && (
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() =>
                          navigate(`/surat-keluar/${disposisi.suratKeluar.id}`)
                        }
                      >
                        <FileText size={16} />
                        Lihat Surat
                      </Button>
                    )}
                    {disposisi.status !== "SELESAI" &&
                      !disposisi.isForwarded && (
                        <Button
                          variant="success"
                          size="small"
                          onClick={() => handleComplete(disposisi.id)}
                        >
                          <CheckCircle size={16} />
                          Selesai
                        </Button>
                      )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisposisiList;
