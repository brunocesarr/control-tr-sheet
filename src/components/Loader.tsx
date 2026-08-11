interface ILoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export default function Loader({ label = 'Carregando…', fullScreen = true }: ILoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center ${fullScreen ? 'h-screen' : 'py-10'}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="size-16 animate-spin rounded-full border-4 border-solid border-emerald-600 border-t-transparent" />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
    </div>
  );
}
