import NextAuth from 'next-auth';
import authConfig from './auth.config';

import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/client';

// Trust host is enabled via AUTH_TRUST_HOST env var
const _ = process.env.DATABASE_URL;
console.log('[Auth] Database configured:', !!_, 'Trust host:', process.env.AUTH_TRUST_HOST);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (credentials.email) {
          const email = credentials.email as string;
          
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
});
