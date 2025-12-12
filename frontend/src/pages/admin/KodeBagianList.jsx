import { useState, useEffect } from "react";
import { Plus, Search, Edit, Save, X } from "lucide-react";
import axiosInstance from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { ROLE_NAMES } from "../../utils/constants";

const KodeBagianList = () => {
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

  const handleDisplayRole = (role) => {
    return ROLE_NAMES[role] || role;
  };

  const handleSave = async (id) => {
    try {
      await axiosInstance.put(`/kode-bagian/${id}`, editForm);
      setEditingId(null);
      fetchData();
    } catch (error) {
      console.error("Update error:", error);
      alert("Gagal mengupdate data");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  return (
    <div className="min-h-screen">
      <Header title="Master Data Kode Bagian" />

      <div className="p-6">
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold">Daftar Kode Bagian</h2>
          </Card.Header>
          <Card.Body>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-4 font-semibold text-gray-600">Role</th>
                    <th className="p-4 font-semibold text-gray-600">
                      Nama Bagian
                    </th>
                    <th className="p-4 font-semibold text-gray-600">
                      Kode Internal
                    </th>
                    <th className="p-4 font-semibold text-gray-600">
                      Kode Eksternal
                    </th>
                    <th className="p-4 font-semibold text-gray-600">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-4 text-sm font-medium text-gray-700">
                          {handleDisplayRole(item.role)}
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {editingId === item.id ? (
                            <input
                              className="form-input text-xs"
                              value={editForm.namaBagian}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  namaBagian: e.target.value,
                                })
                              }
                            />
                          ) : (
                            item.namaBagian
                          )}
                        </td>
                        <td className="p-4">
                          {editingId === item.id ? (
                            <input
                              className="form-input text-xs w-20"
                              value={editForm.kodeInternal}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  kodeInternal: e.target.value,
                                })
                              }
                            />
                          ) : (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-mono">
                              {item.kodeInternal}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {editingId === item.id ? (
                            <input
                              className="form-input text-xs w-20"
                              value={editForm.kodeEksternal}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  kodeEksternal: e.target.value,
                                })
                              }
                            />
                          ) : (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-mono">
                              {item.kodeEksternal}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {editingId === item.id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSave(item.id)}
                                className="text-green-600 hover:text-green-800"
                                title="Simpan"
                              >
                                <Save size={18} />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="text-red-600 hover:text-red-800"
                                title="Batal"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default KodeBagianList;
