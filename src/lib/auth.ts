import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas/login";
import type { StaffRole } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: StaffRole;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: StaffRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: StaffRole;
  }
}

function authSecret() {
  return (
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    "blackletter-set-NEXTAUTH_SECRET-in-vercel"
  );
}

export const authOptions: NextAuthOptions = {
  secret: authSecret(),
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
    updateAge: 30 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        try {
          const staff = await prisma.staff.findUnique({
            where: { email: parsed.data.email.toLowerCase() },
          });

          if (!staff || !staff.isActive) return null;

          const valid = await compare(parsed.data.password, staff.passwordHash);
          if (!valid) return null;

          return {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            role: staff.role as StaffRole,
          };
        } catch (error) {
          console.error("authorize failed", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
      }
      const email =
        typeof token.email === "string" ? token.email.toLowerCase() : null;
      if (email) {
        try {
          const staff = await prisma.staff.findFirst({
            where: { email, isActive: true },
            select: { id: true, role: true },
          });
          if (staff) {
            token.id = staff.id;
            token.role = staff.role as StaffRole;
          }
        } catch {
          // keep existing token if DB is briefly unavailable
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as StaffRole;
      }
      return session;
    },
  },
};

export async function getSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("getSession failed", error);
    return null;
  }
}

export async function resolveSessionStaff(session: {
  user?: { id?: string; email?: string | null; role?: StaffRole } | null;
}) {
  const email = session.user?.email?.toLowerCase();
  const id = session.user?.id;

  if (id) {
    const byId = await prisma.staff.findFirst({
      where: { id, isActive: true },
      select: { id: true, email: true, name: true, role: true, licenseNumber: true },
    });
    if (byId) return { ...byId, role: byId.role as StaffRole };
  }

  if (email) {
    const byEmail = await prisma.staff.findFirst({
      where: { email, isActive: true },
      select: { id: true, email: true, name: true, role: true, licenseNumber: true },
    });
    if (byEmail) return { ...byEmail, role: byEmail.role as StaffRole };
  }

  return null;
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function canEdit(role: StaffRole): boolean {
  return role === "ADMIN" || role === "ADJUSTER";
}

export function canManageTemplates(role: StaffRole): boolean {
  return role === "ADMIN";
}

export function isServiceKey(header: string | null): boolean {
  const key = process.env.BLACKLETTER_API_KEY;
  if (!key || !header) return false;
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  return token === key;
}
