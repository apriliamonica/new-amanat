import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileText } from "lucide-react";
import { suratMasukAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { JENIS_SURAT } from "../../utils/constants";

const SuratMasukCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    nomorSurat: "",
    tanggalSurat: "",
    tanggalDiterima: new Date().toISOString().split("T")[0], // Default hari ini
    pengirim: "",
    perihal: "",
    jenisSurat: "EKSTERNAL",
    keterangan: "",
    isLengkap: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
        data.append(key, formData[key]);
      });
      if (file) {
        data.append("file", file);
      }

      await suratMasukAPI.create(data);
      navigate("/surat-masuk");
    } catch (error) {
      console.error("Create surat error:", error);
      alert("Gagal membuat surat masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Tambah Surat Masuk" />

      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/surat-masuk")}
          className="mb-4"
        >
          <ArrowLeft size={20} />
          Kembali
        </Button>

        <Card className="max-w-3xl mx-auto">
          <Card.Header>
            <h2 className="text-lg font-semibold">Input Surat Masuk Baru</h2>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Nomor Surat *</label>
                  <input
                    type="text"
                    name="nomorSurat"
                    className="form-input"
                    placeholder="Contoh: 001/SK/2024"
                    value={formData.nomorSurat}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Tanggal Surat *</label>
                  <input
                    type="date"
                    name="tanggalSurat"
                    className="form-input"
                    value={formData.tanggalSurat}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="form-label">Tanggal Diterima *</label>
                  <input
                    type="date"
                    name="tanggalDiterima"
                    className="form-input"
                    value={formData.tanggalDiterima}
                    onChange={handleChange}
                    required
                  />
                </div>
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
              </div>

              <div>
                <label className="form-label">
                  Pengirim *{" "}
                  <span className="text-xs text-gray-400">
                    (min. 3 karakter)
                  </span>
                </label>
                <input
                  type="text"
                  name="pengirim"
                  className="form-input"
                  placeholder="Nama pengirim surat"
                  value={formData.pengirim}
                  onChange={handleChange}
                  minLength={3}
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  Perihal *{" "}
                  <span className="text-xs text-gray-400">
                    (min. 5 karakter)
                  </span>
                </label>
                <input
                  type="text"
                  name="perihal"
                  className="form-input"
                  placeholder="Perihal surat"
                  value={formData.perihal}
                  onChange={handleChange}
                  minLength={5}
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  Keterangan{" "}
                  <span className="text-xs text-gray-400">
                    (min. 10 karakter)
                  </span>
                </label>
                <textarea
                  name="keterangan"
                  className="form-input"
                  rows={3}
                  placeholder="Keterangan tambahan (opsional)"
                  value={formData.keterangan}
                  onChange={handleChange}
                  minLength={10}
                />
              </div>

              <div>
                <label className="form-label">Upload File Surat</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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
                        <p className="text-sm text-gray-400">
                          PDF, DOC, DOCX, JPG, PNG
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isLengkap"
                  id="isLengkap"
                  checked={formData.isLengkap}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="isLengkap" className="text-sm text-gray-700">
                  Surat sudah lengkap sesuai standar
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/surat-masuk")}
                  type="button"
                >
                  Batal
                </Button>
                <Button variant="primary" type="submit" loading={loading}>
                  Simpan Surat Masuk
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default SuratMasukCreate;
