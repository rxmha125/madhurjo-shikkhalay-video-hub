import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Reply, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  video_id: string;
  parent_id?: string;
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
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

        setComments(commentsWithUser);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [videoId]);

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

      const newCommentWithUser = {
        ...data,
        user: {
          name: data.profiles?.name || 'Unknown User',
          avatar: data.profiles?.avatar
        }
      };

      setComments(prev => [newCommentWithUser, ...prev]);
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

      const newReply = {
        ...data,
        user: {
          name: data.profiles?.name || 'Unknown User',
          avatar: data.profiles?.avatar
        }
      };

      // Update the comments state to include the new reply
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.id === replyTo) {
            const updatedReplies = comment.replies ? [...comment.replies, newReply] : [newReply];
            return { ...comment, replies: updatedReplies };
          }
          return comment;
        });
      });

      setReplyTo(null);
      setReplyContent('');

      // Optionally, notify the parent comment's author
      const parentComment = comments.find(c => c.id === replyTo);
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
    if (!profile) return;

    try {
      // Get current comment to increment likes
      const currentComment = comments.find(c => c.id === commentId);
      if (!currentComment) return;

      const newLikes = currentComment.likes + 1;

      // Optimistically update the local state
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId
            ? { ...comment, likes: newLikes }
            : comment
        )
      );

      // Update the like count in the database
      const { error } = await supabase
        .from('comments')
        .update({ likes: newLikes })
        .eq('id', commentId);

      if (error) {
        console.error('Error liking comment:', error);
        // Revert the optimistic update if the database update fails
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId
              ? { ...comment, likes: currentComment.likes }
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDislike = async (commentId: string) => {
    if (!profile) return;

    try {
      // Get current comment to increment dislikes
      const currentComment = comments.find(c => c.id === commentId);
      if (!currentComment) return;

      const newDislikes = currentComment.dislikes + 1;

      // Optimistically update the local state
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId
            ? { ...comment, dislikes: newDislikes }
            : comment
        )
      );

      // Update the dislike count in the database
      const { error } = await supabase
        .from('comments')
        .update({ dislikes: newDislikes })
        .eq('id', commentId);

      if (error) {
        console.error('Error disliking comment:', error);
        // Revert the optimistic update if the database update fails
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId
              ? { ...comment, dislikes: currentComment.dislikes }
              : comment
          )
        );
      }
    } catch (error) {
      console.error('Error disliking comment:', error);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-xl font-semibold text-white mb-4">
        Comments ({comments.length})
      </h3>

      {profile && (
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="flex space-x-3">
            <img
              src={profile.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
              alt={profile.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <img
                  src={comment.user?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
                  alt={comment.user?.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-white text-sm">
                      {comment.user?.name || 'Unknown User'}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">{comment.content}</p>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(comment.id)}
                      className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Heart size={16} />
                      <span className="text-xs">{comment.likes}</span>
                    </button>
                    
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <Reply size={16} />
                      <span className="text-xs">Reply</span>
                    </button>
                  </div>

                  {replyTo === comment.id && profile && (
                    <form onSubmit={handleSubmitReply} className="mt-3 ml-4">
                      <div className="flex space-x-2">
                        <img
                          src={profile.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
                          alt={profile.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full bg-gray-700/50 border border-gray-600/50 rounded px-3 py-2 text-white placeholder-gray-400 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            rows={2}
                          />
                          <div className="flex justify-end space-x-2 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyTo(null);
                                setReplyContent('');
                              }}
                              className="text-xs text-gray-400 hover:text-white px-2 py-1"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={!replyContent.trim()}
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
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
                        <div key={reply.id} className="flex items-start space-x-2">
                          <img
                            src={reply.user?.avatar || '/lovable-uploads/544d0b71-3b60-4f04-81da-d190b8007a11.png'}
                            alt={reply.user?.name || 'User'}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-white text-xs">
                                {reply.user?.name || 'Unknown User'}
                              </span>
                              <span className="text-gray-400 text-xs">
                                {new Date(reply.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-300 text-xs">{reply.content}</p>
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
  );
};

export default CommentSection;
