import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-yellow-300 to-orange-300 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 flex items-center justify-center rounded-full p-2 ">
              <img
                src="/LogoYPTU.png"
                alt="Logo AMANAT"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-1">AMANAT</h1>
          <p className="text-green-700">Sistem Manajemen Surat</p>
          <p className="text-green-600 text-sm">
            Yayasan Perguruan Tinggi Universitas De La Salle Manado
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fadeIn">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Masuk ke Akun Anda
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-14 transition-all duration-200 focus:bg-white"
                  placeholder="contoh@email.com"
                  required
                />
                {/* <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                /> */}
              </div>
            </div>

            <div>
              <label className="form-label">Kata Sandi</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-14 pr-14 transition-all duration-200 focus:bg-white"
                  placeholder="••••••••"
                  required
                />
                {/* <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                /> */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-6"
            >
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-red-500">*</span>Hubungi
              Sekretaris Kantor jika lupa password
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-green-700 text-sm mt-6">
          © 2025 AMANAT - YPTU DLSU
        </p>
      </div>
    </div>
  );
};

export default Login;
