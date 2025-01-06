interface ISekeletonProps {
  className?: string;
}

const Skeleton = ({ className }: ISekeletonProps) => {
  return <div className={`w-full animate-pulse rounded-md bg-gray-300 ${className}`} />;
};

export default Skeleton;
