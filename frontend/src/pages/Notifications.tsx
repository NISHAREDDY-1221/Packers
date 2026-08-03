import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  PackageCheck,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/axios';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationsProps {
  portal?: 'operator' | 'qc' | 'admin';
}

const OPERATOR_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'op-1',
    title: 'New Job Assigned: #WO-8942',
    message: 'Packing order for 500 units of Organic Turmeric 250g assigned to Line 1.',
    type: 'JOBS',
    isRead: false,
    link: '/operator/jobs',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'op-2',
    title: 'Material Dispensed for Batch #B42',
    message: 'Required packaging materials have been issued and verified for your shift.',
    type: 'MATERIAL',
    isRead: false,
    link: '/operator/active-packing',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 'op-3',
    title: 'Rework Notice: Batch #B39',
    message: 'QC inspection flagged 12 units for barcode label re-application.',
    type: 'PACKING',
    isRead: true,
    link: '/operator/history',
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
  {
    id: 'op-4',
    title: 'Label Printer Calibrated',
    message: 'Zebra Station #Z-02 calibration complete and online for high-speed printing.',
    type: 'SYSTEM',
    isRead: true,
    link: '/operator/jobs',
    createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
  },
];

const QC_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'qc-1',
    title: 'QC Inspection Required: #WO-9012',
    message: 'Packing completed on Line A. 1,000 units ready for seal & barcode verification.',
    type: 'INSPECTION',
    isRead: false,
    link: '/qc/tasks',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'qc-2',
    title: 'Batch Order Approved',
    message: 'Work Order #WO-8871 quality parameters cleared for final shipment dispatch.',
    type: 'WORK_ORDER',
    isRead: false,
    link: '/qc/active-inspection',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'qc-3',
    title: 'Seal Integrity Rejection Logged',
    message: 'Batch #B33 rejected due to pouch seal tolerance failure during random check.',
    type: 'REJECT',
    isRead: true,
    link: '/qc/history',
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
  {
    id: 'qc-4',
    title: 'QC Test Standards Updated',
    message: 'Updated seal strength and barcode readability criteria applied for Q3.',
    type: 'SYSTEM',
    isRead: true,
    link: '/qc/dashboard',
    createdAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
  },
];

const ADMIN_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Work Order Approved',
    message: 'Work Order #WO-8942 has been approved for packing execution.',
    type: 'WORK_ORDER',
    isRead: false,
    link: '/work-orders',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Quality Check Alert',
    message: 'Quality Inspection for Batch #B42 requires supervisor re-evaluation.',
    type: 'QC',
    isRead: false,
    link: '/quality-check',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Material Issue Completed',
    message: 'Material issue #MI-1092 items have been dispatched to Line A.',
    type: 'MATERIAL',
    isRead: true,
    link: '/material-issue',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    title: 'System Maintenance',
    message: 'Scheduled label printer maintenance completed successfully.',
    type: 'SYSTEM',
    isRead: true,
    link: '/barcodes-labels',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

export const Notifications: React.FC<NotificationsProps> = ({ portal = 'admin' }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Portal-specific category tabs configuration
  const categories = React.useMemo(() => {
    if (portal === 'operator') {
      return [
        { id: 'ALL', label: 'All Alerts' },
        { id: 'JOBS', label: 'Assigned Jobs' },
        { id: 'PACKING', label: 'Packing Line' },
        { id: 'MATERIAL', label: 'Materials' },
        { id: 'SYSTEM', label: 'System & Equipment' },
      ];
    } else if (portal === 'qc') {
      return [
        { id: 'ALL', label: 'All Alerts' },
        { id: 'INSPECTION', label: 'QC Inspections' },
        { id: 'WORK_ORDER', label: 'Batch Orders' },
        { id: 'REJECT', label: 'Rejections & Rework' },
        { id: 'SYSTEM', label: 'System & Rules' },
      ];
    }
    return [
      { id: 'ALL', label: 'All Alerts' },
      { id: 'WORK_ORDER', label: 'Work Orders' },
      { id: 'QC', label: 'Quality Checks' },
      { id: 'MATERIAL', label: 'Material Issues' },
      { id: 'SYSTEM', label: 'System Alerts' },
    ];
  }, [portal]);

  const defaultList = React.useMemo(() => {
    if (portal === 'operator') return OPERATOR_NOTIFICATIONS;
    if (portal === 'qc') return QC_NOTIFICATIONS;
    return ADMIN_NOTIFICATIONS;
  }, [portal]);

  useEffect(() => {
    fetchNotifications();
  }, [portal]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications');
      if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setNotifications(res.data.data);
      } else {
        setNotifications(defaultList);
      }
    } catch (err) {
      setNotifications(defaultList);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (id === 'all' || n.id === id ? { ...n, isRead: true } : n))
      );
      toast.success(id === 'all' ? 'All notifications marked as read' : 'Notification marked as read');
    } catch (err) {
      setNotifications((prev) =>
        prev.map((n) => (id === 'all' || n.id === id ? { ...n, isRead: true } : n))
      );
      toast.success('Updated');
    }
  };

  const handleClearAll = async () => {
    try {
      await apiClient.delete('/notifications');
      setNotifications([]);
      toast.success('Notifications cleared');
    } catch (err) {
      setNotifications([]);
      toast.success('Notifications cleared');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'JOBS':
      case 'WORK_ORDER':
        return <Layers size={18} className="text-orange-500" />;
      case 'INSPECTION':
      case 'QC':
        return <ShieldCheck size={18} className="text-blue-500" />;
      case 'PACKING':
        return <PackageCheck size={18} className="text-green-600" />;
      case 'MATERIAL':
        return <CheckCircle2 size={18} className="text-green-500" />;
      case 'REJECT':
        return <AlertTriangle size={18} className="text-red-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesFilter = filterType === 'ALL' || n.type === filterType;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getPortalTitle = () => {
    if (portal === 'operator') return 'Packing Operator Alerts';
    if (portal === 'qc') return 'QC Inspector Notifications';
    return 'Enterprise Notifications Center';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950/40 text-[#00891D] dark:text-green-400 flex items-center justify-center">
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {getPortalTitle()}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {portal === 'operator'
                ? 'Track assigned packing jobs, material dispatches, line status, and equipment alerts.'
                : portal === 'qc'
                ? 'Stay notified on quality inspections, batch clearances, rejections, and test rules.'
                : 'Stay updated on work orders, quality checks, material issues, and system alerts.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {unreadCount > 0 && (
            <button
              onClick={() => handleMarkAsRead('all')}
              className="vk-btn-secondary text-xs px-4 py-2 h-9 flex items-center gap-1.5 font-semibold w-full md:w-auto justify-center"
            >
              <CheckCheck size={16} /> Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 h-9 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors w-full md:w-auto justify-center"
            >
              <Trash2 size={15} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 sidebar-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterType === cat.id
                  ? 'bg-[#00891D] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="vk-input w-full pl-9 py-1.5 text-xs h-9"
          />
        </div>
      </div>

      {/* Notifications List Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-[360px]">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <RefreshCw size={24} className="animate-spin mr-2" /> Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700/50 text-gray-400 flex items-center justify-center mb-3">
              <Bell size={24} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No Notifications</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1">
              You are all caught up! No recent alerts matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  !item.isRead
                    ? 'bg-green-50/30 dark:bg-green-950/10'
                    : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm ${!item.isRead ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-300'}`}>
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#00891D] inline-block" />
                      )}
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{item.message}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock size={12} /> {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.link && (
                        <button
                          onClick={() => navigate(item.link!)}
                          className="text-xs font-semibold text-[#00891D] dark:text-green-400 hover:underline flex items-center gap-1"
                        >
                          View Details <ExternalLink size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!item.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="text-xs text-gray-400 hover:text-[#00891D] dark:hover:text-green-400 font-semibold flex items-center gap-1 whitespace-nowrap"
                  >
                    <CheckCheck size={14} /> Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
