import { useState, useEffect } from "react";
import { Plus, Edit, Trash, Save, X, Search } from "lucide-react";
import axiosInstance, { jenisSuratAPI, kodeAreaAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { ROLE_NAMES } from "../../utils/constants";

// Sub-component: Kode Bagian Manager
const KodeBagianManager = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    kodeInternal: "",
    kodeEksternal: "",
    namaBagian: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get("/kode-bagian");
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      kodeInternal: item.kodeInternal,
      kodeEksternal: item.kodeEksternal,
      namaBagian: item.namaBagian,
    });
  };

  const handleSave = async (id) => {
    try {
      await axiosInstance.put(`/kode-bagian/${id}`, editForm);
      setEditingId(null);
      fetchData();
    } catch (error) {
      alert("Gagal mengupdate data");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
              Role
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
              Nama Bagian
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
              Internal
            </th>
            <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
              Eksternal
            </th>
            <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-gray-700">
                {ROLE_NAMES[item.role] || item.role}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {editingId === item.id ? (
                  <input
                    className="form-input text-sm py-1"
                    value={editForm.namaBagian}
                    onChange={(e) =>
                      setEditForm({ ...editForm, namaBagian: e.target.value })
                    }
                  />
                ) : (
                  item.namaBagian
                )}
              </td>
              <td className="px-4 py-3">
                {editingId === item.id ? (
                  <input
                    className="form-input text-sm py-1 w-20"
                    value={editForm.kodeInternal}
                    onChange={(e) =>
                      setEditForm({ ...editForm, kodeInternal: e.target.value })
                    }
                  />
                ) : (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-mono font-semibold">
                    {item.kodeInternal}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {editingId === item.id ? (
                  <input
                    className="form-input text-sm py-1 w-20"
                    value={editForm.kodeEksternal}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        kodeEksternal: e.target.value,
                      })
                    }
                  />
                ) : (
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-mono font-semibold">
                    {item.kodeEksternal}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {editingId === item.id ? (
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleSave(item.id)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={18} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Subcomponent: Generic Code Manager (Jenis Surat & Kode Area)
const GenericCodeManager = ({
  api,
  titleCode,
  titleName,
  placeholderCode,
  placeholderName,
}) => {
  const [data, setData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({ kode: "", nama: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ kode: "", nama: "" });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.getAll();
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handleAdd = async () => {
    try {
      await api.create(newForm);
      setIsAdding(false);
      setNewForm({ kode: "", nama: "" });
      fetchData();
    } catch (error) {
      alert("Gagal menambah data");
    }
  };

  const handleUpdate = async (id) => {
    try {
      await api.update(id, editForm);
      setEditingId(null);
      fetchData();
    } catch (error) {
      alert("Gagal update data");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus data ini?")) return;
    try {
      await api.delete(id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal hapus data");
    }
  };

  // Filter data by search term
  const filteredData = data.filter(
    (item) =>
      item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search & Add Button Row */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Cari..."
            className="form-input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          size="sm"
          className="whitespace-nowrap"
        >
          <Plus size={16} /> Tambah Data
        </Button>
      </div>

      {isAdding && (
        <div className="bg-blue-50 p-4 rounded border border-blue-200 flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500">
              {titleCode}
            </label>
            <input
              className="form-input text-sm"
              placeholder={placeholderCode}
              value={newForm.kode}
              onChange={(e) => setNewForm({ ...newForm, kode: e.target.value })}
            />
          </div>
          <div className="flex-[2]">
            <label className="text-xs font-semibold text-gray-500">
              {titleName}
            </label>
            <input
              className="form-input text-sm"
              placeholder={placeholderName}
              value={newForm.nama}
              onChange={(e) => setNewForm({ ...newForm, nama: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pb-1">
            <Button size="sm" onClick={handleAdd}>
              Simpan
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                {titleCode}
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">
                {titleName}
              </th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  {editingId === item.id ? (
                    <input
                      className="form-input text-sm py-1 w-24"
                      value={editForm.kode}
                      onChange={(e) =>
                        setEditForm({ ...editForm, kode: e.target.value })
                      }
                    />
                  ) : (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-mono font-semibold">
                      {item.kode}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {editingId === item.id ? (
                    <input
                      className="form-input text-sm py-1 w-full"
                      value={editForm.nama}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nama: e.target.value })
                      }
                    />
                  ) : (
                    item.nama
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {editingId === item.id ? (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleUpdate(item.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Save size={18} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditForm({ kode: item.kode, nama: item.nama });
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MasterData = () => {
  const [activeTab, setActiveTab] = useState("kode-bagian");

  return (
    <div className="min-h-screen">
      <Header title="Pengaturan Kodefikasi Surat" />
      <div className="p-6 space-y-6">
        <div className="flex gap-4 border-b">
          <button
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === "kode-bagian"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("kode-bagian")}
          >
            Kode Bagian (Unit)
          </button>
          <button
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === "jenis-surat"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("jenis-surat")}
          >
            Kode Surat (Jenis)
          </button>
          <button
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === "kode-area"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("kode-area")}
          >
            Kode Tujuan (Area)
          </button>
        </div>

        <Card>
          <Card.Body>
            {activeTab === "kode-bagian" && <KodeBagianManager />}
            {activeTab === "jenis-surat" && (
              <GenericCodeManager
                api={jenisSuratAPI}
                titleCode="Kode Surat"
                titleName="Keterangan / Nama"
                placeholderCode="SK"
                placeholderName="Surat Keputusan"
              />
            )}
            {activeTab === "kode-area" && (
              <GenericCodeManager
                api={kodeAreaAPI}
                titleCode="Kode Area"
                titleName="Nama Area / Tujuan"
                placeholderCode="A"
                placeholderName="Intern Kantor Yayasan"
              />
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default MasterData;
