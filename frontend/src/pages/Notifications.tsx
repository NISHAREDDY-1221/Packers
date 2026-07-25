import React, { useState, useEffect } from "react";
import { Bell, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { notificationService } from "../api/notificationService";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6 text-left">
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
            <p className="text-slate-500 text-xs">Stay updated on your workflow events</p>
          </div>
        </div>
        <div className="text-sm font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
          {notifications.filter(n => !n.isRead).length} Unread
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            No notifications found.
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`bg-white rounded-xl border ${n.isRead ? 'border-slate-200' : 'border-blue-300 shadow-sm'} p-4 flex gap-4 transition-all hover:border-blue-400`}>
              <div className="mt-1 flex-shrink-0">
                {n.isRead ? <CheckCircle size={18} className="text-emerald-500" /> : <Clock size={18} className="text-blue-500" />}
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-bold ${n.isRead ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</h4>
                <p className="text-slate-500 text-xs mt-1">{n.message}</p>
                <div className="text-[10px] font-semibold text-slate-400 mt-2 uppercase">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
              {!n.isRead && (
                <button onClick={() => markAsRead(n.id)} className="self-center text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
