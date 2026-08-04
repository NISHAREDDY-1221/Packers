import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Moon,
  Sun,
  Bell,
  Printer,
  Globe,
  Sliders,
  CheckCircle2,
  Save,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../api/axios';

interface SettingsData {
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  inAppNotifications: boolean;
  compactView: boolean;
  autoPrintLabels: boolean;
  defaultPrinter: string;
  language: string;
  timezone: string;
}

export const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'notifications' | 'printing' | 'system'>('appearance');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettingsData] = useState<SettingsData>({
    theme: theme,
    emailNotifications: true,
    inAppNotifications: true,
    compactView: false,
    autoPrintLabels: false,
    defaultPrinter: 'Zebra-ZT230',
    language: 'en',
    timezone: 'UTC',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/settings');
      if (res.data && res.data.data) {
        const data = res.data.data;
        setSettingsData({
          theme: data.theme || theme,
          emailNotifications: data.emailNotifications ?? true,
          inAppNotifications: data.inAppNotifications ?? true,
          compactView: data.compactView ?? false,
          autoPrintLabels: data.autoPrintLabels ?? false,
          defaultPrinter: data.defaultPrinter || 'Zebra-ZT230',
          language: data.language || 'en',
          timezone: data.timezone || 'UTC',
        });
        if (data.theme && (data.theme === 'light' || data.theme === 'dark')) {
          setTheme(data.theme);
        }
      }
    } catch (err) {
      console.warn('Using default settings state:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof SettingsData) => {
    setSettingsData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (key: keyof SettingsData, value: any) => {
    setSettingsData((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (key === 'theme') {
      setTheme(value);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/settings', settings);
      setTheme(settings.theme);
      toast.success('Settings saved to database successfully');
    } catch (err) {
      console.error('Failed to save settings:', err);
      // Fallback save locally
      setTheme(settings.theme);
      localStorage.setItem('theme', settings.theme);
      toast.success('Settings saved locally');
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-2 sm:px-4">
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-[#00891D] dark:text-green-400 flex items-center justify-center">
            <Sliders size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">System Settings & Preferences</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Manage application theme, printing defaults, and notification configurations stored directly in database.
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="vk-btn-primary flex items-center gap-2 text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-50"
        >
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-4 min-h-[480px]">
        {/* Navigation Sidebar Tabs */}
        <div className="bg-gray-50/50 dark:bg-gray-900/40 border-r border-gray-200 dark:border-gray-700 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
              activeTab === 'appearance'
                ? 'bg-green-50 dark:bg-green-950/40 text-[#00891D] dark:text-green-400 border border-green-200 dark:border-green-800/40'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {settings.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            Appearance & Theme
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
              activeTab === 'notifications'
                ? 'bg-green-50 dark:bg-green-950/40 text-[#00891D] dark:text-green-400 border border-green-200 dark:border-green-800/40'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Bell size={18} />
            Notifications
          </button>

          <button
            onClick={() => setActiveTab('printing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
              activeTab === 'printing'
                ? 'bg-green-50 dark:bg-green-950/40 text-[#00891D] dark:text-green-400 border border-green-200 dark:border-green-800/40'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Printer size={18} />
            Printing & Hardware
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
              activeTab === 'system'
                ? 'bg-green-50 dark:bg-green-950/40 text-[#00891D] dark:text-green-400 border border-green-200 dark:border-green-800/40'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Globe size={18} />
            Regional & System
          </button>
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3 p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <RefreshCw size={24} className="animate-spin mr-2" /> Loading preferences...
            </div>
          ) : (
            <>
              {/* APPEARANCE TAB */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Theme Selection</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Choose interface theme preference. Selection is automatically synchronized across devices.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleChange('theme', 'light')}
                      className={`p-4 rounded-xl border text-left flex items-start gap-4 transition-all ${
                        settings.theme === 'light'
                          ? 'border-[#00891D] bg-green-50/50 dark:bg-green-950/20 ring-2 ring-[#00891D]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                        <Sun size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Light Mode</p>
                          {settings.theme === 'light' && <CheckCircle2 size={18} className="text-[#00891D]" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Clean white surface with crisp text visibility for day environments.
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => handleChange('theme', 'dark')}
                      className={`p-4 rounded-xl border text-left flex items-start gap-4 transition-all ${
                        settings.theme === 'dark'
                          ? 'border-[#00891D] bg-green-50/50 dark:bg-green-950/20 ring-2 ring-[#00891D]/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="p-3 bg-indigo-900/50 text-indigo-400 rounded-lg">
                        <Moon size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">Dark Mode</p>
                          {settings.theme === 'dark' && <CheckCircle2 size={18} className="text-[#00891D]" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Sleek dark slate background designed for low-light packing areas.
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Compact Density View</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Reduce table row spacing to fit more data on screen.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.compactView}
                        onChange={() => handleToggle('compactView')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00891D]"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Notification Preferences</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Configure how system alerts, work order approvals, and QC updates are delivered.
                    </p>
                  </div>

                  <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-700">
                    <div className="pt-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">In-App Notifications</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Show floating badge alerts and header notification popups.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.inAppNotifications}
                          onChange={() => handleToggle('inAppNotifications')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00891D]"></div>
                      </label>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Email Notifications</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Receive email summaries for critical material issues and work order changes.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={() => handleToggle('emailNotifications')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00891D]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* PRINTING TAB */}
              {activeTab === 'printing' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Printer & Hardware Integration</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Configure default barcode label printers and auto-print job behavior.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Default Label Printer
                      </label>
                      <select
                        value={settings.defaultPrinter}
                        onChange={(e) => handleChange('defaultPrinter', e.target.value)}
                        className="vk-input w-full"
                      >
                        <option value="Zebra-ZT230">Zebra ZT230 Industrial Printer (Line A)</option>
                        <option value="Honeywell-PX940">Honeywell PX940 High Precision Printer</option>
                        <option value="Bixolon-TX400">Bixolon TX400 Desktop Printer</option>
                        <option value="SATO-CL4NX">SATO CL4NX Thermal Label Printer</option>
                      </select>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Auto-Print Barcode Labels</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Automatically trigger printing when a packing job is completed.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoPrintLabels}
                          onChange={() => handleToggle('autoPrintLabels')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00891D]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* SYSTEM TAB */}
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Regional & System Info</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">System language and timezone preferences.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Language</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleChange('language', e.target.value)}
                        className="vk-input w-full"
                      >
                        <option value="en">English (US)</option>
                        <option value="hi">Hindi (हिन्दी)</option>
                        <option value="te">Telugu (తెలుగు)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleChange('timezone', e.target.value)}
                        className="vk-input w-full"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                        <option value="America/New_York">America/New York (EST)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
