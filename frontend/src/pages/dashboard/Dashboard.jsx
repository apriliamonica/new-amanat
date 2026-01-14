import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  FileText,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  PenTool,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { dashboardAPI } from "../../api/axios";
import Header from "../../components/layout/Header";
import Card from "../../components/common/Card";
import StatusBadge from "../../components/common/StatusBadge";
import {
  ROLE_NAMES,
  isAdmin,
  isKetua,
  canValidate,
} from "../../utils/constants";
import { formatRelativeTime } from "../../utils/helpers";
import Pagination from "../../components/common/Pagination";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activitiesMasuk, setActivitiesMasuk] = useState([]);
  const [activitiesKeluar, setActivitiesKeluar] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination for Activities
  const [pageMasuk, setPageMasuk] = useState(1);
  const [pageKeluar, setPageKeluar] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecent(),
        ]);
        setStats(statsRes.data.stats);
        setActivitiesMasuk(activitiesRes.data.activitiesMasuk || []);
        setActivitiesKeluar(activitiesRes.data.activitiesKeluar || []);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Polling every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Stats cards based on role
  const getStatsCards = () => {
    if (!stats) return [];

    if (isAdmin(user?.role)) {
      return [
        {
          title: "Total Surat Masuk",
          value: stats.totalSuratMasuk || 0,
          icon: Mail,
          color: "bg-gray-600",
          bgColor: "bg-gray-50",
        },
        {
          title: "Total Surat Keluar",
          value: stats.totalSuratKeluar || 0,
          icon: Send,
          color: "bg-gray-600",
          bgColor: "bg-gray-50",
        },
        {
          title: "Disposisi Saat Ini",
          value: stats.disposisiPending || 0,
          icon: Clock,
          color: "bg-gray-600",
          bgColor: "bg-gray-50",
        },
      ];
    }

    const cards = [
      {
        title: "Surat Masuk hari ini",
        value: stats.disposisiDiterima || 0,
        icon: FileText,
        color: "bg-gray-600",
        bgColor: "bg-gray-50",
      },
      {
        title: "Surat Keluar hari ini",
        value: stats.mySuratKeluar || 0,
        icon: CheckCircle,
        color: "bg-gray-600",
        bgColor: "bg-gray-50",
      },
    ];

    if (isKetua(user?.role)) {
      cards.push({
        title: "Menunggu Tanda Tangan",
        value: stats.menungguTTD || 0,
        icon: PenTool,
        color: "bg-gray-600",
        bgColor: "bg-gray-50",
      });
    }

    if (canValidate(user?.role)) {
      cards.push({
        title: "Menunggu Validasi",
        value: stats.menungguValidasi || 0,
        icon: AlertCircle,
        color: "bg-gray-600",
        bgColor: "bg-gray-50",
      });
    }

    return cards;
  };

  const statsCards = getStatsCards();

  // Paginate Masuk
  const lastMasuk = pageMasuk * itemsPerPage;
  const firstMasuk = lastMasuk - itemsPerPage;
  const currentMasuk = activitiesMasuk.slice(firstMasuk, lastMasuk);

  // Paginate Keluar
  const lastKeluar = pageKeluar * itemsPerPage;
  const firstKeluar = lastKeluar - itemsPerPage;
  const currentKeluar = activitiesKeluar.slice(firstKeluar, lastKeluar);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Memuat beranda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Beranda" />

      <div className="p-6 lg:p-8 space-y-8">
        {/* Welcome Message */}
        <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 p-6 lg:p-10 text-white shadow-xl shadow-green-900/20 group">
          <div className="relative z-10">
            <h2 className="text-xl lg:text-3xl font-bold mb-2 tracking-tight">
              Selamat Datang, {user?.nama}!
            </h2>
            <p className="text-green-50/90 text-sm lg:text-lg font-medium max-w-2xl">
              {ROLE_NAMES[user?.role]}
            </p>
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 transition-transform duration-700 group-hover:scale-110"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <Card
              key={index}
              className={`p-6 border-0 border-l-4 ${stat.color.replace(
                "bg-",
                "border-"
              )} shadow-md overflow-hidden relative bg-gradient-to-r from-${stat.bgColor.replace(
                "bg-",
                ""
              )} via-white to-white`}
            >
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm font-bold mb-1 uppercase tracking-wider ${stat.color.replace(
                      "bg-",
                      "text-"
                    )}`}
                  >
                    {stat.title}
                  </p>
                  <p className="text-4xl font-bold text-gray-800 tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-2xl ${stat.bgColor} shadow-sm bg-white/50 backdrop-blur-sm`}
                >
                  <stat.icon
                    className={`text-${stat.color.replace("bg-", "")}`}
                    size={28}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Activities - Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Surat Masuk Activities */}
          <Card className="h-full border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <Card.Header className="border-b border-gray-100 pb-4 pt-6 px-6 bg-gradient-to-r from-white to-gray-50/50 rounded-t-xl">
              <h3 className="font-bold text-gray-800 flex items-center gap-3 text-lg">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Mail size={20} className="text-blue-600" />
                </div>
                Aktivitas Surat Masuk
              </h3>
            </Card.Header>
            <Card.Body className="p-0">
              {activitiesMasuk.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 font-medium text-sm">
                    Belum ada aktivitas (24 jam terakhir)
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-50">
                    {currentMasuk.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-4 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle size={14} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-bold text-gray-900">
                                {activity.aksi}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {formatRelativeTime(activity.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {activity.suratMasuk?.perihal || "-"}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              Oleh: {activity.user?.nama || "Sistem"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {activitiesMasuk.length > itemsPerPage && (
                    <div className="p-3 border-t border-gray-100 bg-gray-50/30">
                      <Pagination
                        currentPage={pageMasuk}
                        totalItems={activitiesMasuk.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPageMasuk}
                      />
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>

          {/* Surat Keluar Activities */}
          <Card className="h-full border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <Card.Header className="border-b border-gray-100 pb-4 pt-6 px-6 bg-gradient-to-r from-white to-gray-50/50 rounded-t-xl">
              <h3 className="font-bold text-gray-800 flex items-center gap-3 text-lg">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Send size={20} className="text-green-600" />
                </div>
                Aktivitas Surat Keluar
              </h3>
            </Card.Header>
            <Card.Body className="p-0">
              {activitiesKeluar.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 font-medium text-sm">
                    Belum ada aktivitas (24 jam terakhir)
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-50">
                    {currentKeluar.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-4 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle size={14} className="text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-bold text-gray-900">
                                {activity.aksi}
                              </p>
                              <span className="text-[10px] text-gray-400">
                                {formatRelativeTime(activity.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {activity.suratKeluar?.perihal || "-"}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              Oleh: {activity.user?.nama || "Sistem"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {activitiesKeluar.length > itemsPerPage && (
                    <div className="p-3 border-t border-gray-100 bg-gray-50/30">
                      <Pagination
                        currentPage={pageKeluar}
                        totalItems={activitiesKeluar.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPageKeluar}
                      />
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
