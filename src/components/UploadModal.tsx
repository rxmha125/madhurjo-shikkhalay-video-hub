
import React, { useState } from 'react';
import { X, Upload, Check, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { toast } from 'sonner';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: null as File | null,
    video: null as File | null,
    visibility: 'public' as 'public' | 'private' | 'scheduled'
  });
  const [uploading, setUploading] = useState(false);
  const { profile } = useAuth();
  const { addNotification } = useNotifications();

  const handleFileUpload = (file: File, type: 'video' | 'thumbnail') => {
    setFormData(prev => ({ ...prev, [type]: file }));
    if (type === 'video') {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.video) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);

    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (profile?.is_admin) {
        toast.success('Video uploaded successfully!');
        setStep(4);
      } else {
        // Send notification to admin for approval
        addNotification({
          type: 'upload_review',
          message: `New video "${formData.title}" needs approval`,
          read: false,
          data: {
            videoTitle: formData.title,
            uploaderName: profile?.name,
            thumbnail: formData.thumbnail ? URL.createObjectURL(formData.thumbnail) : null
          }
        });

        toast.success('Video uploaded for review!');
        setStep(4);
      }
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setFormData({
      title: '',
      description: '',
      thumbnail: null,
      video: null,
      visibility: 'public'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={resetModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step >= stepNum 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {step > stepNum ? <Check size={16} /> : stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`w-12 h-0.5 mx-2 transition-colors ${
                  step > stepNum ? 'bg-blue-600' : 'bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Upload File */}
        {step === 1 && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Upload Video</h2>
            
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-12 mb-6 hover:border-blue-500 transition-colors">
              <Upload size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 mb-4">
                Drop your video file here or click to browse
              </p>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'video');
                }}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload" className="btn-primary cursor-pointer">
                Choose Video File
              </label>
            </div>

            {formData.video && (
              <div className="rounded-lg bg-green-900/20 border border-green-500/30 p-4">
                <p className="text-green-400">
                  ✓ {formData.video.name} uploaded successfully
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Video Details */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Video Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Enter video title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field w-full h-32 resize-none"
                  placeholder="Describe your video content"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Thumbnail (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'thumbnail');
                  }}
                  className="input-field w-full"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="btn-primary"
                disabled={!formData.title}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Visibility Settings */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Visibility Settings</h2>
            
            <div className="space-y-4">
              {[
                { value: 'public', label: 'Public', desc: 'Anyone can view this video' },
                { value: 'private', label: 'Private', desc: 'Only you can view this video' },
                { value: 'scheduled', label: 'Scheduled', desc: 'Publish at a specific time' }
              ].map((option) => (
                <label
                  key={option.value}
                  className={`block p-4 rounded-xl border cursor-pointer transition-colors ${
                    formData.visibility === option.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={formData.visibility === option.value}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        visibility: e.target.value as 'public' | 'private' | 'scheduled' 
                      }))}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      formData.visibility === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400'
                    }`}>
                      {formData.visibility === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white">{option.label}</div>
                      <div className="text-sm text-gray-400">{option.desc}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="btn-primary"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div className="text-center">
            {profile?.is_admin ? (
              <div>
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">You are the admin</h2>
                <p className="text-gray-400 mb-6">
                  Your video has been uploaded and is now live on the platform.
                </p>
                <button
                  onClick={resetModal}
                  className="btn-primary"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Pending Approval</h2>
                <p className="text-gray-400 mb-6">
                  Needs approval from Harez Uddin Hero before it goes live.
                </p>
                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="btn-primary disabled:opacity-50"
                >
                  {uploading ? 'Sending...' : 'Send'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
