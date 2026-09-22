import { useState } from 'react';
import { X } from 'lucide-react';
import StarRating from '../ui/StarRating';
import Button from '../ui/Button';
import reviewService from '../../services/reviewService';
import { toast } from 'react-toastify';

const ReviewForm = ({ bookingId, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      toast.warning('Please select a rating');
      return;
    }
    
    if (!comment.trim() || comment.trim().length < 10) {
      toast.warning('Review must be at least 10 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await reviewService.createReview({
        bookingId,
        rating,
        title: title || undefined,
        comment: comment.trim()
      });
      
      toast.success('Review submitted successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Review error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Write a Review</h3>
        {onCancel && (
          <button onClick={onCancel} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your Rating
          </label>
          <StarRating 
            rating={rating} 
            onRatingChange={setRating}
            size="lg"
            interactive 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Review Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Great experience!"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Your Review
          </label>
          <textarea
            rows="4"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this vehicle..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        
        <div className="flex gap-3">
          <Button 
            type="submit" 
            isLoading={loading}
            disabled={!rating || comment.trim().length < 10}
          >
            Submit Review
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;