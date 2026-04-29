import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        if (credentials.email) {
          const email = credentials.email as string;
          
          // Ensure the user exists in the DB to satisfy foreign keys
          const { prisma } = await import('@/lib/db/client');
          const user = await prisma.user.upsert({
            where: { email },
            update: { name: 'Vext User' },
            create: { email, name: 'Vext User' },
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        }
        return null;
      },
    }),
  ],
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
