import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { packingJobsService } from '../services/packingJobsService';
import type { PackingJob } from '../../../shared/types';
import { Search, Filter, History, Clock, CheckCircle, AlertTriangle, ArrowRight, X } from 'lucide-react';

export const PackingHistory: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<PackingJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterDate, setFilterDate] = useState('All');
  const [filterSla, setFilterSla] = useState('All');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await packingJobsService.getWorkOrders();
        // Keep only jobs that have completedAt (meaning packing is complete)
        const completedJobs = response.data.filter((wo: any) => wo.completedAt != null);
        
        // Sort latest completed first
        completedJobs.sort((a: any, b: any) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
        setJobs(completedJobs);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Filter Logic
  const filteredJobs = jobs.filter(job => {
    // Search
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      job.woNumber.toLowerCase().includes(searchLower) ||
      (job.product?.name || '').toLowerCase().includes(searchLower) ||
      (job.batchNumber || '').toLowerCase().includes(searchLower);
    
    if (!matchesSearch) return false;

    // SLA Filter
    const expected = job.expectedDate ? job.expectedDate.substring(0, 10) : '';
    const completed = job.completedAt ? job.completedAt.substring(0, 10) : '';
    const isOnTime = !expected || completed <= expected;
    if (filterSla === 'On Time' && !isOnTime) return false;
    if (filterSla === 'Delayed' && isOnTime) return false;

    // Date Filter
    if (filterDate !== 'All') {
      const now = new Date();
      const jobDate = new Date(job.completedAt!);
      if (filterDate === 'Today') {
        if (jobDate.toDateString() !== now.toDateString()) return false;
      } else if (filterDate === 'This Week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (jobDate < weekAgo) return false;
      } else if (filterDate === 'This Month') {
        if (jobDate.getMonth() !== now.getMonth() || jobDate.getFullYear() !== now.getFullYear()) return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto md:max-w-6xl pb-20 px-4 sm:px-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Packing History</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your completed packing jobs.</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search WO, Product, Batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-green-500 focus:outline-none text-sm shadow-sm"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-xl border flex items-center justify-center transition-colors ${showFilters || filterDate !== 'All' || filterSla !== 'All' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 shadow-sm'}`}
        >
          <Filter size={20} />
        </button>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-300"><X size={18} /></button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">Date Range</label>
            <div className="flex flex-wrap gap-2">
              {['All', 'Today', 'This Week', 'This Month'].map(opt => (
                <button 
                  key={opt}
                  onClick={() => setFilterDate(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filterDate === opt ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">SLA Result</label>
            <div className="flex flex-wrap gap-2">
              {['All', 'On Time', 'Delayed'].map(opt => (
                <button 
                  key={opt}
                  onClick={() => setFilterSla(opt)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filterSla === opt ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Job List */}
      {filteredJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <History className="text-gray-300 mb-4" size={48} />
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">No completed packing jobs yet.</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Completed jobs will appear here after you finish packing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => {
            const expectedDate = job.expectedDate ? job.expectedDate.substring(0, 10) : '';
            const completedDateStr = job.completedAt ? job.completedAt.substring(0, 10) : '';
            const isDelayed = expectedDate && completedDateStr > expectedDate;
            const started = job.startedAt ? new Date(job.startedAt).getTime() : new Date(job.completedAt!).getTime();
            const completed = new Date(job.completedAt!).getTime();
            const isOnTime = !isDelayed;
            const durationMins = Math.round((completed - started) / 60000);
            const durationText = durationMins > 60 ? `${Math.floor(durationMins/60)}h ${durationMins%60}m` : `${durationMins}m`;

            return (
              <div key={job.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{job.woNumber}</h3>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{job.product?.name || 'Product'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">Batch: {job.batchNumber || 'N/A'}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center border ${isOnTime ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    {isOnTime ? <CheckCircle size={12} className="mr-1" /> : <AlertTriangle size={12} className="mr-1" />}
                    {isOnTime ? 'On Time' : 'Delayed'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 dark:bg-gray-900 p-3 rounded-xl border border-slate-100 dark:border-gray-700">
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Packed</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{job.actualProduced || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Rejected</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{job.actualRejected || 0}</p>
                  </div>
                  <div className="col-span-2 border-t border-slate-200 dark:border-gray-700 mt-1 pt-2 flex justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase flex items-center"><Clock size={10} className="mr-1"/> Completed On</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{new Date(job.completedAt!).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Duration</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{durationText}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => navigate(`/operator/history/${job.id}`)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center text-sm"
                >
                  View Details
                  <ArrowRight size={16} className="ml-2 text-gray-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
