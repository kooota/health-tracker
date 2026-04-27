import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/api/sync/:path*",
    "/api/goals/:path*",
    "/api/healthplanet/:path*",
  ],
};

