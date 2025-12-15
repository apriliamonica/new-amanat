import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import { userAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { ROLES, ROLE_NAMES } from "../../utils/constants";
import { formatDate } from "../../utils/helpers";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nama: "",
    role: ROLES.SEKRETARIS_KANTOR,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data.users);
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      nama: "",
      role: ROLES.SEKRETARIS_KANTOR,
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      nama: user.nama,
      role: user.role,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userAPI.update(editingUser.id, updateData);
      } else {
        await userAPI.create(formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error("Submit user error:", error);
      alert(error.response?.data?.message || "Gagal menyimpan user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userAPI.update(user.id, { isActive: !user.isActive });
      fetchUsers();
    } catch (error) {
      console.error("Toggle active error:", error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Kelola User" />

      <div className="p-6 space-y-6">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={20} />
            Tambah User
          </Button>
        </div>

        {/* User Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th className="text-left w-1/4">Nama</th>
                  <th className="text-left w-1/4">Email</th>
                  <th className="text-left">Role</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Dibuat</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium text-gray-800">{user.nama}</td>
                    <td className="text-gray-600 font-mono text-sm">
                      {user.email}
                    </td>
                    <td>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {ROLE_NAMES[user.role]}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${
                          user.isActive
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}
                      >
                        {user.isActive ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        )}
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => openEditModal(user)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => handleToggleActive(user)}
                          className={
                            user.isActive
                              ? "hover:bg-red-50 hover:text-red-600"
                              : "hover:bg-green-50 hover:text-green-600"
                          }
                          title={user.isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {user.isActive ? (
                            <UserX size={16} />
                          ) : (
                            <UserCheck size={16} />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? "Edit User" : "Tambah User Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Nama Lengkap *</label>
            <input
              type="text"
              name="nama"
              className="form-input"
              value={formData.nama}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="form-label">
              Password {editingUser ? "(Kosongkan jika tidak diubah)" : "*"}
            </label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required={!editingUser}
            />
          </div>
          <div>
            <label className="form-label">Role *</label>
            <select
              name="role"
              className="form-input"
              value={formData.role}
              onChange={handleChange}
              required
            >
              {Object.entries(ROLE_NAMES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              type="button"
            >
              Batal
            </Button>
            <Button variant="primary" type="submit" loading={submitting}>
              {editingUser ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserList;
