import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Edit } from "lucide-react";
import { suratKeluarAPI, jenisSuratAPI, kodeAreaAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { KODE_AREA, KODE_AREA_NAMES } from "../../utils/constants";

const SuratKeluarCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [jenisSuratOptions, setJenisSuratOptions] = useState([]);
  const [formData, setFormData] = useState({
    tujuan: "",
    perihal: "",
    keterangan: "",
    jenisSuratId: "",
    tanggalSurat: new Date().toISOString().split("T")[0],
    kodeArea: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  // Safety check: if user role is missing, we can't determine mode
  if (!user.role) {
    navigate("/login");
    return null;
  }

  const isRequestMode = user.role !== "SEKRETARIS_KANTOR";
  const [kodeAreaOptions, setKodeAreaOptions] = useState([]);

  useEffect(() => {
    fetchJenisSurat();
    fetchKodeArea();
  }, []);

  const fetchJenisSurat = async () => {
    try {
      const response = await jenisSuratAPI.getAll();
      if (response.data.success) {
        setJenisSuratOptions(response.data.data);
      }
    } catch (error) {
      console.error("Fetch jenis surat error:", error);
    }
  };

  const fetchKodeArea = async () => {
    try {
      const response = await kodeAreaAPI.getAll();
      if (response.data.success) {
        setKodeAreaOptions(response.data.data);
      }
    } catch (error) {
      console.error("Fetch kode area error:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("Ukuran file melebihi 10MB. Harap unggah file yang lebih kecil.");
        e.target.value = null; // Reset input
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
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
        data.append("file", file);
      }

      await suratKeluarAPI.create(data);
      navigate("/surat-keluar");
    } catch (error) {
      console.error("Create surat error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Terjadi kesalahan";
      alert(
        (isRequestMode
          ? "Gagal mengajukan surat: "
          : "Gagal membuat surat keluar: ") + errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  // Derived variables for render
  const pageTitle = isRequestMode
    ? "Ajukan Permintaan Surat"
    : "Buat Surat Keluar";
  const cardTitle = isRequestMode
    ? "Form Pengajuan Surat Keluar"
    : "Buat Surat Keluar Baru";
  const submitButtonText = loading
    ? "Menyimpan..."
    : isRequestMode
    ? "Kirim Pengajuan"
    : "Simpan Surat Keluar";

  return (
    <div className="min-h-screen">
      <Header title={pageTitle} />

      <div className="p-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/surat-keluar")}
          className="mb-4"
        >
          <ArrowLeft size={20} />
          Kembali
        </Button>

        <Card className="max-w-3xl mx-auto">
          <Card.Header>
            <h2 className="text-lg font-semibold">{cardTitle}</h2>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label">
                  Tujuan *{" "}
                  <span className="text-xs text-gray-400">
                    (min. 3 karakter)
                  </span>
                </label>
                <input
                  type="text"
                  name="tujuan"
                  className="form-input"
                  placeholder="Nama penerima surat"
                  value={formData.tujuan}
                  onChange={handleChange}
                  minLength={3}
                  required
                />
              </div>

              {isRequestMode && (
                <div>
                  <label className="form-label">
                    Tanggal Surat Yang Diinginkan
                  </label>
                  <input
                    type="date"
                    name="tanggalSurat"
                    className="form-input"
                    value={formData.tanggalSurat}
                    onChange={handleChange}
                  />
                </div>
              )}

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

              {/* Jenis Surat - Enabled for Everyone */}
              <div>
                <label className="form-label">Jenis Surat</label>
                <select
                  name="jenisSuratId"
                  className="form-input"
                  value={formData.jenisSuratId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Pilih Jenis Surat --</option>
                  {jenisSuratOptions.map((jenis) => (
                    <option key={jenis.id} value={jenis.id}>
                      {jenis.kode} - {jenis.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Kode Area Surat *</label>
                <select
                  name="kodeArea"
                  className="form-input"
                  value={formData.kodeArea}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Pilih Area Surat --</option>
                  {kodeAreaOptions.map((area) => (
                    <option key={area.id} value={area.kode}>
                      {area.kode} - {area.nama}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Pilih area tujuan surat (misal: Instansi Pemerintah, Internal,
                  dll).
                </p>
              </div>

              {!isRequestMode && (
                <p className="text-xs text-gray-500 mt-1">
                  Format Nomor: .../
                  {jenisSuratOptions.find((j) => j.id === formData.jenisSuratId)
                    ?.kode || "SK"}
                  /{formData.kodeArea || "AREA"}/...
                </p>
              )}

              <div>
                <label className="form-label">
                  Upload File Surat {isRequestMode ? "(Opsional)" : "*"}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    required={!isRequestMode}
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
                      <>
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600 mb-2">
                          <Upload size={24} />
                        </div>
                        <p className="text-gray-600 font-medium">
                          Klik untuk mengunggah dokumen surat
                        </p>
                        <p className="text-sm text-gray-500">
                          Format: PDF, Word, Gambar (Max 10MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
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
                  rows={2}
                  placeholder="Keterangan tambahan (opsional)"
                  value={formData.keterangan}
                  onChange={handleChange}
                  minLength={10}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/surat-keluar")}
                  type="button"
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {submitButtonText}
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
