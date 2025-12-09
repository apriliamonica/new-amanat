import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, FileText, CheckCircle, PenTool } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { suratKeluarAPI } from '../../api/axios';
import Header from '../../components/layout/Header';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { isAdmin, isKetua, canValidate, KATEGORI_NAMES } from '../../utils/constants';
import { formatDate, truncateText } from '../../utils/helpers';

const SuratKeluarList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchSurat();
  }, []);

  const fetchSurat = async () => {
    try {
      const response = await suratKeluarAPI.getAll();
      setSuratList(response.data.suratKeluar);
    } catch (error) {
      console.error('Fetch surat error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter
  const filteredSurat = suratList.filter((surat) => {
    const matchSearch =
      (surat.nomorSurat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surat.tujuan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !filterStatus || surat.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Get action label based on status and role
  const getActionLabel = (surat) => {
    if (isKetua(user?.role) && surat.status === 'MENUNGGU_TTD') {
      return { label: 'Tanda Tangan', icon: PenTool, color: 'text-orange-600' };
    }
    if (canValidate(user?.role) && surat.status === 'MENUNGGU_VALIDASI') {
      return { label: 'Validasi', icon: CheckCircle, color: 'text-green-600' };
    }
    return { label: 'Lihat', icon: Eye, color: 'text-gray-600' };
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
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari nomor surat, perihal, tujuan..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isAdmin(user?.role) && (
            <Link to="/surat-keluar/create">
              <Button variant="primary">
                <Plus size={20} />
                Buat Surat Keluar
              </Button>
            </Link>
          )}
        </div>

        {/* Surat List */}
        {filteredSurat.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-gray-300" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Tidak ada surat keluar
            </h3>
            <p className="text-gray-400">
              {searchTerm
                ? 'Coba ubah filter pencarian Anda'
                : 'Belum ada surat keluar yang tersedia'}
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSurat.map((surat) => {
              const action = getActionLabel(surat);
              return (
                <Card
                  key={surat.id}
                  hover
                  onClick={() => navigate(`/surat-keluar/${surat.id}`)}
                  className="p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-gray-500">
                          {surat.nomorSurat || 'Draft'}
                        </span>
                        <StatusBadge status={surat.status} size="small" />
                        {surat.isSigned && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                            <PenTool size={12} />
                            Signed
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {truncateText(surat.perihal, 80)}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>Tujuan: {surat.tujuan}</span>
                        {surat.tanggalSurat && (
                          <span>Tanggal: {formatDate(surat.tanggalSurat)}</span>
                        )}
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
                        <action.icon size={18} className={action.color} />
                        {action.label}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuratKeluarList;
