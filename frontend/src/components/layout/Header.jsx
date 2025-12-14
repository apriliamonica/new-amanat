import { Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLE_SHORT_NAMES } from "../../utils/constants";

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-sm transition-all pl-16 lg:pl-6">
      <div className="flex-1 min-w-0 mr-4">
        <h1 className="text-lg md:text-xl font-semibold text-gray-800 truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-blue-700">
            {ROLE_SHORT_NAMES[user?.role]}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
