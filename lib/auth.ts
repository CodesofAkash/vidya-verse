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

          // Find user
          const user = await prisma.user.findUnique({
            where: { email },
            include: { college: true },
          });

          if (!user) {
            throw new Error("Invalid credentials");
          }

          // Verify password
          const isValid = await bcrypt.compare(password, user.passwordHash);

          if (!isValid) {
            throw new Error("Invalid credentials");
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error("Account is deactivated");
          }

          // Return user object (this gets stored in session)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles,
            emailVerified: user.emailVerified,
            semester: user.semester,
            department: user.department,
            college: user.college?.name,
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
      if (token) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
        session.user.emailVerified = token.emailVerified as boolean;
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
});