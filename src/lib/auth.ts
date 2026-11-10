import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { safeEqual } from "@/lib/safe-compare";
import { loginSchema } from "@/lib/schemas/login";
import {
  adjusterSessionVersion,
  ensureStaffForAdjuster,
  LoginError,
  LOGIN_ERRORS,
  verifyAdjusterLogin,
} from "@/lib/security/adjuster-login";
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
    sessionVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: StaffRole;
    sessionVersion?: number;
    revoked?: boolean;
  }
}

function authSecret() {
  const secret = process.env.NEXTAUTH_SECRET?.trim() || process.env.AUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "development") return "blackletter-local-dev-only";
  throw new Error("NEXTAUTH_SECRET is not set.");
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
        otp: { label: "Authenticator code", type: "text" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) throw new Error(LOGIN_ERRORS.invalid);

        try {
          const adjuster = await verifyAdjusterLogin({
            email: parsed.data.email,
            password: parsed.data.password,
            otp: credentials?.otp || null,
            req,
          });
          const staff = await ensureStaffForAdjuster(adjuster);
          return {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            role: staff.role as StaffRole,
            sessionVersion: adjuster.sessionVersion,
          };
        } catch (error) {
          if (error instanceof LoginError) throw new Error(error.message);
          console.error("authorize failed", error);
          throw new Error(LOGIN_ERRORS.invalid);
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
        token.sessionVersion = user.sessionVersion;
        token.revoked = false;
        return token;
      }
      if (token.revoked) return token;
      const email =
        typeof token.email === "string" ? token.email.toLowerCase() : null;
      if (email) {
        try {
          const live = await adjusterSessionVersion(email);
          if (!live || !live.isActive || (token.sessionVersion ?? 0) !== Number(live.sessionVersion)) {
            token.revoked = true;
            return token;
          }
          const staff = await prisma.staff.findFirst({
            where: { email, isActive: true },
            select: { id: true, role: true },
          });
          if (staff) {
            token.id = staff.id;
            token.role = staff.role as StaffRole;
          } else {
            token.revoked = true;
          }
        } catch {
          // keep existing token if DB is briefly unavailable
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.revoked) {
        return { ...session, user: undefined as unknown as typeof session.user };
      }
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
    const session = await getServerSession(authOptions);
    return session?.user?.id ? session : null;
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
  return safeEqual(token, key);
}
