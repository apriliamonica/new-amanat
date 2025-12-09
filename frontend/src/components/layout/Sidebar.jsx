import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_SHORT_NAMES, isAdmin, isKabag } from '../../utils/constants';
import { getInitials } from '../../utils/helpers';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Define menu items based on role
  const getMenuItems = () => {
    const baseItems = [
      {
        path: '/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        roles: 'all',
      },
      {
        path: '/surat-masuk',
        icon: Mail,
        label: 'Surat Masuk',
        roles: 'all',
      },
      {
        path: '/surat-keluar',
        icon: Send,
        label: 'Surat Keluar',
        roles: 'all',
      },
    ];

    // Add disposisi for non-admin roles
    if (!isAdmin(user?.role)) {
      baseItems.push({
        path: '/disposisi',
        icon: FileText,
        label: 'Disposisi Saya',
        roles: 'all',
      });
    }

    // Add user management for admin only
    if (isAdmin(user?.role)) {
      baseItems.push({
        path: '/users',
        icon: Users,
        label: 'Kelola User',
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
          fixed top-0 left-0 h-full bg-white shadow-xl z-50 transition-all duration-300
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="font-bold text-xl text-gray-800">AMANAT</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button
            onClick={closeMobile}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className={`p-4 border-b ${isCollapsed ? 'text-center' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-semibold text-sm">
                {getInitials(user?.nama)}
              </span>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="font-medium text-gray-800 truncate">{user?.nama}</p>
                <p className="text-xs text-gray-500 truncate">
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
                    `sidebar-link ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-2' : ''}`
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
        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className={`sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700 ${isCollapsed ? 'justify-center px-2' : ''}`}
            title={isCollapsed ? 'Logout' : undefined}
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
