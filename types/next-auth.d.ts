import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
      // We store emailVerified as boolean in our DB and JWT, so override NextAuth's Date type
      emailVerified: boolean;
      semester: number | null;
      department: string | null;
      college: string | null;
    } & Omit<DefaultSession["user"], "emailVerified">;
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    roles: string[];
    emailVerified: boolean;
    semester: number | null;
    department: string | null;
    college: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: string[];
    emailVerified: boolean;
    semester: number | null;
    department: string | null;
    college: string | null;
  }
}