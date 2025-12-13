import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, FileText, User } from "lucide-react";
import { suratMasukAPI, userAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";

const SuratMasukCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [userOptions, setUserOptions] = useState([]);
  const [formData, setFormData] = useState({
    nomorSurat: "",
    tanggalSurat: "",
    tanggalDiterima: new Date().toISOString().split("T")[0], // Default hari ini
    pengirim: "",
    perihal: "",
    keterangan: "",
    isLengkap: true,
    tujuanDisposisiId: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      if (response.data.users) {
        // Filter out current admin and normal staff, keep Petinggi & Kabag
        // Assuming response.data.users contains all users
        // Use a cleaner filter if roles are strictly defined.
        // Showing all non-admin users for now or specific roles as requested: "Ketua, Sekpeng, Bendahara, Kabag"
        const allowedRoles = [
          "KETUA_PENGURUS",
          "SEKRETARIS_PENGURUS",
          "BENDAHARA",
          "KEPALA_BAGIAN_PSDM",
          "KEPALA_BAGIAN_KEUANGAN",
          "KEPALA_BAGIAN_UMUM",
        ];
        const targets = response.data.users.filter((u) =>
          allowedRoles.includes(u.role)
        );
        setUserOptions(targets);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

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
                <div>
                  <label className="form-label">Pengirim *</label>
                  <input
                    type="text"
                    name="pengirim"
                    className="form-input"
                    placeholder="Nama / Instansi Pengirim"
                    value={formData.pengirim}
                    onChange={handleChange}
                    required
                  />
                </div>
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

              <div>
                <label className="form-label">
                  Tujuan Surat (Disposisi Ke) *
                </label>
                <select
                  name="tujuanDisposisiId"
                  className="form-input"
                  value={formData.tujuanDisposisiId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Pilih Penerima Surat --</option>
                  {userOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nama} ({u.role.replace(/_/g, " ")})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Surat akan langsung didisposisikan ke penerima ini.
                </p>
              </div>

              <div>
                <label className="form-label">Upload File Surat *</label>
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
                        <p>Klik untuk mengunggah dokumen surat</p>
                        <p className="text-sm text-gray-400">
                          PDF, DOC, DOCX, JPG, PNG
                        </p>
                      </div>
                    )}
                  </label>
                </div>
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
