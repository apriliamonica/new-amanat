import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Mail,
  Send,
  FileText,
  Users,
  LogOut,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  ROLES,
  ROLE_SHORT_NAMES,
  isAdmin,
  isKabag,
} from "../../utils/constants";
import { getInitials } from "../../utils/helpers";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Define menu items based on role
  const getMenuItems = () => {
    const baseItems = [
      {
        path: "/dashboard",
        icon: LayoutDashboard,
        label: "Beranda",
        roles: "all",
      },
      {
        path: "/surat-masuk",
        icon: Mail,
        label: "Surat Masuk",
        roles: "all",
      },
      {
        path: "/surat-keluar",
        icon: Send,
        label: "Surat Keluar",
        roles: "all",
      },
    ];

    // Add disposisi for non-admin roles
    if (!isAdmin(user?.role)) {
      baseItems.push({
        path: "/disposisi",
        icon: FileText,
        label: "Disposisi Saya",
        roles: "all",
      });
    }

    // Add user management for admin only
    if (isAdmin(user?.role)) {
      baseItems.push({
        path: "/users",
        icon: Users,
        label: "Kelola Pengguna",
        roles: [ROLES.SEKRETARIS_KANTOR],
      });
      baseItems.push({
        path: "/admin/master-data",
        icon: Settings,
        label: "Pengaturan",
        roles: [ROLES.SEKRETARIS_KANTOR],
      });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    await logout();
  };

  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/90 backdrop-blur rounded-xl shadow-lg border border-gray-100 text-green-700"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-green-600 via-emerald-600 to-teal-700 backdrop-blur-xl border-r border-white/10 z-50 transition-all duration-300 ease-in-out shadow-2xl w-72
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Header */}
        <div className="h-28 flex items-center justify-between px-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl backdrop-blur-sm shadow-inner flex-shrink-0">
              <img
                src="/LogoYPTU.png"
                alt="Logo AMANAT"
                className="w-9 h-9 object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-xl text-white tracking-tight">
                AMANAT
              </h1>
              <p className="text-[9px] text-green-100 leading-tight opacity-80">
                Yayasan PTU De La Salle Manado
              </p>
            </div>
          </div>

          {/* Close Menu (Mobile) */}
          <button
            onClick={closeMobile}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/20 text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="py-6 px-4 border-b border-white/10">
          <div className="flex items-center p-3 rounded-2xl bg-black/5 border border-white/5 gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white/20">
              <span className="text-white font-bold text-sm drop-shadow-sm">
                {getInitials(user?.nama)}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-white text-sm truncate">
                {user?.nama}
              </p>
              <p className="text-xs text-green-100/70 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block"></span>
                {ROLE_SHORT_NAMES[user?.role]}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1 overflow-y-auto space-y-1 my-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobile}
              className={({ isActive }) =>
                `sidebar-link group ${isActive ? "active" : ""}`
              }
            >
              <div className="p-1.5 rounded-lg transition-all duration-300 group-hover:scale-110 bg-white/5 group-hover:bg-white/20">
                <item.icon size={20} strokeWidth={2} />
              </div>
              <span className="tracking-wide text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10 bg-black/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-red-200 hover:bg-red-500/10 hover:text-red-100 border border-transparent hover:border-red-500/20"
          >
            <LogOut size={20} />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
