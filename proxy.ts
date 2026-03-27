import { convexAuthNextjsMiddleware, nextjsMiddlewareRedirect } from "@convex-dev/auth/nextjs/server";

export const proxy = convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const { pathname } = request.nextUrl;
  const authenticated = await convexAuth.isAuthenticated();

  if ((pathname === "/login" || pathname === "/signup") && authenticated) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }

  if ((pathname.startsWith("/write") || pathname.startsWith("/admin")) && !authenticated) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
});

export const config = {
  matcher: ["/api/auth/:path*", "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
