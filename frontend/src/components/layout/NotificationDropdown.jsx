import { useState, useEffect, useRef } from "react";
import { Bell, Info, AlertCircle, FileText, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({ total: 0, items: [] });
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications/summary");
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type, subtype) => {
    if (type === "history") return <Info size={16} className="text-blue-500" />;
    switch (subtype) {
      case "disposisi":
        return <FileText size={16} className="text-orange-500" />;
      case "request":
        return <AlertCircle size={16} className="text-purple-500" />;
      case "sign":
        return <FileText size={16} className="text-red-500" />;
      case "validate":
        return <CheckCircle size={16} className="text-yellow-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="relative p-2.5 rounded-xl hover:bg-gray-100/80 transition-all text-gray-600 hover:text-green-600 hover:shadow-sm"
      >
        <Bell size={20} />
        {notifications.total > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Notifikasi</h3>
            <button
              onClick={fetchNotifications}
              className="text-xs text-green-600 hover:text-green-700 font-medium"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {notifications.items.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Belum ada notifikasi baru</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.items.map((item) => (
                  <div
                    key={item.id}
                    className={`block p-4 hover:bg-gray-50 transition-colors ${
                      item.type === "action" ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          item.type === "action" ? "bg-red-50" : "bg-blue-50"
                        }`}
                      >
                        {getIcon(item.type, item.subtype)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.link ? (
                          <Link
                            to={item.link}
                            onClick={() => setIsOpen(false)}
                            className="block"
                          >
                            <p className="text-sm font-medium text-gray-800 hover:text-green-600 transition-colors">
                              {item.message}
                            </p>
                          </Link>
                        ) : (
                          <p className="text-sm font-medium text-gray-800">
                            {item.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {item.detail}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {new Date(item.time).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
