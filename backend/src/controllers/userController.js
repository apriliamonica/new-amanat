const bcrypt = require("bcryptjs");
const prisma = require("../config/database");

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get users by role
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    const users = await prisma.user.findMany({
      where: { role, isActive: true },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
      },
    });

    res.json({ users });
  } catch (error) {
    console.error("Get users by role error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create user
const createUser = async (req, res) => {
  try {
    const { email, password, nama, role } = req.body;

    if (!email || !password || !nama || !role) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // Check if role is already taken by an active user
    // Note: SEKRETARIS_KANTOR (Admin) might be an exception if multiple admins are allowed,
    // but based on "all roles filled" requirement, we assume 1 user per role for now.
    // If Admin allows multiple, we can add a condition here.
    // Assuming strict 1-to-1 mapping for now based on user request.
    const existingRoleUser = await prisma.user.findFirst({
      where: {
        role: role,
        isActive: true,
      },
    });

    if (existingRoleUser) {
      return res.status(400).json({
        message: `Role ${role} sudah terisi oleh pengguna aktif lain.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nama,
        role,
      },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "User berhasil dibuat",
      user,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, nama, role, isActive } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Check if email is being changed and already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        return res.status(400).json({ message: "Email sudah digunakan" });
      }
    }

    const updateData = {};
    if (email) updateData.email = email;
    if (nama) updateData.nama = nama;
    if (role) updateData.role = role;
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({
      message: "User berhasil diupdate",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user (Hard Delete)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Hard delete
    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "User berhasil dihapus permanen" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getUsersByRole,
  createUser,
  updateUser,
  deleteUser,
};
