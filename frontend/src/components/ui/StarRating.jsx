import { Star } from 'lucide-react';
import { useState } from 'react';

const StarRating = ({ 
  rating = 0, 
  onRatingChange = null, 
  size = 'md',
  interactive = false 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  const starSize = sizes[size] || sizes.md;
  
  const handleClick = (value) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };
  
  const handleHover = (value) => {
    if (interactive) {
      setHoverRating(value);
    }
  };
  
  const displayRating = hoverRating || rating;
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleHover(star)}
          onMouseLeave={() => handleHover(0)}
          disabled={!interactive}
          className={`${interactive ? 'cursor-pointer' : 'cursor-default'} 
            ${interactive ? 'hover:scale-110 transition-transform' : ''}`}
        >
          <Star
            className={`${starSize} ${
              star <= displayRating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      
      {rating > 0 && !interactive && (
        <span className="ml-2 text-sm font-medium text-slate-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;