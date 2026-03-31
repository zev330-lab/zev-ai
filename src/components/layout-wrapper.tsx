'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ChatWidget } from '@/components/chat-widget';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isImmersive = pathname === '/discover';

  if (isAdmin || isImmersive) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <ChatWidget />
    </>
  );
}
