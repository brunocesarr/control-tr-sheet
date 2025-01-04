'use client';

import Sidebar from '@/components/Sidebar';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="flex h-full">
        <Sidebar />
        <div className="grow">{children}</div>
      </div>
    </>
  );
}
