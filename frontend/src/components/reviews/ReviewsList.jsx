import { useState, useEffect } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import StarRating from '../ui/StarRating';
import reviewService from '../../services/reviewService';
import Spinner from '../ui/Spinner';
import Card from '../ui/Card';

const ReviewsList = ({ vehicleId, limit = 5 }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!vehicleId) return;
    fetchReviews();
  }, [vehicleId, page, limit]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await reviewService.getVehicleReviews(vehicleId, page, limit);
      setReviews(response.data.reviews);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        {total} {total === 1 ? 'review' : 'reviews'}
      </p>
      
      {reviews.map((review) => (
        <Card key={review.id} className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                {review.customer_avatar ? (
                  <img 
                    src={review.customer_avatar} 
                    alt={review.customer_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-semibold">
                    {review.customer_name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-slate-900">{review.customer_name}</p>
                <p className="text-xs text-slate-500">
                  {new Date(review.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <StarRating rating={review.rating} size="sm" />
          </div>
          
          {review.title && (
            <h4 className="font-medium text-slate-900 mb-1">{review.title}</h4>
          )}
          
          <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
        </Card>
      ))}
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 hover:bg-slate-100 rounded disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 hover:bg-slate-100 rounded disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;