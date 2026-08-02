import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle, FileText, X, Image as ImageIcon, Info } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { issueService } from '../../../api/issueService';
import { qcTasksService } from '../services/qcTasksService';


import toast from 'react-hot-toast';

const issueTypes = [
  'MACHINE_ISSUE',
  'MATERIAL_SHORTAGE',
  'BARCODE_PROBLEM',
  'DAMAGED_PRODUCT',
  'PACKING_QUALITY_ISSUE',
  'APP_SYSTEM_ISSUE',
  'OTHER'
];

export const ReportIssue: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialWoId = location.state?.woId || '';
  const initialWoText = location.state?.woText || '';

  const [type, setType] = useState('MACHINE_ISSUE');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  
  // Job selection state
  const [woId, setWoId] = useState(initialWoId);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [isJobLocked, setIsJobLocked] = useState(!!initialWoId);

  // Attachment state (mocking file upload with local URLs)
  const [photos, setPhotos] = useState<string[]>([]);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResponse, setSuccessResponse] = useState<any>(null);

  useEffect(() => {
    // Fetch assigned jobs to populate dropdown
    qcTasksService.getWorkOrders()
      .then((res: any) => {
        setActiveJobs(res.data.filter((wo: any) => 
          !['COMPLETED', 'CANCELLED', 'QC_PASSED'].includes(wo.status)
        ));
      })
      .catch(console.error);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (photos.length >= 3) {
        toast.error('Maximum 3 images allowed.');
        return;
      }
      
      const newFiles = Array.from(e.target.files);
      const remainingSlots = 3 - photos.length;
      const filesToProcess = newFiles.slice(0, remainingSlots);
      
      // In a real app, upload to server. Here we just create local object URLs.
      const newPhotoUrls = filesToProcess.map(file => URL.createObjectURL(file));
      setPhotos(prev => [...prev, ...newPhotoUrls]);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const isFormValid = description.trim().length >= 10 && description.trim().length <= 500 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setIsSubmitting(true);
      const res = await issueService.reportIssue({
        type,
        description: description.trim(),
        priority,
        photoUrls: photos,
        woId: woId || null,
        reportedById: user?.id || ''
      });
      setSuccessResponse(res.data?.issue);
    } catch (error) {
      console.error('Failed to report issue', error);
      toast.error('Failed to submit issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successResponse) {
    return (
      <div className="max-w-md mx-auto md:max-w-2xl px-4 sm:px-6 py-12 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-6 rounded-full mb-6 shadow-sm border border-green-200 dark:border-green-800">
          <CheckCircle size={64} className="mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Issue Submitted Successfully</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-2 max-w-sm">
          Your supervisor has been notified and will review it shortly.
        </p>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-8 w-full shadow-sm flex items-center justify-center">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Issue ID:</span>
          <span className="font-mono font-bold text-gray-800 dark:text-gray-100">{successResponse.id.substring(0, 8).toUpperCase()}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {successResponse.woId && (
            <button
              onClick={() => navigate('/qc/active-inspection')}
              className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold py-3.5 px-6 rounded-xl transition-colors w-full sm:w-auto shadow-sm active:scale-95"
            >
              View Active Packing
            </button>
          )}
          <button
            onClick={() => navigate('/qc/dashboard')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-8 rounded-xl transition-colors w-full sm:w-auto shadow-sm active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto md:max-w-4xl pb-24 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6 pt-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Report Issue</h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Left Column */}
          <div className="space-y-6">
            {/* Issue Type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Issue Type <span className="text-red-500">*</span></label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none font-semibold appearance-none"
                required
              >
                {issueTypes.map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Related Job */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Related Job</label>
              {isJobLocked && initialWoId ? (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3">
                  <div className="flex items-center text-blue-800 dark:text-blue-300">
                    <FileText size={20} className="mr-3 opacity-70" />
                    <div className="flex flex-col">
                      <span className="font-bold text-sm leading-tight">{initialWoText.split(' - ')[0]}</span>
                      <span className="text-xs opacity-80">{initialWoText.split(' - ')[1]}</span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setIsJobLocked(false)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-sm active:scale-95"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <select
                  value={woId}
                  onChange={(e) => setWoId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none font-semibold appearance-none"
                >
                  <option value="">General Issue (No Specific Job)</option>
                  {activeJobs.map((wo: any) => (
                    <option key={wo.id} value={wo.id}>{wo.woNumber} - {wo.product?.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Priority</label>
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                      priority === p 
                        ? p === 'HIGH' ? 'bg-red-500 text-white shadow-sm' : p === 'MEDIUM' ? 'bg-orange-500 text-white shadow-sm' : 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Description */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Description <span className="text-red-500">*</span></label>
                <span className={`text-xs font-medium ${description.length < 10 || description.length > 500 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  {description.length}/500
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.substring(0, 500))}
                placeholder="Describe the issue clearly..."
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none font-medium resize-none min-h-[140px]"
                required
              ></textarea>
              {description.length > 0 && description.length < 10 && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center">
                  <Info size={12} className="mr-1" /> Minimum 10 characters required.
                </p>
              )}
            </div>

            {/* Attachment */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Attachments (Optional)</label>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{photos.length}/3</span>
              </div>
              
              {photos.length > 0 && (
                <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
                  {photos.map((src, index) => (
                    <div key={index} className="relative flex-none w-24 h-24 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-900 group">
                      <img src={src} alt="Attachment preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full opacity-90 hover:opacity-100 active:scale-95"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 3 && (
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-5 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-[0.99]"
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-200 dark:bg-gray-700 p-2.5 rounded-full mb-2">
                        <Camera size={20} className="text-gray-600 dark:text-gray-300" />
                      </div>
                      <span className="text-xs font-semibold">Take Photo</span>
                    </div>
                    <div className="w-px bg-gray-200 dark:bg-gray-700 h-16"></div>
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-200 dark:bg-gray-700 p-2.5 rounded-full mb-2">
                        <ImageIcon size={20} className="text-gray-600 dark:text-gray-300" />
                      </div>
                      <span className="text-xs font-semibold">Upload Image</span>
                    </div>
                  </div>
                </button>
              )}
              <input 
                type="file" 
                accept="image/*"
                multiple
                className="hidden" 
                ref={fileInputRef}
                onChange={handlePhotoUpload}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Submit Sticky Bottom (Desktop integrated) */}
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-20 md:relative md:bg-transparent md:border-0 md:p-0 md:mt-4 md:flex md:justify-end">
        <div className="max-w-md mx-auto md:mx-0 w-full md:w-auto">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="w-full md:w-64 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </span>
            ) : (
              'Submit Issue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
