import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_HOSTS = [
  "admin.guardadinheiro.com.br",
  "admin.localhost:3000",
  "admin.localhost",
];

const AFFILIATE_HOSTS = [
  "afiliado.guardadinheiro.com.br",
  "afiliado.localhost:3000",
  "afiliado.localhost",
];

function isAdminHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return ADMIN_HOSTS.some((h) => host === h) || host.startsWith("admin.");
}

function isAffiliateHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return AFFILIATE_HOSTS.some((h) => host === h) || host.startsWith("afiliado.");
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
  const isAffiliate = !isAdmin && isAffiliateHost(host);
  const path = request.nextUrl.pathname;

  // ============================================================
  // Subdomínio admin.*: reescreve para /admin/*
  // ============================================================
  if (isAdmin) {
    if (!path.startsWith("/admin") && !path.startsWith("/api") && !path.startsWith("/_next")) {
      const url = request.nextUrl.clone();
      url.pathname = path === "/" ? "/admin" : `/admin${path}`;
      return NextResponse.rewrite(url);
    }
  }

  // ============================================================
  // Subdomínio afiliado.*: reescreve para /afiliado/*
  // ============================================================
  if (isAffiliate) {
    if (!path.startsWith("/afiliado") && !path.startsWith("/api") && !path.startsWith("/_next")) {
      const url = request.nextUrl.clone();
      url.pathname = path === "/" ? "/afiliado" : `/afiliado${path}`;
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
  // Segurança: validar que auth user ainda existe no banco
  // Se user foi deletado mas JWT ainda válido → força logout
  // ============================================================
  if (user && !path.startsWith("/api/") && !path.startsWith("/_next")) {
    const isDashboardRoute = path.startsWith("/dashboard");
    if (isDashboardRoute) {
      const { createServiceClient } = await import("./server");
      const service = await createServiceClient();

      // Verificar se auth user ainda existe
      const { data: authCheck } = await service.auth.admin.getUserById(user.id);
      if (!authCheck?.user) {
        // User deletado → limpar sessão e redirecionar
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }

      // Verificar se tenant existe
      const { data: tenantCheck } = await service
        .from("tenants")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!tenantCheck) {
        // Tenant deletado → limpar sessão e redirecionar
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    }
  }

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
  // Affiliate subdomain: só permite /afiliado/login se não autenticado
  // ============================================================
  if (isAffiliate) {
    const affPath = path.startsWith("/afiliado") ? path : `/afiliado${path === "/" ? "" : path}`;
    const isLoginPage = affPath === "/afiliado/login";
    const isApiRoute = path.startsWith("/api/");

    if (!user && !isLoginPage && !isApiRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/afiliado/login";
      return NextResponse.redirect(url);
    }
    // Autorização full (afiliado ativo) é validada na page usando getCurrentAffiliate()
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
    "/compra-concluida",
  ];
  const isPublicRoute = publicRoutes.includes(path);
  const isApiRoute = path.startsWith("/api/");
  const isVerifyPage = path === "/verificar-email";

  // Bloquear acesso a /admin e /afiliado pelo domínio principal
  if (path.startsWith("/admin") || path.startsWith("/afiliado")) {
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
