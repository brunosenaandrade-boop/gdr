import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_HOSTS = [
  "admin.guardadinheiro.com.br",
  "admin.localhost:3000",
  "admin.localhost",
];

function isAdminHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return ADMIN_HOSTS.some((h) => host === h || host.startsWith("admin."));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const host = request.headers.get("host");
  const isAdmin = isAdminHost(host);
  const path = request.nextUrl.pathname;

  // ============================================================
  // Subdomínio admin.*: reescreve para /admin/*
  // ============================================================
  if (isAdmin) {
    // Se o path já começa com /admin, não reescrever
    // Caso contrário, reescrever: admin.guardadinheiro.com.br/ → /admin
    //                              admin.guardadinheiro.com.br/users → /admin/users
    if (!path.startsWith("/admin") && !path.startsWith("/api") && !path.startsWith("/_next")) {
      const url = request.nextUrl.clone();
      url.pathname = path === "/" ? "/admin" : `/admin${path}`;
      return NextResponse.rewrite(url);
    }
  }

  // ============================================================
  // Auth session refresh
  // ============================================================
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
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

  // ============================================================
  // Admin subdomain: só permite /admin/login se não autenticado
  // ============================================================
  if (isAdmin) {
    const adminPath = path.startsWith("/admin") ? path : `/admin${path === "/" ? "" : path}`;
    const isLoginPage = adminPath === "/admin/login";
    const isApiRoute = path.startsWith("/api/");

    if (!user && !isLoginPage && !isApiRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    // Autorização full (role super_admin) é validada na server action/page usando getCurrentAdmin()
    return supabaseResponse;
  }

  // ============================================================
  // Domínio principal: auth flow padrão
  // ============================================================
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/privacidade",
    "/termos",
    "/esqueci-senha",
    "/redefinir-senha",
    "/verificar-email",
    "/planos",
    "/como-funciona",
  ];
  const isPublicRoute = publicRoutes.includes(path);
  const isApiRoute = path.startsWith("/api/");
  const isVerifyPage = path === "/verificar-email";

  // Bloquear acesso a /admin pelo domínio principal
  if (path.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (!user && !isPublicRoute && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && !user.email_confirmed_at && !isPublicRoute && !isApiRoute && !isVerifyPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/verificar-email";
    return NextResponse.redirect(url);
  }

  if (user && user.email_confirmed_at && (path === "/login" || path === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
