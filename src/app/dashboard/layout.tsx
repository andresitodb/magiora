import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Nav from '@/components/Nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav variant="dashboard" />
      <main className="max-w-5xl mx-auto px-6 py-12">{children}</main>
    </div>
  );
}
