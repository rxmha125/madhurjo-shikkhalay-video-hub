
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Reply, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  video_id: string;
  parent_id?: string | null;
  likes: number;
  dislikes: number;
  user?: {
    name: string;
    avatar?: string;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  videoId: string;
  videoTitle: string;
  videoCreatorId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ videoId, videoTitle, videoCreatorId }) => {
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [parentComments, setParentComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const { profile } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  useEffect(() => {
    if (!videoId) return;

    // Real-time subscription for comments
    const channel = supabase
      .channel(`comments_${videoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `video_id=eq.${videoId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey (
            name,
            avatar
          )
        `)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const commentsWithUser = data.map(comment => ({
        ...comment,
        user: {
          name: comment.profiles?.name || 'Unknown User',
          avatar: comment.profiles?.avatar
        }
      }));

      setAllComments(commentsWithUser);

      // Separate parent comments and build the tree structure
      const parentComments = commentsWithUser.filter(comment => !comment.parent_id);
      const replies = commentsWithUser.filter(comment => comment.parent_id);

      // Add replies to their parent comments
      const commentsWithReplies = parentComments.map(parent => ({
        ...parent,
        replies: replies.filter(reply => reply.parent_id === parent.id)
      }));

      setParentComments(commentsWithReplies);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: newComment,
          video_id: videoId,
          user_id: profile.id
        })
        .select(`
          *,
          profiles!comments_user_id_fkey (
            name,
            avatar
          )
        `)
        .single();

      if (error) throw error;

      setNewComment('');

      // Notify video creator about new comment
      if (videoCreatorId !== profile.id) {
        await addNotification({
          user_id: videoCreatorId,
          type: 'comment',
          title: 'New Comment',
          content: `${profile.name} commented on your video "${videoTitle}"`,
          video_id: videoId
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !replyTo || !replyContent.trim()) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: replyContent,
          video_id: videoId,
          user_id: profile.id,
          parent_id: replyTo
        })
        .select(`
          *,
          profiles!comments_user_id_fkey (
            name,
            avatar
          )
        `)
        .single();

      if (error) throw error;

      setReplyTo(null);
      setReplyContent('');

      // Notify the parent comment's author
      const parentComment = allComments.find(c => c.id === replyTo);
      if (parentComment && parentComment.user_id !== profile.id) {
        await addNotification({
          user_id: parentComment.user_id,
          type: 'comment',
          title: 'New Reply',
          content: `${profile.name} replied to your comment on "${videoTitle}"`,
          video_id: videoId
        });
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!profile || likedComments.has(commentId)) return;

    try {
      const currentComment = allComments.find(c => c.id === commentId);
      if (!currentComment) return;

      const newLikes = currentComment.likes + 1;
      
      // Optimistic update
      setLikedComments(prev => new Set([...prev, commentId]));
      setAllComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, likes: newLikes } : c
      ));
      setParentComments(prev => prev.map(parent => ({
        ...parent,
        likes: parent.id === commentId ? newLikes : parent.likes,
        replies: parent.replies?.map(reply => 
          reply.id === commentId ? { ...reply, likes: newLikes } : reply
        )
      })));

      const { error } = await supabase
        .from('comments')
        .update({ likes: newLikes })
        .eq('id', commentId);

      if (error) {
        // Revert optimistic update on error
        setLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
        throw error;
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const totalCommentCount = parentComments.length;

  return (
    <div className="mt-8 space-y-6">
      {/* Collapsible Comments Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-xl font-semibold text-white hover:text-purple-300 transition-colors"
        >
          <span>Comments ({totalCommentCount})</span>
          {showComments ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </button>
      </div>

      {/* Always show comment form */}
      {profile && (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex space-x-3">
            <img
              src={profile.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
              alt={profile.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/30 flex-shrink-0"
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-purple-300 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-purple-500/25"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Collapsible Comments List */}
      <div className={`transition-all duration-300 overflow-hidden ${showComments ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-4 pt-4">
          {isLoading ? (
            <div className="text-center text-purple-300 py-8">Loading comments...</div>
          ) : parentComments.length === 0 ? (
            <div className="text-center text-purple-300 py-8">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            parentComments.map((comment) => (
              <div key={comment.id} className="bg-gray-800/30 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <img
                    src={comment.user?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
                    alt={comment.user?.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-white text-sm truncate">
                        {comment.user?.name || 'Unknown User'}
                      </span>
                      <span className="text-purple-300 text-xs flex-shrink-0">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-purple-100 text-sm mb-3 break-words">{comment.content}</p>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(comment.id)}
                        disabled={likedComments.has(comment.id)}
                        className={`flex items-center space-x-1 transition-colors ${
                          likedComments.has(comment.id) 
                            ? 'text-red-400' 
                            : 'text-purple-300 hover:text-red-400'
                        }`}
                      >
                        <Heart size={16} className={likedComments.has(comment.id) ? 'fill-current' : ''} />
                        <span className="text-xs">{comment.likes}</span>
                      </button>
                      
                      {profile && (
                        <button
                          onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                          className="flex items-center space-x-1 text-purple-300 hover:text-blue-400 transition-colors"
                        >
                          <Reply size={16} />
                          <span className="text-xs">Reply</span>
                        </button>
                      )}
                    </div>

                    {replyTo === comment.id && profile && (
                      <form onSubmit={handleSubmitReply} className="mt-3 ml-4">
                        <div className="flex space-x-2">
                          <img
                            src={profile.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
                            alt={profile.name}
                            className="w-6 h-6 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              className="w-full bg-gray-700/50 backdrop-blur-sm border border-purple-500/30 rounded-lg px-3 py-2 text-white placeholder-purple-300 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                              rows={2}
                            />
                            <div className="flex justify-end space-x-2 mt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyTo(null);
                                  setReplyContent('');
                                }}
                                className="text-xs text-purple-300 hover:text-white px-2 py-1 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={!replyContent.trim()}
                                className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-300"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    )}

                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-6 mt-3 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start space-x-2 bg-gray-900/30 backdrop-blur-sm border border-purple-500/10 rounded-lg p-3">
                            <img
                              src={reply.user?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
                              alt={reply.user?.name || 'User'}
                              className="w-6 h-6 rounded-full object-cover border border-purple-500/30 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-white text-xs truncate">
                                  {reply.user?.name || 'Unknown User'}
                                </span>
                                <span className="text-purple-300 text-xs flex-shrink-0">
                                  {new Date(reply.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-purple-100 text-xs break-words">{reply.content}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <button
                                  onClick={() => handleLike(reply.id)}
                                  disabled={likedComments.has(reply.id)}
                                  className={`flex items-center space-x-1 transition-colors ${
                                    likedComments.has(reply.id) 
                                      ? 'text-red-400' 
                                      : 'text-purple-300 hover:text-red-400'
                                  }`}
                                >
                                  <Heart size={12} className={likedComments.has(reply.id) ? 'fill-current' : ''} />
                                  <span className="text-xs">{reply.likes}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
