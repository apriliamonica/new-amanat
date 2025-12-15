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
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination for Activities
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Smaller for dashboard

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecent(),
        ]);
        setStats(statsRes.data.stats);
        setActivities(activitiesRes.data.activities);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
          color: "bg-blue-500",
          bgColor: "bg-blue-50",
        },
        {
          title: "Total Surat Keluar",
          value: stats.totalSuratKeluar || 0,
          icon: Send,
          color: "bg-green-500",
          bgColor: "bg-green-50",
        },
        {
          title: "Disposisi Saat Ini",
          value: stats.disposisiPending || 0,
          icon: Clock,
          color: "bg-purple-500",
          bgColor: "bg-purple-50",
        },
      ];
    }

    const cards = [
      {
        title: "Surat Masuk hari ini",
        value: stats.disposisiDiterima || 0,
        icon: FileText,
        color: "bg-blue-500",
        bgColor: "bg-blue-50",
      },
      {
        title: "Surat Keluar hari ini",
        value: stats.mySuratKeluar || 0,
        icon: CheckCircle,
        color: "bg-green-500",
        bgColor: "bg-green-50",
      },
      // {
      //   title: "Total Surat Terkait",
      //   value: stats.suratTerkait || 0,
      //   icon: Mail,
      //   color: "bg-purple-500",
      //   bgColor: "bg-purple-50",
      // },
    ];

    // if (isKetua(user?.role)) {
    //   cards.push({
    //     title: "Menunggu Tanda Tangan",
    //     value: stats.menungguTTD || 0,
    //     icon: PenTool,
    //     color: "bg-orange-500",
    //     bgColor: "bg-orange-50",
    //   });
    // }

    if (canValidate(user?.role)) {
      cards.push({
        title: "Menunggu Validasi",
        value: stats.menungguValidasi || 0,
        icon: AlertCircle,
        color: "bg-yellow-500",
        bgColor: "bg-yellow-50",
      });
    }

    return cards;
  };

  const statsCards = getStatsCards();

  // Paginate activities
  const indexOfLastActivity = currentPage * itemsPerPage;
  const indexOfFirstActivity = indexOfLastActivity - itemsPerPage;
  const currentActivities = activities.slice(
    indexOfFirstActivity,
    indexOfLastActivity
  );

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
      <Header title="Dashboard" />

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

        {/* Recent Activities & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <Card className="h-full border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
              <Card.Header className="border-b border-gray-100 pb-4 pt-6 px-6 bg-gradient-to-r from-white to-gray-50/50 rounded-t-xl">
                <h3 className="font-bold text-gray-800 flex items-center gap-3 text-lg">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Clock size={20} className="text-green-600" />
                  </div>
                  Aktivitas Terbaru
                </h3>
              </Card.Header>
              <Card.Body className="p-0">
                {activities.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock size={32} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">
                      Belum ada aktivitas
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-50">
                      {currentActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="p-5 border-b border-gray-50 last:border-0"
                        >
                          {/* Left border accent removed */}

                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100/50">
                              <FileText size={18} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-gray-900">
                                  {activity.aksi}
                                </p>
                                <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                  {formatRelativeTime(activity.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 truncate mt-1">
                                {activity.suratMasuk?.perihal ||
                                  activity.suratKeluar?.perihal ||
                                  "-"}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                  <Users size={10} />
                                  {activity.user?.nama || "Sistem"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/30 rounded-b-xl">
                      <Pagination
                        currentPage={currentPage}
                        totalItems={activities.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card className="h-full border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
              <Card.Header className="border-b border-gray-100 pb-4 pt-6 px-6 bg-gradient-to-r from-white to-gray-50/50 rounded-t-xl">
                <h3 className="font-bold text-gray-800 flex items-center gap-3 text-lg">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <TrendingUp size={20} className="text-yellow-600" />
                  </div>
                  Aksi Cepat
                </h3>
              </Card.Header>
              <Card.Body className="p-6">
                <div className="grid gap-4">
                  <a
                    href="/surat-masuk"
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-50/30 rounded-2xl border border-blue-100/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600 group-hover:text-blue-700 group-hover:scale-110 transition-transform">
                      <Mail size={24} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors block">
                        Surat Masuk
                      </span>
                      <span className="text-xs text-blue-600/70 font-medium">
                        Kelola surat masuk
                      </span>
                    </div>
                  </a>

                  <a
                    href="/surat-keluar"
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-50/30 rounded-2xl border border-green-100/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-600 group-hover:text-green-700 group-hover:scale-110 transition-transform">
                      <Send size={24} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 group-hover:text-green-700 transition-colors block">
                        Surat Keluar
                      </span>
                      <span className="text-xs text-green-600/70 font-medium">
                        Kelola surat keluar
                      </span>
                    </div>
                  </a>

                  {!isAdmin(user?.role) && (
                    <a
                      href="/disposisi"
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-50/30 rounded-2xl border border-purple-100/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-purple-600 group-hover:text-purple-700 group-hover:scale-110 transition-transform">
                        <FileText size={24} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors block">
                          Disposisi Saya
                        </span>
                        <span className="text-xs text-purple-600/70 font-medium">
                          Cek disposisi masuk
                        </span>
                      </div>
                    </a>
                  )}

                  {isAdmin(user?.role) && (
                    <a
                      href="/users"
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-orange-50/30 rounded-2xl border border-orange-100/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-orange-600 group-hover:text-orange-700 group-hover:scale-110 transition-transform">
                        <Users size={24} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-800 group-hover:text-orange-700 transition-colors block">
                          Kelola User
                        </span>
                        <span className="text-xs text-orange-600/70 font-medium">
                          Manajemen pengguna
                        </span>
                      </div>
                    </a>
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
