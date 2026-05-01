import type { NextAuthConfig } from 'next-auth';


export default {
  providers: [], // Providers moved to auth.ts to avoid Edge incompatibility
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const dashboardRoutes = ['/dashboard', '/pipeline', '/api-keys', '/usage', '/settings'];
      const isDashboard = dashboardRoutes.some(route => nextUrl.pathname.startsWith(route));
      
      if (isDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
