import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Reserved subdomains that should NOT be treated as profile slugs
const RESERVED = new Set([
  'www',
  'admin',
  'app',
  'api',
  'mail',
  'email',
  'dev',
  'staging',
  'test',
  'docs',
  'blog',
  'help',
  'support',
  'about',
]);

export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);
  const host = (request.headers.get('host') ?? '').toLowerCase();
  const hostname = host.split(':')[0]; // strip port
  const parts = hostname.split('.');

  let slug: string | null = null;

  // Production: ['andres', 'kinora', 'com']
  if (parts.length >= 3 && parts[parts.length - 2] === 'kinora') {
    slug = parts[0];
  }
  // Local dev: ['andres', 'localhost']  (works in modern Chrome/Firefox/Safari)
  else if (parts.length === 2 && parts[1] === 'localhost') {
    slug = parts[0];
  }

  if (slug && !RESERVED.has(slug)) {
    const url = request.nextUrl.clone();

    // Only rewrite the root path of the subdomain to the profile page.
    // Any other path on a subdomain (e.g. andres.kinora.com/dashboard) gets
    // redirected to the apex domain to avoid confusion.
    if (url.pathname === '/' || url.pathname === '') {
      url.pathname = `/m/${slug}`;
      const rewriteResponse = NextResponse.rewrite(url);
      sessionResponse.cookies.getAll().forEach((cookie) => {
        rewriteResponse.cookies.set(cookie);
      });
      return rewriteResponse;
    }
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    // Match all paths except Next internals, API routes, and static assets
    '/((?!_next/|api/|favicon.ico|.*\\..*).*)',
  ],
};
