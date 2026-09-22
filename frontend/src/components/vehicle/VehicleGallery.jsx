import { useState } from 'react';
import { ChevronLeft, ChevronRight, Car } from 'lucide-react';  // ✅ Car imported

const VehicleGallery = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState({});
  
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400">
        <Car className="w-20 h-20 mb-4" />
        <span>No Images Available</span>
      </div>
    );
  }
  
  const activeImage = images[activeIndex]?.image_url || images[activeIndex]?.url;
  
  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  return (
    <div>
      <div className="relative rounded-xl overflow-hidden bg-slate-100">
        {!imgErrors[activeIndex] && activeImage ? (
          <img
            src={activeImage}
            alt={`Vehicle ${activeIndex + 1}`}
            className="w-full h-64 md:h-96 object-cover"
            onError={() => {
              console.log('❌ Gallery image failed:', activeImage);
              setImgErrors({ ...imgErrors, [activeIndex]: true });
            }}
            crossOrigin="anonymous"
          />
        ) : (
          <div className="w-full h-64 md:h-96 flex flex-col items-center justify-center text-slate-400">
            <Car className="w-16 h-16 mb-2" />
            <span>Image failed to load</span>
          </div>
        )}
        
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        
        <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {activeIndex + 1} / {images.length}
        </span>
      </div>
      
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => setActiveIndex(index)}
              className={`rounded-lg overflow-hidden border-2 ${
                index === activeIndex ? 'border-blue-600' : 'border-transparent hover:border-slate-300'
              }`}
            >
              {!imgErrors[index] && (image.image_url || image.url) ? (
                <img
                  src={image.image_url || image.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-20 object-cover"
                  onError={() => setImgErrors({ ...imgErrors, [index]: true })}
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-20 bg-slate-100 flex items-center justify-center">
                  <Car className="w-8 h-8 text-slate-400" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleGallery;