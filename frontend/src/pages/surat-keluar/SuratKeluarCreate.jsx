import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileText, Edit } from "lucide-react";
import { suratKeluarAPI, jenisSuratAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";

const SuratKeluarCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("upload"); // 'upload' or 'create'
  const [jenisSuratOptions, setJenisSuratOptions] = useState([]);
  const [formData, setFormData] = useState({
    tujuan: "",
    perihal: "",
    isiSurat: "",
    keterangan: "",
    jenisSuratId: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isKabag = user.role?.startsWith("KEPALA_BAGIAN");

  useEffect(() => {
    if (!isKabag) {
      fetchJenisSurat();
    }
  }, [isKabag]);

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
        data.append("file", file);
      }

      await suratKeluarAPI.create(data);
      navigate("/surat-keluar");
    } catch (error) {
      console.error("Create surat error:", error);
      alert(isKabag ? "Gagal mengajukan surat" : "Gagal membuat surat keluar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title={isKabag ? "Ajukan Permintaan Surat" : "Buat Surat Keluar"}
      />

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
            <h2 className="text-lg font-semibold">
              {isKabag
                ? "Form Pengajuan Surat Keluar"
                : "Buat Surat Keluar Baru"}
            </h2>
            {/* Mode Toggle */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mode === "upload"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Upload size={18} />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setMode("create")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mode === "create"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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

              {/* Content based on mode */}
              {mode === "create" && (
                <div>
                  <label className="form-label">Isi Surat *</label>
                  <textarea
                    name="isiSurat"
                    className="form-input font-mono"
                    rows={12}
                    placeholder="Tulis isi surat di sini..."
                    value={formData.isiSurat}
                    onChange={handleChange}
                    required={mode === "create"}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Tulis isi surat secara lengkap. Format akan diproses saat
                    pencetakan.
                  </p>
                </div>
              )}

              {mode === "upload" && (
                <div>
                  <label className="form-label">Upload File Surat *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx"
                      required={mode === "upload"}
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
                            PDF, DOC, DOCX
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              )}

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
                  {loading
                    ? "Menyimpan..."
                    : isKabag
                    ? "Kirim Pengajuan"
                    : "Simpan Surat Keluar"}
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
