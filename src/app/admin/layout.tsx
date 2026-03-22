import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminChat } from '@/components/admin/admin-chat';

export const metadata: Metadata = {
  title: 'Admin | zev.ai',
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminShell>{children}</AdminShell>
      <AdminChat />
    </>
  );
}
