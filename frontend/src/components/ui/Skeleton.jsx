const Skeleton = ({ variant = 'text', className = '' }) => {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    title: 'h-6 w-2/3 rounded',
    image: 'h-48 w-full rounded-lg',
    card: 'h-32 w-full rounded-lg',
    button: 'h-10 w-32 rounded-lg',
    avatar: 'h-12 w-12 rounded-full',
  };
  
  return (
    <div className={`skeleton ${variantClasses[variant]} ${className}`} />
  );
};

export default Skeleton;