import { cn } from "../../utils/cn";

const Card = ({
  children,
  className = '',
  hoverable = false,
  padding = 'p-6',
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200',
        padding,
        hoverable && 'hover:shadow-lg hover:border-blue-200 transition-all duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;