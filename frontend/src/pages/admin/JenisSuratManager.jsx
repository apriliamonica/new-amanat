import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { jenisSuratAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";

const JenisSuratManager = () => {
  const [jenisSuratList, setJenisSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: "", kode: "", nama: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await jenisSuratAPI.getAll();
      if (response.data.success) {
        setJenisSuratList(response.data.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({ id: "", kode: "", nama: "" });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setFormData({ id: item.id, kode: item.kode, nama: item.nama });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus jenis surat ini?")) return;
    try {
      await jenisSuratAPI.delete(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menghapus");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await jenisSuratAPI.update(formData.id, formData);
      } else {
        await jenisSuratAPI.create(formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Manajemen Jenis Surat" />

      <div className="p-6">
        <Card>
          <Card.Header>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Daftar Jenis Surat</h3>
                <p className="text-sm text-gray-500">
                  Kelola kode dan format penomoran surat keluar
                </p>
              </div>
              <Button variant="primary" onClick={handleCreate}>
                <Plus size={18} />
                Tambah Jenis
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                        Kode
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                        Nama Jenis Surat
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                        Preview Nomor
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {jenisSuratList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium font-mono text-blue-600">
                          {item.kode}
                        </td>
                        <td className="px-4 py-3">{item.nama}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                          XXX/{item.kode}/YPD/...
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="small"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit2 size={16} className="text-orange-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="small"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {jenisSuratList.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          Belum ada data jenis surat.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? "Edit Jenis Surat" : "Tambah Jenis Surat"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Kode (Format Nomor)</label>
            <input
              type="text"
              className="form-input uppercase"
              placeholder="Contoh: SK, UND, ST"
              value={formData.kode}
              onChange={(e) =>
                setFormData({ ...formData, kode: e.target.value.toUpperCase() })
              }
              maxLength={5}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maksimal 5 karakter. Contoh hasil: 001/
              <b>{formData.kode || "..."}</b>/YPD/...
            </p>
          </div>
          <div>
            <label className="form-label">Nama Jenis Surat</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Surat Keputusan"
              value={formData.nama}
              onChange={(e) =>
                setFormData({ ...formData, nama: e.target.value })
              }
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowModal(false)}
            >
              Batal
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default JenisSuratManager;
