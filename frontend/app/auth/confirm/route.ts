import { NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email",
  "email_change",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return Boolean(value && OTP_TYPES.includes(value as EmailOtpType));
}

function getSafeNextPath(nextParam: string | null) {
  if (!nextParam || !nextParam.startsWith("/")) return "/";
  return nextParam;
}

function withPreservedCookies(baseResponse: NextResponse, redirectResponse: NextResponse) {
  baseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorUrl = new URL("/signup/verify-email", requestUrl.origin);
    errorUrl.searchParams.set(
      "error",
      "Configuracao de autenticacao ausente no servidor.",
    );
    return NextResponse.redirect(errorUrl);
  }

  const url = supabaseUrl as string;
  const anonKey = supabaseAnonKey as string;

  let response = NextResponse.next({ request });

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

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return withPreservedCookies(
        response,
        NextResponse.redirect(new URL(next, requestUrl.origin)),
      );
    }
  }

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return withPreservedCookies(
        response,
        NextResponse.redirect(new URL(next, requestUrl.origin)),
      );
    }
  }

  const errorUrl = new URL("/signup/verify-email", requestUrl.origin);
  errorUrl.searchParams.set(
    "error",
    "Nao foi possivel confirmar seu e-mail. Tente novamente usando o link mais recente.",
  );
  return NextResponse.redirect(errorUrl);
}
