import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { Role } from "@/lib/roles";

// Add paths that require authentication here
const protectedPaths = ["/dashboard", "/super-admin"];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the path matches any of our protected routes
    const isProtectedPath = protectedPaths.some(
        (path) => pathname === path || pathname.startsWith(path + "/")
    );

    if (isProtectedPath) {
        const token = request.cookies.get("auth-token")?.value;

        if (!token) {
            // Redirect to login if no token is found
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        try {
            // Verify token
            const payload = await verifyToken(token);

            if (!payload) {
                throw new Error("Invalid token");
            }

            // Check role-based access for super-admin routes
            if (pathname.startsWith("/super-admin") && payload.role !== Role.SUPER_ADMIN) {
                // Regular users trying to access super-admin area get redirected to dashboard
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }

            // Attach user info to headers for downstream use
            // Note: Downstream APIs should trust these headers because they are overwritten 
            // here by the middleware, preventing client forgery attacks.
            // (Next.js doesn't allow attaching directly to req in middleware)
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set("x-user-id", payload.userId);
            requestHeaders.set("x-user-role", payload.role);

            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        } catch (error) {
            // Token is invalid or expired
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            // Delete the invalid cookie as part of the redirect
            const response = NextResponse.redirect(loginUrl);
            response.cookies.delete("auth-token");
            return response;
        }
    }

    // Redirect authenticated users away from /login
    if (pathname === "/login") {
        const token = request.cookies.get("auth-token")?.value;
        if (token) {
            try {
                const payload = await verifyToken(token);
                if (payload) {
                    // Send them to the right dashboard based on role
                    if (payload.role === Role.SUPER_ADMIN) {
                        return NextResponse.redirect(new URL("/super-admin", request.url));
                    }
                    return NextResponse.redirect(new URL("/dashboard", request.url));
                }
            } catch (e) {
                // Token invalid, let them stay on login page
            }
        }
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
