import type { Role } from '@/lib/constants';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      fullName: string;
      role: Role;
      organizationId: string | null;
      organizationName: string | null;
    };
  }

  interface User {
    id: string;
    username: string;
    fullName: string;
    role: Role;
    organizationId: string | null;
    organizationName: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    fullName: string;
    role: Role;
    organizationId: string | null;
    organizationName: string | null;
  }
}
