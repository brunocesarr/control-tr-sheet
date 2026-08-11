interface INavbarProps {
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Navbar({ children, actions }: INavbarProps) {
  return (
    <nav className="flex items-center justify-between gap-4 bg-slate-900 px-4 py-4 sm:px-6">
      <span className="truncate whitespace-nowrap text-xl font-medium text-white">{children}</span>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </nav>
  );
}
