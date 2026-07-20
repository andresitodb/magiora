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
    <div className="min-h-screen bg-[#efeae2]">
      <Nav variant="admin" />
      <div className="border-b border-stone-300 bg-[#e6ded2]">
        <div className="k-container max-w-6xl py-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-700">
            Magiora Admin
          </p>
          <p className="hidden text-xs italic font-serif text-stone-500 sm:block">
            Moderation and curation workspace
          </p>
        </div>
      </div>
      <main className="k-container k-section max-w-6xl">{children}</main>
    </div>
  );
}
