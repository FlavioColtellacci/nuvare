import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";

/**
 * Paths that must not run Supabase session refresh (no cookie session; secrets instead).
 */
function shouldSkipSupabase(pathname: string): boolean {
  if (pathname === "/api/stripe/webhook") return true;
  if (pathname.startsWith("/api/cron/")) return true;
  return false;
}

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/home" || pathname.startsWith("/home/")) return true;
  if (pathname === "/vault" || pathname.startsWith("/vault/")) return true;
  if (pathname === "/countries" || pathname.startsWith("/countries/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  if (shouldSkipSupabase(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next internals and common static assets.
     * See: https://supabase.com/docs/guides/auth/server-side/nextjs
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
