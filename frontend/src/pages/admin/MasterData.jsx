import { useState, useEffect } from "react";
import { Plus, Edit, Trash, Save, X, Search } from "lucide-react";
import axiosInstance, { jenisSuratAPI, kodeAreaAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { ROLE_NAMES } from "../../utils/constants";
import Pagination from "../../components/common/Pagination";

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Smaller default for settings

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
      alert(error.response?.data?.message || "Gagal mengupdate data");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="table-modern">
        <thead>
          <tr>
            <th className="text-left">Role</th>
            <th className="text-left">Nama Bagian</th>
            <th className="text-left w-24">Internal</th>
            <th className="text-left w-24">Eksternal</th>
            <th className="text-center w-32">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((item) => (
              <tr key={item.id}>
                <td className="font-medium text-gray-700">
                  {ROLE_NAMES[item.role] || item.role}
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      className="form-input text-sm py-1"
                      value={editForm.namaBagian}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          namaBagian: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    item.namaBagian
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      className="form-input text-sm py-1 w-20"
                      value={editForm.kodeInternal}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          kodeInternal: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border border-blue-100">
                      {item.kodeInternal}
                    </span>
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      className="form-input text-sm py-1 w-20"
                      value={editForm.kodeEksternal}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          kodeEksternal: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border border-purple-100">
                      {item.kodeEksternal}
                    </span>
                  )}
                </td>
                <td className="text-center">
                  {editingId === item.id ? (
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => handleSave(item.id)}
                        className="text-green-600 hover:bg-green-50"
                      >
                        <Save size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => setEditingId(null)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit size={16} />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-100">
        <Pagination
          currentPage={currentPage}
          totalItems={data.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
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
  placeholderSearch = "Cari kode atau nama...",
}) => {
  const [data, setData] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newForm, setNewForm] = useState({ kode: "", nama: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ kode: "", nama: "" });
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
      alert(error.response?.data?.message || "Gagal menambah data");
    }
  };

  const handleUpdate = async (id) => {
    try {
      await api.update(id, editForm);
      setEditingId(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal update data");
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

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-4">
      {/* Search & Add Button Row */}
      <div className="flex flex-col md:flex-row gap-3 items-center mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder={placeholderSearch}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm"
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

      {/* Add Modal */}
      <Modal
        isOpen={isAdding}
        onClose={() => {
          setIsAdding(false);
          setNewForm({ kode: "", nama: "" });
        }}
        title="Tambah Data Baru"
      >
        <div className="space-y-4">
          <div>
            <label className="form-label">{titleCode} *</label>
            <input
              className="form-input"
              placeholder={placeholderCode}
              value={newForm.kode}
              onChange={(e) => setNewForm({ ...newForm, kode: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="form-label">{titleName} *</label>
            <input
              className="form-input"
              placeholder={placeholderName}
              value={newForm.nama}
              onChange={(e) => setNewForm({ ...newForm, nama: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAdding(false);
                setNewForm({ kode: "", nama: "" });
              }}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={!newForm.kode || !newForm.nama}
            >
              <Save size={16} />
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      <div className="overflow-x-auto">
        <table className="table-modern">
          <thead>
            <tr>
              <th className="text-left w-32">{titleCode}</th>
              <th className="text-left">{titleName}</th>
              <th className="text-center w-32">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item) => (
              <tr key={item.id}>
                <td>
                  {editingId === item.id ? (
                    <input
                      className="form-input text-sm py-1 w-24"
                      value={editForm.kode}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          kode: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <span className="bg-gray-50 text-gray-700 px-2.5 py-1 rounded-md text-sm font-mono font-semibold border border-gray-200">
                      {item.kode}
                    </span>
                  )}
                </td>
                <td className="text-gray-600">
                  {editingId === item.id ? (
                    <input
                      className="form-input text-sm py-1 w-full"
                      value={editForm.nama}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          nama: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    item.nama
                  )}
                </td>
                <td className="text-center">
                  {editingId === item.id ? (
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => handleUpdate(item.id)}
                        className="text-green-600 hover:bg-green-50"
                      >
                        <Save size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => setEditingId(null)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditForm({ kode: item.kode, nama: item.nama });
                        }}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-100">
        <Pagination
          currentPage={currentPage}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

const MasterData = () => {
  const [activeTab, setActiveTab] = useState("kode-bagian");

  return (
    <div className="min-h-screen">
      <Header title="Pengaturan Kodefikasi Surat" />
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        <div className="flex gap-2 border-b pb-1">
          <button
            className={`py-2 px-5 font-medium rounded-t-lg transition-all duration-200 ${
              activeTab === "kode-bagian"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                : "text-gray-600 hover:bg-green-50/80 hover:text-green-600 hover:backdrop-blur-sm"
            }`}
            onClick={() => setActiveTab("kode-bagian")}
          >
            Kode Bagian (Unit)
          </button>
          <button
            className={`py-2 px-5 font-medium rounded-t-lg transition-all duration-200 ${
              activeTab === "jenis-surat"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                : "text-gray-600 hover:bg-green-50/80 hover:text-green-600 hover:backdrop-blur-sm"
            }`}
            onClick={() => setActiveTab("jenis-surat")}
          >
            Kode Surat (Jenis)
          </button>
          <button
            className={`py-2 px-5 font-medium rounded-t-lg transition-all duration-200 ${
              activeTab === "kode-area"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                : "text-gray-600 hover:bg-green-50/80 hover:text-green-600 hover:backdrop-blur-sm"
            }`}
            onClick={() => setActiveTab("kode-area")}
          >
            Kode Tujuan (Area)
          </button>
        </div>

        <Card>
          <Card.Body className="p-0">
            {activeTab === "kode-bagian" && <KodeBagianManager />}
            {activeTab === "jenis-surat" && (
              <GenericCodeManager
                api={jenisSuratAPI}
                titleCode="Kode Surat"
                titleName="Keterangan / Nama"
                placeholderCode="SK"
                placeholderName="Surat Keputusan"
                placeholderSearch="Cari kode atau jenis surat..."
              />
            )}
            {activeTab === "kode-area" && (
              <GenericCodeManager
                api={kodeAreaAPI}
                titleCode="Kode Area"
                titleName="Nama Area / Tujuan"
                placeholderCode="A"
                placeholderName="Intern Kantor Yayasan"
                placeholderSearch="Cari kode atau tujuan..."
              />
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default MasterData;
