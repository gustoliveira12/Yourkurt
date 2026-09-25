import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/signup/verify-email",
  "/auth/confirm",
]);

const SUPER_ADMIN_ROUTES = new Set(["/gerenciamento-usuarios", "/super-admin"]);

function withPreservedHeaders(baseResponse: NextResponse, redirectResponse: NextResponse) {
  baseResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "location") {
      redirectResponse.headers.set(key, value);
    }
  });

  baseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  const url = supabaseUrl as string;
  const anonKey = supabaseAnonKey as string;

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = AUTH_ROUTES.has(request.nextUrl.pathname);

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return withPreservedHeaders(response, NextResponse.redirect(url));
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return withPreservedHeaders(response, NextResponse.redirect(url));
  }

  if (user && SUPER_ADMIN_ROUTES.has(request.nextUrl.pathname)) {
    const { data: permissions } = await supabase.rpc(
      "get_current_user_permissions",
    );
    const isSuperAdmin =
      Array.isArray(permissions) && Boolean(permissions[0]?.is_super_admin);

    if (!isSuperAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return withPreservedHeaders(response, NextResponse.redirect(url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)"],
};
