
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Upload, X, Check, Clock, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'scheduled'>('public');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const nextStep = () => {
    if (currentStep === 1 && title.trim() && description.trim()) {
      setCompletedSteps(prev => [...prev, 1]);
      setCurrentStep(2);
    } else if (currentStep === 2 && videoFile) {
      setCompletedSteps(prev => [...prev, 2]);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (visibility === 'scheduled' && !scheduledDate) {
        toast.error('Please select a scheduled date');
        return;
      }
      setCompletedSteps(prev => [...prev, 3]);
      setCurrentStep(4);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalUpload = async () => {
    if (!profile || !title.trim() || !videoFile) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsUploading(true);

    try {
      // Upload video file
      const videoFileName = `${Date.now()}-${videoFile.name}`;
      const { data: videoData, error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;

      // Get video URL
      const { data: videoUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoFileName);

      let thumbnailUrl = null;

      // Upload thumbnail if provided
      if (thumbnailFile) {
        const thumbnailFileName = `${Date.now()}-${thumbnailFile.name}`;
        const { data: thumbnailData, error: thumbnailError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbnailFileName, thumbnailFile);

        if (thumbnailError) {
          console.error('Thumbnail upload error:', thumbnailError);
        } else {
          const { data: thumbnailUrlData } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(thumbnailFileName);
          thumbnailUrl = thumbnailUrlData.publicUrl;
        }
      }

      // Create video record with scheduled date support
      const videoRecord = {
        title: title.trim(),
        description: description.trim() || null,
        video_url: videoUrlData.publicUrl,
        thumbnail: thumbnailUrl,
        creator_id: profile.id,
        views: 0,
        visibility: visibility,
        ...(visibility === 'scheduled' && { scheduled_date: scheduledDate })
      };

      // Check if user is admin - if yes, insert directly to videos table
      if (profile.is_admin) {
        const { data: newVideo, error: insertError } = await supabase
          .from('videos')
          .insert(videoRecord)
          .select()
          .single();

        if (insertError) throw insertError;

        // Store thumbnail in thumbnails table if provided
        if (thumbnailUrl && newVideo) {
          await supabase
            .from('thumbnails')
            .insert({
              video_id: newVideo.id,
              thumbnail_url: thumbnailUrl,
              is_active: true
            });
        }

        toast.success('Video uploaded and published successfully!');
      } else {
        // Regular users go to approval table
        const { data: pendingVideo, error: insertError } = await supabase
          .from('videos_for_approval')
          .insert(videoRecord)
          .select()
          .single();

        if (insertError) throw insertError;

        // Store thumbnail in thumbnails table if provided
        if (thumbnailUrl && pendingVideo) {
          await supabase
            .from('thumbnails')
            .insert({
              video_id: pendingVideo.id,
              thumbnail_url: thumbnailUrl,
              is_active: true
            });
        }

        toast.success('Video uploaded and sent for approval!');
      }

      // Reset form
      handleReset();
      onClose();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setVideoFile(null);
    setThumbnailFile(null);
    setVisibility('public');
    setScheduledDate('');
    setCurrentStep(1);
    setCompletedSteps([]);
  };

  const StepIndicator = ({ step, isCompleted, isCurrent }: { step: number, isCompleted: boolean, isCurrent: boolean }) => (
    <div className="flex items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
        isCompleted 
          ? 'bg-blue-600 border-blue-600 text-white' 
          : isCurrent 
            ? 'border-blue-600 text-blue-600 bg-gray-800' 
            : 'border-gray-600 text-gray-400 bg-gray-800'
      }`}>
        {isCompleted ? <Check size={20} /> : step}
      </div>
      {step < 4 && (
        <div className={`w-16 h-0.5 mx-2 transition-all duration-300 ${
          isCompleted ? 'bg-blue-600' : 'bg-gray-600'
        }`} />
      )}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video Title *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter video description"
                className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video File *
              </label>
              <div className="relative">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="video-upload"
                />
                <label
                  htmlFor="video-upload"
                  className="flex items-center justify-center w-full h-12 bg-gray-800 border-2 border-dashed border-gray-600 rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Upload size={20} />
                    <span>{videoFile ? videoFile.name : 'Choose Video File'}</span>
                  </div>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Thumbnail (Optional)
              </label>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label
                  htmlFor="thumbnail-upload"
                  className="flex items-center justify-center w-full h-12 bg-gray-800 border-2 border-dashed border-gray-600 rounded-md cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Upload size={20} />
                    <span>{thumbnailFile ? thumbnailFile.name : 'Choose Thumbnail'}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Visibility
              </label>
              <Select value={visibility} onValueChange={(value: 'public' | 'private' | 'scheduled') => setVisibility(value)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="public" className="text-white">Public</SelectItem>
                  <SelectItem value="private" className="text-white">Private</SelectItem>
                  <SelectItem value="scheduled" className="text-white">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {visibility === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="inline mr-2" size={16} />
                  Schedule Date & Time
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                <Clock size={32} className="text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {profile?.is_admin ? "You're an Admin!" : "Pending Approval"}
              </h3>
              <p className="text-gray-300">
                {profile?.is_admin 
                  ? "Your video will be published immediately since you're an admin."
                  : "Your video needs approval before it goes live."
                }
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Upload Video</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex justify-center items-center">
            {[1, 2, 3, 4].map((step) => (
              <StepIndicator
                key={step}
                step={step}
                isCompleted={completedSteps.includes(step)}
                isCurrent={currentStep === step}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[200px]">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              type="button"
              onClick={prevStep}
              variant="outline"
              className={`border-gray-600 text-gray-300 hover:bg-gray-800 ${
                currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={currentStep === 1}
            >
              <ChevronLeft size={18} className="mr-1" />
              Previous
            </Button>

            {currentStep === 4 ? (
              <Button
                onClick={handleFinalUpload}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  profile?.is_admin ? 'Publish Now' : 'Send for Approval'
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && (!title.trim() || !description.trim())) ||
                  (currentStep === 2 && !videoFile) ||
                  (currentStep === 3 && visibility === 'scheduled' && !scheduledDate)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
                <ChevronRight size={18} className="ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
