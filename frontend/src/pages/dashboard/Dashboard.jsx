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

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

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
          title: "Surat Masuk Baru",
          value: stats.suratMasukBaru || 0,
          icon: AlertCircle,
          color: "bg-yellow-500",
          bgColor: "bg-yellow-50",
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white shadow-xl shadow-green-900/10">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2 tracking-tight">
              Selamat Datang, {user?.nama}!
            </h2>
            <p className="text-green-50/90 text-lg font-medium">
              {ROLE_NAMES[user?.role]}
            </p>
          </div>
          {/* Decorative Circle */}
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-black/5 rounded-full blur-2xl"></div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <Card key={index} className="p-6 card-modern border-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <p className="text-4xl font-bold text-gray-800 tracking-tight">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-2xl ${stat.bgColor} shadow-inner bg-opacity-50`}
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
          {/* Recent Activities - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <Card className="h-full border-0 shadow-sm">
              <Card.Header className="border-b-0 pb-2 pt-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                  <Clock size={20} className="text-green-600" />
                  Aktivitas Terbaru
                </h3>
              </Card.Header>
              <Card.Body className="p-0">
                {activities.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 font-medium">
                    Belum ada aktivitas
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50/50">
                    {activities.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="p-5 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <FileText size={18} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-semibold text-gray-900">
                                {activity.aksi}
                              </p>
                              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {formatRelativeTime(activity.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate mt-0.5">
                              {activity.suratMasuk?.perihal ||
                                activity.suratKeluar?.perihal ||
                                "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card className="h-full border-0 shadow-sm">
              <Card.Header className="border-b-0 pb-2 pt-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                  <TrendingUp size={20} className="text-yellow-500" />
                  Aksi Cepat
                </h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-3">
                  <a
                    href="/surat-masuk"
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-2xl hover:shadow-md hover:translate-x-1 transition-all group"
                  >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600 group-hover:text-blue-700">
                      <Mail size={20} />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">
                      Surat Masuk
                    </span>
                  </a>

                  <a
                    href="/surat-keluar"
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-50/50 rounded-2xl hover:shadow-md hover:translate-x-1 transition-all group"
                  >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-600 group-hover:text-green-700">
                      <Send size={20} />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-gray-900">
                      Surat Keluar
                    </span>
                  </a>

                  {!isAdmin(user?.role) && (
                    <a
                      href="/disposisi"
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-50/50 rounded-2xl hover:shadow-md hover:translate-x-1 transition-all group"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-purple-600 group-hover:text-purple-700">
                        <FileText size={20} />
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-gray-900">
                        Disposisi Saya
                      </span>
                    </a>
                  )}

                  {isAdmin(user?.role) && (
                    <a
                      href="/users"
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-orange-50/50 rounded-2xl hover:shadow-md hover:translate-x-1 transition-all group"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-orange-600 group-hover:text-orange-700">
                        <Users size={20} />
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-gray-900">
                        Kelola User
                      </span>
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
