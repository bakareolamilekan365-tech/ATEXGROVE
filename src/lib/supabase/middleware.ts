import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSupabaseSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Supabase authentication is not configured; refusing to serve an unprotected production request.");
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const copySessionState = (target: NextResponse) => {
    response.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
    ["cache-control", "expires", "pragma"].forEach((header) => {
      const value = response.headers.get(header);
      if (value) target.headers.set(header, value);
    });
    return target;
  };
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/auth/callback",
  ];
  const isPublicPath =
    publicPaths.includes(pathname) || pathname.startsWith("/info/") || pathname.startsWith("/api/");

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    const redirectResponse = copySessionState(NextResponse.redirect(loginUrl));
    redirectResponse.headers.set("Cache-Control", "private, no-store, max-age=0");
    return redirectResponse;
  }

  if (user && ["/login", "/register"].includes(pathname)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    const dashboardResponse = copySessionState(NextResponse.redirect(dashboardUrl));
    dashboardResponse.headers.set("Cache-Control", "private, no-store, max-age=0");
    dashboardResponse.headers.set("Pragma", "no-cache");
    dashboardResponse.headers.set("Expires", "0");
    return dashboardResponse;
  }

  if (!isPublicPath) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }
  return response;
}
