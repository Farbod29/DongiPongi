import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Header from '@/components/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex-1 flex overflow-hidden">{children}</div>
    </div>
  );
}

