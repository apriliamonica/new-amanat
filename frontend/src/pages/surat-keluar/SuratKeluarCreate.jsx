import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Edit } from 'lucide-react';
import { suratKeluarAPI } from '../../api/axios';
import Header from '../../components/layout/Header';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { JENIS_SURAT, KATEGORI_SURAT, KATEGORI_NAMES } from '../../utils/constants';

const SuratKeluarCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('upload'); // 'upload' or 'create'
  const [formData, setFormData] = useState({
    tujuan: '',
    perihal: '',
    jenisSurat: 'EKSTERNAL',
    kategori: 'UMUM',
    isiSurat: '',
    keterangan: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });
      if (file) {
        data.append('file', file);
      }

      await suratKeluarAPI.create(data);
      navigate('/surat-keluar');
    } catch (error) {
      console.error('Create surat error:', error);
      alert('Gagal membuat surat keluar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Buat Surat Keluar" />

      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/surat-keluar')} className="mb-4">
          <ArrowLeft size={20} />
          Kembali
        </Button>

        <Card className="max-w-3xl mx-auto">
          <Card.Header>
            <h2 className="text-lg font-semibold">Buat Surat Keluar Baru</h2>
            {/* Mode Toggle */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mode === 'upload'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Upload size={18} />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setMode('create')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mode === 'create'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Edit size={18} />
                Buat di Aplikasi
              </button>
            </div>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label">Tujuan *</label>
                <input
                  type="text"
                  name="tujuan"
                  className="form-input"
                  placeholder="Nama penerima surat"
                  value={formData.tujuan}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Perihal *</label>
                <input
                  type="text"
                  name="perihal"
                  className="form-input"
                  placeholder="Perihal surat"
                  value={formData.perihal}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Jenis Surat *</label>
                  <select
                    name="jenisSurat"
                    className="form-input"
                    value={formData.jenisSurat}
                    onChange={handleChange}
                    required
                  >
                    <option value={JENIS_SURAT.INTERNAL}>Internal</option>
                    <option value={JENIS_SURAT.EKSTERNAL}>Eksternal</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Kategori *</label>
                  <select
                    name="kategori"
                    className="form-input"
                    value={formData.kategori}
                    onChange={handleChange}
                    required
                  >
                    {Object.entries(KATEGORI_NAMES).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content based on mode */}
              {mode === 'create' && (
                <div>
                  <label className="form-label">Isi Surat *</label>
                  <textarea
                    name="isiSurat"
                    className="form-input font-mono"
                    rows={12}
                    placeholder="Tulis isi surat di sini..."
                    value={formData.isiSurat}
                    onChange={handleChange}
                    required={mode === 'create'}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tulis isi surat secara lengkap. Format akan diproses saat pencetakan.
                  </p>
                </div>
              )}

              {mode === 'upload' && (
                <div>
                  <label className="form-label">Upload File Surat *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx"
                      required={mode === 'upload'}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {file ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <FileText size={24} />
                          <span>{file.name}</span>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <Upload className="mx-auto mb-2" size={32} />
                          <p>Klik untuk upload file</p>
                          <p className="text-sm text-gray-400">PDF, DOC, DOCX</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">Keterangan</label>
                <textarea
                  name="keterangan"
                  className="form-input"
                  rows={2}
                  placeholder="Keterangan tambahan (opsional)"
                  value={formData.keterangan}
                  onChange={handleChange}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/surat-keluar')}
                  type="button"
                >
                  Batal
                </Button>
                <Button variant="primary" type="submit" loading={loading}>
                  Simpan Draft
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default SuratKeluarCreate;
