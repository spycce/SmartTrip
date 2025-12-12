import React, { useState } from 'react';
import { Star, MessageCircle, Send, Trash2, Edit2, X, Check } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Review {
    _id: string; // Mongo ID
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
}

interface ReviewSectionProps {
    tripId: string;
    reviews?: Review[];
    onReviewAdded: (updatedReviews: Review[]) => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ tripId, reviews = [], onReviewAdded }) => {
    const { user } = useAuth(); // Get user from context
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Edit State
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editComment, setEditComment] = useState('');
    const [editRating, setEditRating] = useState(5);
    const [editHoverRating, setEditHoverRating] = useState(0);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // If not logged in or empty comment, return
        if (!user || !comment.trim()) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`/api/trips/${tripId}/reviews`, {
                userName: user.name, // Use logged-in user's name
                rating,
                comment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onReviewAdded(res.data);
            setComment('');
            setRating(5);
        } catch (err) {
            console.error("Failed to submit review", err);
            alert("Failed to submit review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = (reviewId: string) => {
        setReviewToDelete(reviewId);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!reviewToDelete) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.delete(`/api/trips/${tripId}/reviews/${reviewToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onReviewAdded(res.data);
            setDeleteModalOpen(false);
            setReviewToDelete(null);
        } catch (err) {
            alert("Failed to delete review.");
        }
    };

    const startEdit = (review: Review) => {
        setEditingReviewId(review._id);
        setEditComment(review.comment);
        setEditRating(review.rating);
    };

    const cancelEdit = () => {
        setEditingReviewId(null);
        setEditComment('');
        setEditRating(5);
    };

    const saveEdit = async (reviewId: string) => {
        if (!editComment.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`/api/trips/${tripId}/reviews/${reviewId}`, {
                rating: editRating,
                comment: editComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onReviewAdded(res.data);
            setEditingReviewId(null);
        } catch (err) {
            alert("Failed to update review.");
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <MessageCircle className="mr-2 text-blue-500" size={20} />
                Trip Reviews
            </h3>

            {/* Review List */}
            <div className="space-y-6 mb-8 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {reviews.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-500 text-sm">No reviews yet. Be the first to share your experience!</p>
                    </div>
                ) : (
                    reviews.map((review) => {
                        const isEditing = editingReviewId === review._id;
                        const isOwner = user?.id === review.userId;

                        return (
                            <div key={review._id} className="bg-slate-50 rounded-xl p-4 transition-all hover:bg-blue-50/50 relative flex flex-col justify-between min-h-[120px]">
                                <div>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
                                                {review.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900">{review.userName}</h4>
                                                <p className="text-xs text-slate-500">{new Date(review.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        {!isEditing && (
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <div className="mt-3 space-y-3">
                                            <div className="flex items-center space-x-1">
                                                {[...Array(5)].map((_, i) => {
                                                    const starValue = i + 1;
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={i}
                                                            onClick={() => setEditRating(starValue)}
                                                            onMouseEnter={() => setEditHoverRating(starValue)}
                                                            onMouseLeave={() => setEditHoverRating(0)}
                                                            className="focus:outline-none"
                                                        >
                                                            <Star
                                                                size={16}
                                                                className={starValue <= (editHoverRating || editRating)
                                                                    ? "fill-yellow-400 text-yellow-400"
                                                                    : "text-slate-300"}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <textarea
                                                value={editComment}
                                                onChange={(e) => setEditComment(e.target.value)}
                                                className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                rows={2}
                                            />
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => saveEdit(review._id)}
                                                    className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 flex items-center"
                                                >
                                                    <Check size={12} className="mr-1" /> Save
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded-md hover:bg-slate-300 flex items-center"
                                                >
                                                    <X size={12} className="mr-1" /> Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-600 text-sm leading-relaxed pl-11 mb-8">{review.comment}</p>
                                    )}
                                </div>

                                {/* Always Visible Edit/Delete Buttons for Owner */}
                                {isOwner && !isEditing && (
                                    <div className="flex justify-end space-x-3 mt-2 border-t border-slate-200/50 pt-2">
                                        <button
                                            onClick={() => startEdit(review)}
                                            className="flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                        >
                                            <Edit2 size={12} className="mr-1" /> Edit
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(review._id)}
                                            className="flex items-center text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                                        >
                                            <Trash2 size={12} className="mr-1" /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Review Form */}
            {user ? (
                <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-6">
                    <h4 className="font-semibold text-slate-800 mb-4 text-sm">Write a Review as <span className="text-blue-600">{user.name}</span></h4>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Rating</label>
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 h-[38px] w-fit">
                                {[...Array(5)].map((_, i) => {
                                    const starValue = i + 1;
                                    return (
                                        <button
                                            type="button"
                                            key={i}
                                            onClick={() => setRating(starValue)}
                                            onMouseEnter={() => setHoverRating(starValue)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={18}
                                                className={`mr-1 ${starValue <= (hoverRating || rating)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-slate-300"}`}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Your Experience</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[80px]"
                                placeholder="Tell us about your trip..."
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                            ) : (
                                <Send size={16} className="mr-2" />
                            )}
                            Post Review
                        </button>
                    </div>
                </form>
            ) : (
                <div className="text-center py-4 border-t border-slate-100 text-sm text-slate-500">
                    Please log in to leave a review.
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Review?</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                Are you sure you want to delete this review? This action cannot be undone.
                            </p>
                            <div className="flex space-x-3 w-full">
                                <button
                                    onClick={() => setDeleteModalOpen(false)}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewSection;
