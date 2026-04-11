import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Public routes
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/privacidade",
    "/termos",
    "/esqueci-senha",
    "/redefinir-senha",
    "/verificar-email",
  ];
  const isPublicRoute = publicRoutes.includes(path);
  const isApiRoute = path.startsWith("/api/");
  const isVerifyPage = path === "/verificar-email";

  // Unauthenticated user trying to access protected route
  if (!user && !isPublicRoute && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated but email not confirmed → force to /verificar-email
  if (user && !user.email_confirmed_at && !isPublicRoute && !isApiRoute && !isVerifyPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/verificar-email";
    return NextResponse.redirect(url);
  }

  // Authenticated user trying to access auth pages
  if (user && user.email_confirmed_at && (path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
