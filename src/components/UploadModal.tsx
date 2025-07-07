
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || !title.trim() || !videoFile) {
      toast.error('Please fill in all required fields and select a video file');
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

      // Create video record
      const videoRecord = {
        title: title.trim(),
        description: description.trim() || null,
        video_url: videoUrlData.publicUrl,
        thumbnail: thumbnailUrl,
        creator_id: profile.id,
        views: 0,
        visibility: 'public'
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
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setThumbnailFile(null);
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Upload Video</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleVideoUpload} className="space-y-4">
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
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter video description"
              className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Video File *
            </label>
            <Input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Thumbnail (Optional)
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              disabled={isUploading || !title.trim() || !videoFile}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Upload size={18} />
                  <span>Upload Video</span>
                </div>
              )}
            </Button>
            
            <Button
              type="button"
              onClick={handleReset}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <X size={18} />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
