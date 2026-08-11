interface IContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function Container({ children, className = '' }: IContainerProps) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className}`}>{children}</div>;
}
