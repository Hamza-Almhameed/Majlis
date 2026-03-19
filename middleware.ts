import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const publicRoutes = ["/login", "/register"];
const openRoutes = ["/privacy"];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const path = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);
  const isOpenRoute = openRoutes.includes(path);

  if (isOpenRoute) return NextResponse.next();

  let isValidToken = false;
  if (token) {
    try {
      await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET!)
      );
      isValidToken = true;
    } catch {
      isValidToken = false;
    }
  }

  if (isValidToken && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isValidToken && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};