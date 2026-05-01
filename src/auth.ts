import NextAuth from 'next-auth';
import authConfig from './auth.config';

import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/client';

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
