import { Star } from 'lucide-react';

const VehicleRating = ({ rating, reviewCount }) => {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500 opacity-50" />
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-slate-300" />
        );
      }
    }
    return stars;
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex">{renderStars()}</div>
      <span className="text-sm font-semibold text-slate-900">{rating}</span>
      <span className="text-sm text-slate-500">({reviewCount} reviews)</span>
    </div>
  );
};

export default VehicleRating;