const Navbar = ({ children }: { children: React.ReactNode }) => {
  return (
    <nav className="bg-gray-900">
      <div className="container flex items-center justify-center">
        <div className="flex min-h-[48px] items-center py-4">
          <span className="whitespace-nowrap text-xl font-medium text-white">{children}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
