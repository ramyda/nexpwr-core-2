import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const pathname = req.nextUrl.pathname;
      if (pathname.startsWith("/admin") && token?.role !== "ADMIN") return false;
      if (pathname.startsWith("/client") && token?.role !== "CLIENT" && token?.role !== "ADMIN") return false;
      return !!token;
    },
  },
  pages: {
    signIn: "/login",
  }
});

export const config = { matcher: ["/admin/:path*", "/client/:path*", "/workspace/:path*"] };
