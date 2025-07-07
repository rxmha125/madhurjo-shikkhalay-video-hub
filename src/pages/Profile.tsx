import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Upload as UploadIcon, Clock, Trash2, Users, Edit, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFollowSystem } from '../hooks/useFollowSystem';
import VideoCard from '../components/VideoCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatTimeAgo } from '../utils/timeUtils';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  created_at: string;
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
}

const Profile = () => {
  const { id } = useParams();
  const { profile, updateProfile } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [pendingVideos, setPendingVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingVideos, setRemovingVideos] = useState<string[]>([]);
  const [deletingVideos, setDeletingVideos] = useState<string[]>([]);
  const [editingVideo, setEditingVideo] = useState<string | null>(null);
  const [updatingVideo, setUpdatingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  });
  const [videoEditForm, setVideoEditForm] = useState({
    title: '',
    description: '',
    thumbnail: ''
  });

  const isOwnProfile = profile?.id === id;
  const { isFollowing, followerCount, isLoading: followLoading, toggleFollow } = useFollowSystem(id);

  useEffect(() => {
    loadProfile();
    loadUserVideos();
    if (isOwnProfile) {
      loadPendingVideos();
    }
  }, [id]);

  const loadProfile = async () => {
    if (isOwnProfile && profile) {
      setProfileUser(profile);
      setEditForm({
        name: profile.name,
        description: profile.description || ''
      });
    } else if (id) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProfileUser(data);
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfileUser({
          id: id,
          name: 'Student User',
          avatar: '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png',
          description: 'Eager to learn and grow through quality education.'
        });
      }
    }
    setLoading(false);
  };

  const loadUserVideos = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*, creator:profiles!videos_creator_id_fkey(id, name, avatar)')
        .eq('creator_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading videos:', error);
        return;
      }

      const formattedVideos = data?.map(video => ({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png',
        views: video.views || 0,
        created_at: video.created_at,
        creator: {
          id: video.creator?.id || '',
          name: video.creator?.name || 'Unknown',
          avatar: video.creator?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'
        }
      })) || [];

      setVideos(formattedVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const loadPendingVideos = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('videos_for_approval')
        .select('*, creator:profiles!videos_for_approval_creator_id_fkey(id, name, avatar)')
        .eq('creator_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading pending videos:', error);
        return;
      }

      const formattedVideos = data?.map(video => ({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png',
        views: video.views || 0,
        created_at: video.created_at,
        creator: {
          id: video.creator?.id || '',
          name: video.creator?.name || 'Unknown',
          avatar: video.creator?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'
        }
      })) || [];

      setPendingVideos(formattedVideos);
    } catch (error) {
      console.error('Error loading pending videos:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwnProfile || !profile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      console.log('Starting image upload for user:', profile.id);
      
      // Step 1: Deactivate old profile image if exists
      const { data: oldImages, error: oldImagesError } = await supabase
        .from('profile_images')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true);

      if (oldImagesError) {
        console.error('Error fetching old images:', oldImagesError);
      }

      // Step 2: Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/${Date.now()}.${fileExt}`;

      console.log('Uploading file:', fileName);

      // Step 3: Upload new image to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload image');
        return;
      }

      console.log('Upload successful:', uploadData);

      // Step 4: Get public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;
      console.log('Image URL:', imageUrl);

      // Step 5: Deactivate old images
      if (oldImages && oldImages.length > 0) {
        console.log('Deactivating old images:', oldImages.length);
        
        // Mark old images as inactive
        const { error: deactivateError } = await supabase
          .from('profile_images')
          .update({ is_active: false })
          .eq('user_id', profile.id)
          .eq('is_active', true);

        if (deactivateError) {
          console.error('Error deactivating old images:', deactivateError);
        }

        // Delete old image files from storage
        for (const oldImage of oldImages) {
          try {
            const oldFileName = oldImage.image_url.split('/').pop();
            if (oldFileName) {
              const { error: deleteError } = await supabase.storage
                .from('profile-images')
                .remove([`${profile.user_id}/${oldFileName}`]);
              
              if (deleteError) {
                console.error('Error deleting old file:', deleteError);
              }
            }
          } catch (error) {
            console.error('Error processing old image deletion:', error);
          }
        }
      }

      // Step 6: Insert new image record
      const { error: insertError } = await supabase
        .from('profile_images')
        .insert({
          user_id: profile.id,
          image_url: imageUrl,
          is_active: true
        });

      if (insertError) {
        console.error('Error inserting image record:', insertError);
        toast.error('Failed to save image record');
        return;
      }

      // Step 7: Update profile with new avatar URL
      await updateProfile({ avatar: imageUrl });
      
      // Step 8: Update local state
      setProfileUser((prev: any) => ({ ...prev, avatar: imageUrl }));
      
      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingVideo) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingThumbnail(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${editingVideo}/${Date.now()}.${fileExt}`;

      // Upload thumbnail to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload thumbnail');
        return;
      }

      // Get public URL for the uploaded thumbnail
      const { data: urlData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName);

      const thumbnailUrl = urlData.publicUrl;
      
      // Update form state with new thumbnail URL
      setVideoEditForm(prev => ({ ...prev, thumbnail: thumbnailUrl }));
      
      toast.success('Thumbnail uploaded successfully!');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSaveProfile = async () => {
    if (isOwnProfile) {
      try {
        await updateProfile(editForm);
        setProfileUser((prev: any) => ({ ...prev, ...editForm }));
        setEditing(false);
        toast.success('Profile updated successfully!');
      } catch (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
      }
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this video? This action cannot be undone.');
    if (!confirmed) return;

    setDeletingVideos(prev => [...prev, videoId]);

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) {
        console.error('Error deleting video:', error);
        toast.error('Failed to delete video');
        return;
      }

      setVideos(prev => prev.filter(video => video.id !== videoId));
      toast.success('Video deleted successfully');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    } finally {
      setDeletingVideos(prev => prev.filter(id => id !== videoId));
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    setRemovingVideos(prev => [...prev, videoId]);

    try {
      const { error } = await supabase
        .from('videos_for_approval')
        .delete()
        .eq('id', videoId);

      if (error) {
        console.error('Error removing video:', error);
        toast.error('Failed to remove video');
        return;
      }

      setPendingVideos(prev => prev.filter(video => video.id !== videoId));
      toast.success('Video removed successfully');
    } catch (error) {
      console.error('Error removing video:', error);
      toast.error('Failed to remove video');
    } finally {
      setRemovingVideos(prev => prev.filter(id => id !== videoId));
    }
  };

  const handleEditVideo = (video: Video) => {
    setVideoEditForm({
      title: video.title,
      description: '', // We'll need to fetch full video data for description
      thumbnail: video.thumbnail
    });
    setEditingVideo(video.id);
    
    // Fetch full video data including description
    fetchVideoForEdit(video.id);
  };

  const fetchVideoForEdit = async (videoId: string) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (error) throw error;
      
      setVideoEditForm({
        title: data.title,
        description: data.description || '',
        thumbnail: data.thumbnail || ''
      });
    } catch (error) {
      console.error('Error fetching video for edit:', error);
    }
  };

  const handleUpdateVideo = async () => {
    if (!editingVideo) return;

    setUpdatingVideo(true);

    try {
      const { error } = await supabase
        .from('videos')
        .update({
          title: videoEditForm.title,
          description: videoEditForm.description,
          thumbnail: videoEditForm.thumbnail
        })
        .eq('id', editingVideo);

      if (error) throw error;

      // Update local state
      setVideos(prev => prev.map(video => 
        video.id === editingVideo 
          ? { ...video, title: videoEditForm.title, thumbnail: videoEditForm.thumbnail }
          : video
      ));

      setEditingVideo(null);
      toast.success('Video updated successfully!');
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error('Failed to update video');
    } finally {
      setUpdatingVideo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative group">
              <img
                src={profileUser?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
                alt={profileUser?.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-600"
                onError={(e) => {
                  e.currentTarget.src = '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png';
                }}
              />
              
              {isOwnProfile && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="text-center">
                    {uploadingAvatar ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                    ) : (
                      <>
                        <UploadIcon size={16} className="text-white mx-auto mb-1 md:w-5 md:h-5" />
                        <p className="text-xs text-white hidden md:block">Upload Image</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploadingAvatar}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                {editing ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-700 text-white px-3 py-1 rounded text-3xl font-bold border border-gray-600 focus:border-blue-500 focus:outline-none"
                      placeholder="Name"
                    />
                    <button
                      onClick={handleSaveProfile}
                      className="text-green-400 hover:text-green-300 transition-colors"
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-white">{profileUser?.name}</h1>
                    {isOwnProfile && (
                      <button
                        onClick={() => setEditing(true)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Pencil size={20} />
                      </button>
                    )}
                  </>
                )}
                {!isOwnProfile && profile && (
                  <button
                    onClick={toggleFollow}
                    disabled={followLoading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                      isFollowing
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } disabled:opacity-50`}
                  >
                    <Users size={18} />
                    <span>{isFollowing ? 'Unfollow' : 'Follow'}</span>
                  </button>
                )}
              </div>
              
              {editing ? (
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-700 text-gray-300 px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Description"
                  rows={3}
                />
              ) : (
                <p className="text-gray-400 leading-relaxed max-w-2xl mb-6">
                  {profileUser?.description || 'No description provided.'}
                </p>
              )}

              <div className="flex justify-center md:justify-start space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{videos.length}</div>
                  <div className="text-sm text-gray-500">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {videos.reduce((sum, video) => sum + video.views, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{followerCount}</div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="border-b border-gray-700">
            <div className="p-6">
              <div className="flex space-x-8 overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('videos')}
                  className={`text-white font-medium pb-2 whitespace-nowrap ${
                    activeTab === 'videos' ? 'border-b-2 border-blue-500' : 'hover:text-blue-400'
                  }`}
                >
                  Videos ({videos.length})
                </button>
                {isOwnProfile && pendingVideos.length > 0 && (
                  <button 
                    onClick={() => setActiveTab('approval')}
                    className={`text-white font-medium pb-2 whitespace-nowrap ${
                      activeTab === 'approval' ? 'border-b-2 border-blue-500' : 'hover:text-blue-400'
                    }`}
                  >
                    For Approval ({pendingVideos.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'videos' ? (
              videos.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📹</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No videos available</h3>
                  <p className="text-gray-500">
                    {isOwnProfile ? 'Upload your first video to get started!' : 'This user hasn\'t uploaded any videos yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map((video) => (
                    <div key={video.id} className="relative group">
                      <VideoCard video={video} />
                      {isOwnProfile && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={() => handleEditVideo(video)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors shadow-lg"
                            title="Edit video"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            disabled={deletingVideos.includes(video.id)}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors shadow-lg"
                            title="Delete video"
                          >
                            {deletingVideos.includes(video.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              pendingVideos.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">⏳</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No pending videos</h3>
                  <p className="text-gray-500">All your videos have been approved!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-6">
                    <Clock className="text-yellow-500" size={20} />
                    <h3 className="text-lg font-semibold text-white">Videos Waiting for Approval</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pendingVideos.map((video) => (
                      <div key={video.id} className="relative">
                        <VideoCard video={video} />
                        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded font-medium">
                          Pending
                        </div>
                        <div className="absolute bottom-2 right-2">
                          <button
                            onClick={() => handleRemoveVideo(video.id)}
                            disabled={removingVideos.includes(video.id)}
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white p-2 rounded-lg transition-colors shadow-lg"
                            title="Remove video"
                          >
                            {removingVideos.includes(video.id) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Video Edit Modal */}
      {editingVideo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Edit Video</h3>
              <button
                onClick={() => setEditingVideo(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={videoEditForm.title}
                  onChange={(e) => setVideoEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Video title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={videoEditForm.description}
                  onChange={(e) => setVideoEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                  placeholder="Video description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Thumbnail
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                    id="thumbnail-upload"
                    disabled={uploadingThumbnail}
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded border border-gray-600 cursor-pointer transition-colors flex items-center justify-center"
                  >
                    {uploadingThumbnail ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      'Choose Thumbnail'
                    )}
                  </label>
                  {videoEditForm.thumbnail && (
                    <div className="mt-2">
                      <img
                        src={videoEditForm.thumbnail}
                        alt="Thumbnail preview"
                        className="w-20 h-12 object-cover rounded border border-gray-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleUpdateVideo}
                  disabled={updatingVideo}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                >
                  {updatingVideo ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Update Video'
                  )}
                </button>
                <button
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
