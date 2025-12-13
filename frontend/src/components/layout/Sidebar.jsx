import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Mail,
  Send,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
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
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-green-400 via-yellow-300 to-orange-300 shadow-xl z-50 transition-all duration-300
          ${isCollapsed ? "w-20" : "w-64"}
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/20">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/90 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-green-600 font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl text-green-800">AMANAT</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 bg-white/90 rounded-lg flex items-center justify-center mx-auto shadow-sm">
              <span className="text-green-600 font-bold text-lg">A</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/30 text-green-700"
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
          <button
            onClick={closeMobile}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/30 text-green-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div
          className={`p-4 border-b border-white/20 ${
            isCollapsed ? "text-center" : ""
          }`}
        >
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-green-600 font-semibold text-sm">
                {getInitials(user?.nama)}
              </span>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="font-medium text-green-800 truncate">
                  {user?.nama}
                </p>
                <p className="text-xs text-green-700/80 truncate">
                  {ROLE_SHORT_NAMES[user?.role]}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""} ${
                      isCollapsed ? "justify-center px-2" : ""
                    }`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-green-500/30">
          <button
            onClick={handleLogout}
            className={`sidebar-link-light w-full text-green-700 hover:bg-white/40 hover:text-red-600 ${
              isCollapsed ? "justify-center px-2" : ""
            }`}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
