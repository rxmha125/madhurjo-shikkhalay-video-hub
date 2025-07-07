
import React, { useState } from 'react';
import { X, Upload, Check, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
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
  const [submitted, setSubmitted] = useState(false);
  const { profile } = useAuth();
  const { addNotification } = useNotifications();

  const handleFileUpload = (file: File, type: 'video' | 'thumbnail') => {
    setFormData(prev => ({ ...prev, [type]: file }));
    if (type === 'video') {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.video || !profile) {
      toast.error('Please fill in all required fields');
      return;
    }

    setUploading(true);

    try {
      // Insert video into database
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          title: formData.title,
          description: formData.description,
          creator_id: profile.id,
          thumbnail: formData.thumbnail ? '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png' : null,
          visibility: formData.visibility,
          is_approved: profile.is_admin
        })
        .select()
        .single();

      if (videoError) {
        console.error('Error creating video:', videoError);
        toast.error('Failed to upload video');
        return;
      }

      console.log('Video created:', videoData);

      if (profile.is_admin) {
        toast.success('Video uploaded successfully!');
        setSubmitted(true);
        setStep(4);
      } else {
        // Find admin user
        const { data: adminProfile, error: adminError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', 'mamadhurjo.shikkhalay@gmail.com')
          .eq('is_admin', true)
          .single();

        if (!adminError && adminProfile) {
          // Create notification for admin
          await addNotification({
            user_id: adminProfile.id,
            type: 'upload_review',
            title: 'New Video Review Request',
            content: `New video "${formData.title}" needs approval from ${profile.name}`,
            video_id: videoData.id
          });

          console.log('Admin notification sent successfully');
        } else {
          console.error('Admin not found:', adminError);
        }

        toast.success('Video uploaded for review!');
        setSubmitted(true);
        setStep(4);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setSubmitted(false);
    setUploading(false);
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
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
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
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
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
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-32 resize-none"
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
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                <h2 className="text-2xl font-bold text-white mb-4">Video Published!</h2>
                <p className="text-gray-400 mb-6">
                  Your video has been uploaded and is now live on the platform.
                </p>
                <button
                  onClick={resetModal}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {submitted ? 'Submitted for Review!' : 'Ready to Submit'}
                </h2>
                <p className="text-gray-400 mb-6">
                  {submitted 
                    ? 'Your video has been submitted and the admin has been notified.' 
                    : 'Your video needs approval from admin before it goes live.'}
                </p>
                {submitted ? (
                  <button
                    onClick={resetModal}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Done
                  </button>
                ) : (
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setStep(3)}
                      className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={uploading}
                      className={`px-6 py-2 rounded-lg transition-colors ${
                        uploading 
                          ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {uploading ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
