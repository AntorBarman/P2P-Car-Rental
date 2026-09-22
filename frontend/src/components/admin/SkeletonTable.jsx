const SkeletonTable = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header Skeleton */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="skeleton h-4 w-32 rounded" />
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3 flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={`skeleton h-4 rounded ${colIndex === 0 ? 'w-40' : colIndex === 1 ? 'w-24' : 'w-20'}`} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonTable;