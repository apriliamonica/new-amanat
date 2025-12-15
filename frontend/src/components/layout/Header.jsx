import { Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ROLE_SHORT_NAMES } from "../../utils/constants";

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8 transition-all duration-300">
      <div className="flex-1 min-w-0 mr-4 ml-12 lg:ml-0">
        <h1 className="text-lg lg:text-2xl font-bold text-gray-800 tracking-tight font-display truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl hover:bg-gray-100/80 transition-all text-gray-600 hover:text-green-600 hover:shadow-sm">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Badge */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-green-50/80 border border-green-100 rounded-xl shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-semibold text-green-700 tracking-wide">
            {ROLE_SHORT_NAMES[user?.role]}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
