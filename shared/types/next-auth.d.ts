import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'buyer' | 'seller' | 'admin';
      avatarUrl?: string | null;
    } & DefaultSession['user'];
  }
  interface User {
    id: string;
    role: 'buyer' | 'seller' | 'admin';
    avatarUrl?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'buyer' | 'seller' | 'admin';
    avatarUrl?: string | null;
  }
}
