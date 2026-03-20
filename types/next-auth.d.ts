import { UserRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string | null;
    roles: UserRole[];
    emailVerified: boolean;
    semester: number | null;
    department: string | null;
    college: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      roles: UserRole[];
      emailVerified: boolean;
      semester: number | null;
      department: string | null;
      college: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: UserRole[];
    emailVerified: boolean;
    semester: number | null;
    department: string | null;
    college: string | null;
  }
}