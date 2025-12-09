import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, FileText, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { suratMasukAPI } from '../../api/axios';
import Header from '../../components/layout/Header';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { isAdmin, KATEGORI_NAMES, JENIS_SURAT } from '../../utils/constants';
import { formatDate, truncateText } from '../../utils/helpers';

const SuratMasukList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  useEffect(() => {
    fetchSurat();
  }, []);

  const fetchSurat = async () => {
    try {
      const response = await suratMasukAPI.getAll();
      setSuratList(response.data.suratMasuk);
    } catch (error) {
      console.error('Fetch surat error:', error);
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
    const matchStatus = !filterStatus || surat.status === filterStatus;
    const matchKategori = !filterKategori || surat.kategori === filterKategori;
    return matchSearch && matchStatus && matchKategori;
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
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari nomor surat, perihal, pengirim..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <select
              className="form-input max-w-[180px]"
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {Object.entries(KATEGORI_NAMES).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
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

        {/* Surat List */}
        {filteredSurat.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-gray-300" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Tidak ada surat masuk
            </h3>
            <p className="text-gray-400">
              {searchTerm || filterKategori
                ? 'Coba ubah filter pencarian Anda'
                : 'Belum ada surat masuk yang tersedia'}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSurat.map((surat) => (
              <Card
                key={surat.id}
                hover
                onClick={() => navigate(`/surat-masuk/${surat.id}`)}
                className="p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono text-gray-500">
                        {surat.nomorSurat}
                      </span>
                      <StatusBadge status={surat.status} size="small" />
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        surat.jenisSurat === 'INTERNAL' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {surat.jenisSurat}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {truncateText(surat.perihal, 80)}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>Dari: {surat.pengirim}</span>
                      <span>Tanggal: {formatDate(surat.tanggalSurat)}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {KATEGORI_NAMES[surat.kategori]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    {surat._count?.lampiran > 0 && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                        <FileText size={14} />
                        {surat._count.lampiran}
                      </span>
                    )}
                    <Button variant="ghost" size="small">
                      <Eye size={18} />
                      Lihat
                    </Button>
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

export default SuratMasukList;
