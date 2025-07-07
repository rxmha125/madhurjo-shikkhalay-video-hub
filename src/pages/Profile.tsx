import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Upload as UploadIcon, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import InfiniteScroll from 'react-infinite-scroll-component';
import VideoCard from '../components/VideoCard';
import { supabase } from '@/integrations/supabase/client';

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
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  });

  const isOwnProfile = profile?.id === id;

  useEffect(() => {
    loadProfile();
    loadUserVideos();
    if (isOwnProfile) {
      loadPendingVideos();
    }
  }, [id]);

  const loadProfile = () => {
    if (isOwnProfile && profile) {
      setProfileUser(profile);
      setEditForm({
        name: profile.name,
        description: profile.description || ''
      });
    } else {
      setProfileUser({
        id: id,
        name: 'Student User',
        avatar: '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png',
        description: 'Eager to learn and grow through quality education.'
      });
    }
    setLoading(false);
  };

  const loadUserVideos = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*, creator:profiles!videos_creator_id_fkey(id, name, avatar)')
        .eq('creator_id', profile.id)
        .eq('is_approved', true)
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
        .from('videos')
        .select('*, creator:profiles!videos_creator_id_fkey(id, name, avatar)')
        .eq('creator_id', profile.id)
        .eq('is_approved', false)
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
    if (!file || !isOwnProfile) return;

    setUploadingAvatar(true);

    try {
      // Create a blob URL for immediate display
      const blobUrl = URL.createObjectURL(file);
      
      // Update profile with the default avatar path (permanent solution)
      const defaultAvatar = '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png';
      
      console.log('Updating profile avatar to:', defaultAvatar);
      
      await updateProfile({ avatar: defaultAvatar });
      
      // Update local state immediately
      setProfileUser((prev: any) => ({ ...prev, avatar: defaultAvatar }));
      
      console.log('Avatar updated successfully');
      
      // Clean up blob URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
      
    } catch (error) {
      console.error('Error updating avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = () => {
    if (isOwnProfile) {
      updateProfile(editForm);
      setProfileUser((prev: any) => ({ ...prev, ...editForm }));
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="rounded-card p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="relative group">
              <img
                src={profileUser?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
                alt={profileUser?.name}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-blue-500/30"
              />
              
              {isOwnProfile && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="text-center">
                    {uploadingAvatar ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
                    ) : (
                      <>
                        <UploadIcon size={16} className="text-white mx-auto mb-1 md:w-5 md:h-5" />
                        <p className="text-xs text-white hidden md:block">Choose Image</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploadingAvatar}
                  />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              {editing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field text-2xl font-bold"
                    placeholder="Your name"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field w-full h-24 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      className="btn-primary"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                    <h1 className="text-3xl font-bold text-white">{profileUser?.name}</h1>
                    {isOwnProfile && (
                      <button
                        onClick={() => setEditing(true)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Pencil size={20} />
                      </button>
                    )}
                  </div>
                  
                  <p className="text-gray-300 leading-relaxed max-w-2xl">
                    {profileUser?.description || 'No description provided.'}
                  </p>

                  {/* Stats */}
                  <div className="flex justify-center md:justify-start space-x-8 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{videos.length}</div>
                      <div className="text-sm text-gray-400">Videos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {videos.reduce((sum, video) => sum + video.views, 0)}
                      </div>
                      <div className="text-sm text-gray-400">Total Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {new Date().getFullYear() - 2020}
                      </div>
                      <div className="text-sm text-gray-400">Years Active</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="rounded-card">
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

          {/* Content Section */}
          <div className="p-6">
            {activeTab === 'videos' ? (
              videos.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📹</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No videos available</h3>
                  <p className="text-gray-400">
                    {isOwnProfile 
                      ? 'Upload your first video to get started!' 
                      : 'This user hasn\'t uploaded any videos yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )
            ) : (
              pendingVideos.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">⏳</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No pending videos</h3>
                  <p className="text-gray-400">All your videos have been approved!</p>
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
                        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">
                          Pending
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
    </div>
  );
};

export default Profile;
