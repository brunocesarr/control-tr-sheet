interface ISkeletonProps {
  className?: string;
}

/** Typo fixed: ISekeletonProps → ISkeletonProps. */
export default function Skeleton({ className = '' }: ISkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={`w-full animate-pulse rounded-md bg-gray-300 ${className}`}
    />
  );
}
