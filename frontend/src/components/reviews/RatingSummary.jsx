import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import reviewService from '../../services/reviewService';

const RatingSummary = ({ vehicleId, compact = false }) => {
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vehicleId) return;
    fetchRating();
  }, [vehicleId]);

  const fetchRating = async () => {
    try {
      const response = await reviewService.getVehicleRating(vehicleId);
      setRating(response.data);
    } catch (error) {
      console.error('Failed to fetch rating:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-6 bg-slate-200 rounded w-32"></div>;
  }

  if (!rating || rating.total_reviews === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map(star => (
            <Star key={star} className="w-4 h-4 text-gray-300" />
          ))}
        </div>
        <span className="text-sm text-slate-500">No reviews yet</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}>
      <div className="flex items-center gap-1">
        <Star className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-yellow-400 fill-yellow-400`} />
        <span className={`${compact ? 'text-base' : 'text-lg'} font-bold text-slate-900`}>
          {rating.average_rating}
        </span>
      </div>
      <span className="text-sm text-slate-500">
        ({rating.total_reviews} {rating.total_reviews === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
};

export default RatingSummary;