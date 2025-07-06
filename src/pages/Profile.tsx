
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Upload as UploadIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import InfiniteScroll from 'react-infinite-scroll-component';
import VideoCard from '../components/VideoCard';

interface Video {
  _id: string;
  title: string;
  thumbnail: string;
  views: number;
  createdAt: Date;
  creator: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

const Profile = () => {
  const { id } = useParams();
  const { user, updateProfile } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  });

  const isOwnProfile = user?._id === id;

  useEffect(() => {
    loadProfile();
    loadUserVideos();
  }, [id]);

  const loadProfile = () => {
    // In real app, this would fetch from MongoDB
    if (isOwnProfile && user) {
      setProfileUser(user);
      setEditForm({
        name: user.name,
        description: user.description || ''
      });
    } else {
      // Simulate loading another user's profile
      setProfileUser({
        _id: id,
        name: 'Student User',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
        description: 'Eager to learn and grow through quality education.'
      });
    }
    setLoading(false);
  };

  const loadUserVideos = () => {
    // Load videos uploaded by this user
    // In real app, this would fetch from MongoDB with user filter
    setVideos([]);
    setHasMore(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isOwnProfile) {
      const imageUrl = URL.createObjectURL(file);
      updateProfile({ avatar: imageUrl });
      setProfileUser((prev: any) => ({ ...prev, avatar: imageUrl }));
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
                src={profileUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                alt={profileUser?.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-500/30"
              />
              
              {isOwnProfile && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="text-center">
                    <UploadIcon size={20} className="text-white mx-auto mb-1" />
                    <p className="text-xs text-white">Choose Image</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
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
              <div className="flex space-x-8">
                <button className="text-white font-medium border-b-2 border-blue-500 pb-2">
                  Videos
                </button>
              </div>
            </div>
          </div>

          {/* Videos Section */}
          <div className="p-6">
            {videos.length === 0 ? (
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
              <InfiniteScroll
                dataLength={videos.length}
                next={() => {}}
                hasMore={hasMore}
                loader={
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                }
                endMessage={
                  videos.length > 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No more videos available.
                    </div>
                  )
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map((video) => (
                    <VideoCard key={video._id} video={video} />
                  ))}
                </div>
              </InfiniteScroll>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
