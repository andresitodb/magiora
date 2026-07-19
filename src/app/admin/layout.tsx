import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Nav from '@/components/Nav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-[#f5f3ee]">
      <Nav variant="admin" />
      <main className="max-w-6xl mx-auto px-6 py-12">{children}</main>
    </div>
  );
}
