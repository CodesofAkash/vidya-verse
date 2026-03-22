// Force Node.js runtime — bcryptjs and crypto are NOT available in Edge
export const runtime = 'nodejs';

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);

          const user = await prisma.user.findUnique({
            where: { email },
            include: { college: true },
          });

          if (!user) return null;

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) return null;

          if (!user.isActive) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles as string[],
            // Store as boolean — our custom field, not NextAuth's email provider Date
            emailVerified: user.emailVerified,
            semester: user.semester,
            department: user.department as string | null,
            college: user.college?.name ?? null,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.emailVerified = user.emailVerified;
        token.semester = user.semester;
        token.department = user.department;
        token.college = user.college;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
        // Cast to any first to bypass NextAuth's built-in Date type, then to boolean
        (session.user as any).emailVerified = token.emailVerified as boolean;
        session.user.semester = token.semester as number | null;
        session.user.department = token.department as string | null;
        session.user.college = token.college as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
});