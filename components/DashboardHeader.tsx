import React, { useState, useRef, useEffect } from 'react';
import type { DashboardView } from './DashboardPage';
import { usePremium, useAuth } from '../App';

const NOTIFICATION_API =
  'https://lgxynb5z76.execute-api.ap-south-2.amazonaws.com/default/read_notification_from_sqs';

const MARK_ALL_READ_API =
  'https://pnhs6gk3u3.execute-api.ap-south-2.amazonaws.com/default/mark_all_notifications_read';

const ToggleButton = ({
  text,
  active,
  onClick,
}: {
  text: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
      active
        ? 'bg-orange-500 text-white shadow-sm'
        : 'text-gray-500 hover:bg-orange-50'
    }`}
  >
    {text}
  </button>
);

interface DashboardHeaderProps {
  dashboardMode: 'buyer' | 'seller';
  setDashboardMode: (mode: 'buyer' | 'seller') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeView: DashboardView;
  buyerProjectView: 'all' | 'activated' | 'disabled';
  setBuyerProjectView: (view: 'all' | 'activated' | 'disabled') => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const viewTitles: Record<DashboardView, string> = {
  dashboard: 'Dashboard',
  purchases: 'My Purchases',
  wishlist: 'My Wishlist',
  cart: 'Shopping Cart',
  analytics: 'Analytics',
  settings: 'Settings',
  'my-projects': 'My Projects',
  earnings: 'Earnings',
  payouts: 'Payouts',
  'project-details': 'Project Details',
  'seller-profile': 'Seller Profile',
  'help-center': 'Help Center',
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  dashboardMode,
  setDashboardMode,
  searchQuery,
  setSearchQuery,
  activeView,
  buyerProjectView,
  setBuyerProjectView,
  isSidebarOpen,
  toggleSidebar,
}) => {
  const title = viewTitles[activeView] || 'Dashboard';
  const isBuyerDashboard =
    activeView === 'dashboard' && dashboardMode === 'buyer';

  const { isPremium, credits } = usePremium();
  const { userId } = useAuth();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);

  // ---------------- FETCH NOTIFICATIONS ----------------
  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      setLoadingNotifications(true);

      const res = await fetch(NOTIFICATION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // ---------------- MARK ALL READ ----------------
  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      await fetch(MARK_ALL_READ_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  // ---------------- FETCH ON MOUNT ----------------
  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  // ---------------- CLICK OUTSIDE ----------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  // ---------------- ICON ----------------
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <span className="text-orange-500">💰</span>;
      case 'purchase':
        return <span className="text-green-500">✅</span>;
      case 'review':
        return <span className="text-yellow-500">⭐</span>;
      case 'message':
        return <span className="text-blue-500">💬</span>;
      default:
        return <span className="text-gray-500">🔔</span>;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-orange-50"
          >
            ☰
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {isPremium && (
            <div className="px-4 py-2 bg-orange-50 rounded-xl">
              <p className="text-xs">Credits</p>
              <p className="font-bold text-orange-600">{credits}</p>
            </div>
          )}

          {/* 🔔 NOTIFICATIONS */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                if (!isNotificationOpen) fetchNotifications();
              }}
              className="relative p-2 rounded-xl hover:bg-orange-50"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white border rounded-xl shadow-xl z-50">
                <div className="px-6 py-4 flex justify-between border-b">
                  <h3 className="font-bold">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-orange-600"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifications ? (
                    <p className="p-6 text-center text-sm text-gray-500">
                      Loading...
                    </p>
                  ) : notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.notificationId}
                        className={`px-6 py-4 border-b hover:bg-orange-50 ${
                          !n.isRead ? 'bg-orange-50/30' : ''
                        }`}
                      >
                        <div className="flex gap-3">
                          {getNotificationIcon(n.type)}
                          <div>
                            <p
                              className={`text-sm ${
                                !n.isRead ? 'font-semibold' : ''
                              }`}
                            >
                              {n.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(
                                n.createdAt * 1000
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-6 text-center text-sm text-gray-500">
                      No notifications
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* MODE SWITCH */}
          <div className="flex bg-orange-50 rounded-lg p-1">
            <button
              onClick={() => setDashboardMode('buyer')}
              className={`px-3 py-1 rounded ${
                dashboardMode === 'buyer'
                  ? 'bg-orange-500 text-white'
                  : ''
              }`}
            >
              Buyer
            </button>
            <button
              onClick={() => setDashboardMode('seller')}
              className={`px-3 py-1 rounded ${
                dashboardMode === 'seller'
                  ? 'bg-orange-500 text-white'
                  : ''
              }`}
            >
              Seller
            </button>
          </div>
        </div>
      </div>

      {isBuyerDashboard && (
        <div className="mt-6 flex justify-between">
          <div className="flex bg-orange-50 rounded-lg p-1">
            <ToggleButton
              text="All"
              active={buyerProjectView === 'all'}
              onClick={() => setBuyerProjectView('all')}
            />
            <ToggleButton
              text="Activated"
              active={buyerProjectView === 'activated'}
              onClick={() => setBuyerProjectView('activated')}
            />
            <ToggleButton
              text="Disabled"
              active={buyerProjectView === 'disabled'}
              onClick={() => setBuyerProjectView('disabled')}
            />
          </div>

          <input
            className="border px-4 py-2 rounded-lg"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardHeader;
