import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Edit } from "lucide-react";
import { suratKeluarAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { STATUS_SURAT } from "../../utils/constants";

const SuratKeluarEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    tujuan: "",
    perihal: "",
    tujuan: "",
    perihal: "",
    isiSurat: "",
    keterangan: "",
    status: "",
    nomorSurat: "",
    tanggalSurat: "",
  });

  useEffect(() => {
    fetchSurat();
  }, [id]);

  const fetchSurat = async () => {
    try {
      const response = await suratKeluarAPI.getById(id);
      const surat = response.data.suratKeluar;
      setFormData({
        tujuan: surat.tujuan,
        perihal: surat.perihal,
        isiSurat: surat.isiSurat || "",
        keterangan: surat.keterangan || "",
        status: surat.status,
        nomorSurat: surat.nomorSurat,
        tanggalSurat: surat.tanggalSurat,
      });
    } catch (error) {
      console.error("Fetch surat error:", error);
      alert("Gagal mengambil data surat");
      navigate("/surat-keluar");
    } finally {
      setFetching(false);
    }
  };

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
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });
      if (file) {
        data.append("file", file);
      }

      await suratKeluarAPI.update(id, data);
      navigate(`/surat-keluar/${id}`);
    } catch (error) {
      console.error("Update surat error:", error);
      alert("Gagal mengupdate surat keluar");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Edit Surat Keluar" />

      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/surat-keluar/${id}`)}
          className="mb-4"
        >
          <ArrowLeft size={20} />
          Kembali
        </Button>

        <Card className="max-w-3xl mx-auto">
          <Card.Header>
            <h2 className="text-lg font-semibold">Edit Data Surat Keluar</h2>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Auto Generated info if available */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nomor Surat</label>
                  <input
                    type="text"
                    className="form-input bg-gray-100"
                    value={
                      formData.nomorSurat || "Akan digenerate saat diproses"
                    }
                    disabled
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    className="form-input"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value={STATUS_SURAT.PENGAJUAN}>Pengajuan</option>
                    <option value={STATUS_SURAT.DIPROSES}>Diproses</option>
                    <option value={STATUS_SURAT.MENUNGGU_TTD}>
                      Menunggu TTD
                    </option>
                    <option value={STATUS_SURAT.SELESAI}>Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Tujuan Surat</label>
                <input
                  type="text"
                  name="tujuan"
                  className="form-input"
                  placeholder="Contoh: Dinas Pendidikan Kota..."
                  value={formData.tujuan}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Perihal</label>
                <input
                  type="text"
                  name="perihal"
                  className="form-input"
                  placeholder="Contoh: Undangan Rapat..."
                  value={formData.perihal}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Isi Surat / Ringkasan</label>
                <textarea
                  name="isiSurat"
                  className="form-input"
                  rows={4}
                  placeholder="Isi ringkas surat..."
                  value={formData.isiSurat}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="form-label">Upload File Surat (Update)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {file ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <FileText size={24} />
                        <span>{file.name}</span>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <Upload className="mx-auto mb-2" size={32} />
                        <p>Klik untuk ganti file</p>
                        <p className="text-sm text-gray-400">
                          (Biarkan kosong jika tidak ingin mengubah file)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

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
                  onClick={() => navigate(`/surat-keluar/${id}`)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default SuratKeluarEdit;
