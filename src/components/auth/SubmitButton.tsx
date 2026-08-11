interface SubmitButtonProps {
  children: React.ReactNode;
  isSubmitting: boolean;
  pendingLabel?: string;
  disabled?: boolean;
}

export default function SubmitButton({
  children,
  isSubmitting,
  pendingLabel = 'Aguarde…',
  disabled = false,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isSubmitting || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-600/50">
      {isSubmitting && (
        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {isSubmitting ? pendingLabel : children}
    </button>
  );
}
