const Navbar = ({ children }: { children: React.ReactNode }) => {
  return (
    <nav className="bg-gray-900">
      <div className="container flex justify-center items-center">
        <div className="flex items-center py-4 min-h-[48px]">
          <span className="text-xl font-medium whitespace-nowrap text-white">{children}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
