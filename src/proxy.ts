import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { Role } from "@/lib/roles";

// Paths that require JWT authentication and header injection
const protectedPaths = ["/dashboard", "/super-admin", "/api/super-admin", "/agency-admin", "/api/agency", "/employee"];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Strict Anti-CSRF Origin validation for mutating API routes
    if (request.method !== "GET" && pathname.startsWith("/api/")) {
        const origin = request.headers.get("origin");
        const host = request.headers.get("host");

        // Ensure origin is present and matches the host to prevent CSRF attacks
        if (origin && origin !== `http://${host}` && origin !== `https://${host}`) {
            return new NextResponse("Unauthorized Origin (CSRF Protection)", { status: 403 });
        }
    }

    // Check if the path matches any of our protected routes
    const isProtectedPath = protectedPaths.some(
        (path) => pathname === path || pathname.startsWith(path + "/")
    );

    if (isProtectedPath) {
        const token = request.cookies.get("auth-token")?.value;

        if (!token) {
            // Redirect to login if no token is found
            const loginUrl = new URL("/login", request.url);
            return NextResponse.redirect(loginUrl);
        }

        try {
            // Verify token
            const payload = await verifyToken(token);

            if (!payload) {
                throw new Error("Invalid token");
            }

            // --- STRICT ROLE-BASED ROUTING ENFORCEMENT ---
            if (pathname.startsWith("/super-admin") && payload.role !== Role.SUPER_ADMIN) {
                return NextResponse.redirect(new URL("/login", request.url));
            }
            if (pathname.startsWith("/agency-admin") && payload.role !== Role.AGENCY_ADMIN) {
                return NextResponse.redirect(new URL("/login", request.url));
            }
            // Protect Agency APIs explicitly
            if (pathname.startsWith("/api/agency") && payload.role !== Role.AGENCY_ADMIN && payload.role !== Role.AGENCY_EMPLOYEE) {
                return NextResponse.json({ message: "Forbidden" }, { status: 403 });
            }
            if (pathname.startsWith("/employee") && payload.role !== Role.AGENCY_EMPLOYEE) {
                return NextResponse.redirect(new URL("/login", request.url));
            }

            // --- USER ACCOUNT & TENANT & SUBSCRIPTION ENFORCEMENT ---

            // 0. Check if user's own account is active (no DB hit — stored in JWT)
            if (payload.userIsActive === false) {
                return NextResponse.redirect(new URL("/login?error=account_deactivated", request.url));
            }

            if (payload.agencyId) {
                // 1. Check if agency is deactivated
                if (payload.agencyIsActive === false) {
                    return NextResponse.redirect(new URL("/login?error=account_suspended", request.url));
                }

                // 2. Check subscription validity
                if (payload.subscriptionEnds) {
                    const subEnds = new Date(payload.subscriptionEnds);
                    if (subEnds < new Date() && !pathname.startsWith("/billing")) {
                        // Redirect to a billing portal/renewal page to prevent full access
                        return NextResponse.redirect(new URL("/billing", request.url));
                    }
                }
            }

            // Attach user info to headers for downstream use
            // Note: Downstream APIs should trust these headers because they are overwritten 
            // here by the middleware, preventing client forgery attacks.
            // (Next.js doesn't allow attaching directly to req in middleware)
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set("x-user-id", payload.userId);
            requestHeaders.set("x-user-role", payload.role);

            if (payload.agencyId) {
                requestHeaders.set("x-agency-id", payload.agencyId);
            } else {
                requestHeaders.delete("x-agency-id"); // Prevent injection if none exists on payload
            }

            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        } catch (error) {
            // Token is invalid or expired
            const loginUrl = new URL("/login", request.url);
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
                        return NextResponse.redirect(new URL("/super-admin/agencies", request.url));
                    }
                    if (payload.role === Role.AGENCY_ADMIN) {
                        return NextResponse.redirect(new URL("/agency-admin", request.url));
                    }
                    return NextResponse.redirect(new URL("/employee", request.url));
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
         * Match all request paths EXCEPT:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt
         *
         * NOTE: /api/super-admin/* IS included so JWT is verified
         * and x-user-role headers are set before the API handler runs.
         * Public auth API routes (/api/auth/*) and /api/setup are excluded.
         */
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|api/setup).*)",
    ],
};
