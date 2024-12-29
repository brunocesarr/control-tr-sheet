interface ISekeletonProps {
  className?: string
}

const Skeleton = ({ className }: ISekeletonProps) => {
  return (
    <div
      className={`animate-pulse bg-gray-300 rounded-md w-full ${className}`}
    />
  )
}

export default Skeleton
