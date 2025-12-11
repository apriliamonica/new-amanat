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
          title: "Disposisi Pending",
          value: stats.disposisiPending || 0,
          icon: Clock,
          color: "bg-purple-500",
          bgColor: "bg-purple-50",
        },
      ];
    }

    const cards = [
      {
        title: "Disposisi Diterima",
        value: stats.disposisiDiterima || 0,
        icon: FileText,
        color: "bg-blue-500",
        bgColor: "bg-blue-50",
      },
      {
        title: "Disposisi Selesai",
        value: stats.disposisiSelesai || 0,
        icon: CheckCircle,
        color: "bg-green-500",
        bgColor: "bg-green-50",
      },
      {
        title: "Total Surat Terkait",
        value: stats.suratTerkait || 0,
        icon: Mail,
        color: "bg-purple-500",
        bgColor: "bg-purple-50",
      },
    ];

    if (isKetua(user?.role)) {
      cards.push({
        title: "Menunggu Tanda Tangan",
        value: stats.menungguTTD || 0,
        icon: PenTool,
        color: "bg-orange-500",
        bgColor: "bg-orange-50",
      });
    }

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
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Welcome Message */}
        <div className="gradient-primary rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Selamat Datang, {user?.nama}!
          </h2>
          <p className="text-blue-100">
            {ROLE_NAMES[user?.role]} - Aplikasi Manajemen Surat
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <Card key={index} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon
                    className={`text-${stat.color.replace("bg-", "")}`}
                    size={24}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Card.Header>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Clock size={20} />
                Aktivitas Terbaru
              </h3>
            </Card.Header>
            <Card.Body className="p-0">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Belum ada aktivitas
                </div>
              ) : (
                <div className="divide-y">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <FileText size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {activity.aksi}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {activity.suratMasuk?.perihal ||
                              activity.suratKeluar?.perihal ||
                              "-"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Quick Actions */}
          <Card>
            <Card.Header>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp size={20} />
                Aksi Cepat
              </h3>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/surat-masuk"
                  className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center"
                >
                  <Mail className="mx-auto mb-2 text-blue-600" size={24} />
                  <span className="text-sm font-medium text-gray-700">
                    Surat Masuk
                  </span>
                </a>
                <a
                  href="/surat-keluar"
                  className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-center"
                >
                  <Send className="mx-auto mb-2 text-green-600" size={24} />
                  <span className="text-sm font-medium text-gray-700">
                    Surat Keluar
                  </span>
                </a>
                {!isAdmin(user?.role) && (
                  <a
                    href="/disposisi"
                    className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-center"
                  >
                    <FileText
                      className="mx-auto mb-2 text-purple-600"
                      size={24}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Disposisi Saya
                    </span>
                  </a>
                )}
                {isAdmin(user?.role) && (
                  <a
                    href="/users"
                    className="p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-center"
                  >
                    <Users className="mx-auto mb-2 text-orange-600" size={24} />
                    <span className="text-sm font-medium text-gray-700">
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
  );
};

export default Dashboard;
