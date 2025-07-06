
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MoreVertical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  likes: number;
  replies: Comment[];
  createdAt: Date;
  liked?: boolean;
}

interface CommentSectionProps {
  videoId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ videoId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = () => {
    // In real app, this would fetch comments from MongoDB
    setComments([]);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      _id: Date.now().toString(),
      content: newComment,
      author: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar
      },
      likes: 0,
      replies: [],
      createdAt: new Date()
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');

    // Send notification
    addNotification({
      type: 'comment',
      message: `${user.name} commented on a video`,
      read: false
    });
  };

  const handleReplySubmit = (parentId: string) => {
    if (!replyContent.trim() || !user) return;

    const reply: Comment = {
      _id: Date.now().toString(),
      content: replyContent,
      author: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar
      },
      likes: 0,
      replies: [],
      createdAt: new Date()
    };

    setComments(prev => prev.map(comment => 
      comment._id === parentId 
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ));

    setReplyContent('');
    setReplyingTo(null);
  };

  const handleLike = (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (isReply && parentId) {
      setComments(prev => prev.map(comment => 
        comment._id === parentId 
          ? {
              ...comment,
              replies: comment.replies.map(reply =>
                reply._id === commentId
                  ? { ...reply, liked: !reply.liked, likes: reply.liked ? reply.likes - 1 : reply.likes + 1 }
                  : reply
              )
            }
          : comment
      ));
    } else {
      setComments(prev => prev.map(comment => 
        comment._id === commentId 
          ? { ...comment, liked: !comment.liked, likes: comment.liked ? comment.likes - 1 : comment.likes + 1 }
          : comment
      ));
    }
  };

  const CommentItem: React.FC<{ comment: Comment; isReply?: boolean; parentId?: string }> = ({ 
    comment, 
    isReply = false, 
    parentId 
  }) => (
    <div className={`${isReply ? 'ml-12' : ''} space-y-3`}>
      <div className="flex space-x-3">
        <img
          src={comment.author.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}
          alt={comment.author.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        
        <div className="flex-1 space-y-2">
          <div className="bg-gray-800/30 rounded-xl p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-white text-sm">{comment.author.name}</span>
              <span className="text-xs text-gray-400">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <button
              onClick={() => handleLike(comment._id, isReply, parentId)}
              className={`flex items-center space-x-1 hover:text-red-400 transition-colors ${
                comment.liked ? 'text-red-400' : ''
              }`}
            >
              <Heart size={12} fill={comment.liked ? 'currentColor' : 'none'} />
              <span>{comment.likes}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                className="flex items-center space-x-1 hover:text-blue-400 transition-colors"
              >
                <MessageCircle size={12} />
                <span>Reply</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment._id && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleReplySubmit(comment._id);
              }}
              className="mt-3"
            >
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="input-field flex-1 text-sm py-2"
                />
                <button
                  type="submit"
                  disabled={!replyContent.trim()}
                  className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem 
              key={reply._id} 
              comment={reply} 
              isReply={true} 
              parentId={comment._id} 
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-card p-6">
      <h3 className="text-xl font-bold text-white mb-6">
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleCommentSubmit} className="mb-8">
          <div className="flex space-x-3">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="input-field w-full h-20 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>Please log in to leave a comment</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment._id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
