require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const suratMasukRoutes = require("./routes/suratMasukRoutes");
const suratKeluarRoutes = require("./routes/suratKeluarRoutes");
const disposisiRoutes = require("./routes/disposisiRoutes");
const lampiranRoutes = require("./routes/lampiranRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const jenisSuratRoutes = require("./routes/jenisSuratRoutes");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/surat-masuk", suratMasukRoutes);
app.use("/api/surat-keluar", suratKeluarRoutes);
app.use("/api/disposisi", disposisiRoutes);
app.use("/api/lampiran", lampiranRoutes);
app.use("/api/jenis-surat", jenisSuratRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "AMANAT API is running" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint tidak ditemukan" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ message: "Terjadi kesalahan pada server" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AMANAT API running on port ${PORT}`);
});

module.exports = app;
