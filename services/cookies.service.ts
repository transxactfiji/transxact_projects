import { cookies } from "next/headers";

type CookieSameSite = "lax" | "strict" | "none";

interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  sameSite?: CookieSameSite;
  secure?: boolean;
  httpOnly?: boolean;
  path?: string;
}

const DEFAULT_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
) {
  const cookieStore = await cookies();
  cookieStore.set(name, value, { ...DEFAULT_COOKIE_OPTIONS, ...options });
}

export async function getCookie(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

export async function deleteCookie(name: string) {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}
